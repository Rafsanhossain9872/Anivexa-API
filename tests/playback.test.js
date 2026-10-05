import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../index.js';
import { firstSuccessfulProvider } from '../core/provider-race.js';
import { providerFetch, withDeadline, withRequestBudget } from '../core/network.js';
import reanime from '../providers/reanime.js';
import anikoto from '../providers/anikoto.js';
import allmanga from '../providers/allmanga.js';
import anineko from '../providers/anineko.js';
import dhive from '../providers/2dhive.js';
import animenosub from '../providers/animenosub.js';
import anizone from '../providers/anizone.js';
import { configureCache, del, set, SHOW_IDENTITY_TTL } from '../core/smartcache.js';

function delayed(value, milliseconds, signal, onAbort = () => {}) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const abort = () => {
      clearTimeout(timer);
      onAbort();
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve(value);
    }, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

function mockProviders(t, overrides = new Map()) {
  for (const handler of [reanime, anikoto, allmanga, anineko, dhive, animenosub, anizone]) {
    t.mock.method(handler, 'fetch', overrides.get(handler) || (async () => Response.json({ error: 'Unavailable' }, { status: 502 })));
  }
}

test('a fast usable result wins without waiting for slow providers; losing fetches are aborted', async t => {
  const cancelled = [];
  t.mock.method(globalThis, 'fetch', (url, options) => delayed(Response.json({ url }), url.includes('fast') ? 10 : 1000, options.signal, () => cancelled.push(url)));
  const result = await withRequestBudget(() => firstSuccessfulProvider(['slow-a', 'slow-b', 'fast'], async name => {
    const response = await providerFetch(`https://${name}.example/`);
    return response.json();
  }));
  assert.equal(result.provider, 'fast');
  assert.deepEqual(cancelled.sort(), ['https://slow-a.example/', 'https://slow-b.example/']);
});

test('failed or empty results immediately open slots for queued fallbacks', async () => {
  const started = [];
  const result = await firstSuccessfulProvider(['slow', 'empty', 'error', 'usable'], async (name, signal) => {
    started.push(name);
    if (name === 'slow') return delayed('too late', 1000, signal);
    if (name === 'empty') return null;
    if (name === 'error') throw new Error('Provider unavailable');
    return 'stream';
  }, { concurrency: 2 });
  assert.equal(result.provider, 'usable');
  assert.deepEqual(started, ['slow', 'empty', 'error', 'usable']);
});

test('concurrency stays bounded when every provider fails', async () => {
  let active = 0, maximum = 0;
  const result = await firstSuccessfulProvider([1, 2, 3, 4, 5, 6, 7], async (_, signal) => {
    maximum = Math.max(maximum, ++active);
    try { return await delayed(null, 5, signal); }
    finally { active--; }
  });
  assert.equal(result, null);
  assert.equal(maximum, 3);
  assert.equal(active, 0);
});

test('a timed-out provider releases its slot and aborts its fetch', async t => {
  let cancelled = false;
  t.mock.method(globalThis, 'fetch', (_, options) => delayed(Response.json({}), 1000, options.signal, () => { cancelled = true; }));
  const result = await firstSuccessfulProvider(['hung', 'fallback'], name => name === 'hung' ? providerFetch('https://hung.example/') : 'stream', { concurrency: 1, timeout: 15 });
  assert.equal(result.provider, 'fallback');
  assert.equal(cancelled, true);
});

test('client cancellation aborts active attempts and does not start queued providers', async () => {
  const controller = new AbortController();
  const started = [], cancelled = [];
  const promise = firstSuccessfulProvider([1, 2, 3, 4], (name, signal) => {
    started.push(name);
    return delayed('stream', 1000, signal, () => cancelled.push(name));
  }, { concurrency: 2, signal: controller.signal });
  await Promise.resolve();
  controller.abort();
  assert.equal(await promise, null);
  assert.deepEqual(started, [1, 2]);
  assert.deepEqual(cancelled, [1, 2]);
});

test('nested deadlines preserve parent cancellation and the shared request budget', async t => {
  const controller = new AbortController();
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return Response.json({}); });
  await withRequestBudget(async () => {
    await withDeadline(() => providerFetch('https://one.example/'));
    await assert.rejects(withDeadline(() => providerFetch('https://two.example/')), /budget exhausted/);
    controller.abort();
    await assert.rejects(withDeadline(() => providerFetch('https://three.example/')), { name: 'AbortError' });
  }, 1, undefined, controller.signal);
  assert.equal(requests, 1);
});

test('/api/watch skips embed-only responses and returns a fast normalized HLS result', async t => {
  let cancelled = false;
  mockProviders(t, new Map([
    [reanime, request => delayed(Response.json({ stream_url: 'https://slow.example/index.m3u8' }), 1000, request.signal, () => { cancelled = true; })],
    [anikoto, async () => Response.json({ streams: [{ type: 'embed', url: 'https://embed.example/player' }] })],
    [allmanga, async () => Response.json({ sources: [] })],
    [anineko, async () => Response.json({ streams: [{ type: 'hls', url: '/stream/valid.m3u8' }] })],
  ]));
  const response = await app.fetch(new Request('https://api.example/api/watch/16498/sub/1'), { CACHE_ENABLED: 'false' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Provider'), 'anineko');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await response.json()).ep_1.streams[0].url, 'https://api.example/stream/valid.m3u8');
  assert.equal(cancelled, true);
});

test('/api/hls waits for a valid playlist, skips blocked sources, and cancels slow playlist fetches', async t => {
  let cancelled = false;
  mockProviders(t, new Map([
    [reanime, async () => Response.json({ stream_url: 'https://slow.example/index.m3u8' })],
    [anikoto, async request => {
      return Response.json({ streams: [{ type: 'hls', url: 'https://blocked.example/index.m3u8' }] });
    }],
    [allmanga, async () => Response.json({ sources: [{ url: 'https://valid.example/index.m3u8' }] })],
  ]));
  t.mock.method(globalThis, 'fetch', (value, options) => {
    const url = new URL(value);
    if (url.hostname === 'slow.example') return delayed(new Response('#EXTM3U\nslow.ts'), 1000, options.signal, () => { cancelled = true; });
    if (url.hostname === 'blocked.example') return Promise.resolve(new Response('Forbidden', { status: 403 }));
    assert.equal(url.hostname, 'valid.example');
    return delayed(new Response('#EXTM3U\n#EXTINF:5,\nsegment.ts'), 10, options.signal);
  });
  const response = await app.fetch(new Request('https://api.example/api/hls/16498/sub/1'), { CACHE_ENABLED: 'false' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Provider'), 'allmanga');
  assert.match(response.headers.get('Content-Type'), /mpegurl/);
  assert.match(await response.text(), /https:\/\/api\.example\/api\/proxy\?url=https%3A%2F%2Fvalid\.example%2Fsegment\.ts/);
  assert.equal(cancelled, true);
});

test('/api/hls can use an alternate AniKoto source when its fast source is blocked', async t => {
  const modes = [];
  mockProviders(t, new Map([
    [anikoto, async request => {
      const fast = new URL(request.url).searchParams.get('fast') === 'true';
      modes.push(fast);
      const streams = [{ type: 'hls', url: 'https://blocked.example/index.m3u8' }];
      if (!fast) streams.push({ type: 'hls', url: 'https://alternate.example/index.m3u8' });
      return Response.json({ streams });
    }],
  ]));
  t.mock.method(globalThis, 'fetch', async value => new URL(value).hostname === 'blocked.example'
    ? new Response('Forbidden', { status: 403 })
    : new Response('#EXTM3U\n#EXTINF:5,\nsegment.ts'));
  const response = await app.fetch(new Request('https://api.example/api/hls/16498/sub/1'), { CACHE_ENABLED: 'false' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Provider'), 'anikoto');
  assert.deepEqual(modes, [true, false]);
  assert.match(await response.text(), /alternate\.example/);
});

test('unified routes retain failure status codes when no provider works', async t => {
  mockProviders(t);
  const watch = await app.fetch(new Request('https://api.example/api/watch/16498/dub/1'), { CACHE_ENABLED: 'false' });
  const hls = await app.fetch(new Request('https://api.example/api/hls/16498/dub/1'), { CACHE_ENABLED: 'false' });
  assert.equal(watch.status, 404);
  assert.equal(watch.headers.get('Cache-Control'), 'no-store');
  assert.equal(hls.status, 502);
});

test('embed mode resolves Reanime using one server-list request and no Worker decryption', async t => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async value => {
    const url = new URL(value);
    assert.equal(url.hostname, 'reanime.to');
    assert.equal(url.pathname, '/api/flix/204011/1');
    requests++;
    return Response.json({ success: true, servers: [
      { dataType: 'sub', dataLink: 'https://flixcloud.cc/embed/sub-1', serverName: 'HD-1' },
      { dataType: 's-sub', dataLink: 'https://flixcloud.cc/embed/sub-2', serverName: 'HD-2' },
      { dataType: 'dub', dataLink: 'https://flixcloud.cc/embed/dub-1', serverName: 'HD-1' },
    ] });
  });
  for (const handler of [anikoto, allmanga, anineko, dhive, animenosub, anizone]) {
    t.mock.method(handler, 'fetch', () => { assert.fail('No speculative scraper/decryption work is needed for the fast embed result'); });
  }
  for (const audio of ['sub', 'dub']) {
    const response = await app.fetch(new Request(`https://api.example/api/watch/204011/${audio}/1?mode=embed`), { CACHE_ENABLED: 'false' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Playback-Mode'), 'embed');
    assert.equal(response.headers.get('X-Provider'), 'reanime');
    const episode = (await response.json()).ep_1;
    assert.ok(episode.streams.every(stream => stream.type === 'embed'));
    assert.equal(episode.streams[0].url, audio === 'sub' ? 'https://flixcloud.cc/embed/sub-2' : 'https://flixcloud.cc/embed/dub-1');
  }
  assert.equal(requests, 2);
});

test('native watch mode skips embed-only provider results', async t => {
  mockProviders(t, new Map([
    [reanime, async () => Response.json({ allServers: [{ embed: 'https://embed.example/player', name: 'HD-1' }] })],
    [anikoto, async () => Response.json({ streams: [{ type: 'hls', url: 'https://cdn.example/native.m3u8' }] })],
  ]));
  const response = await app.fetch(new Request('https://api.example/api/watch/16498/sub/1?mode=hls'), { CACHE_ENABLED: 'false' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Provider'), 'anikoto');
  assert.equal((await response.json()).ep_1.streams[0].type, 'hls');
});

test('AniKoto fast mode reuses show identity and skips extra servers and downloads', async t => {
  configureCache({ CACHE_ENABLED: 'true', UPSTASH_REDIS_REST_URL: '', UPSTASH_REDIS_REST_TOKEN: '' });
  const cacheKey = 'np:anikoto:999999';
  set(cacheKey, { slug: 'test-anime', showId: '123', title: 'Test Anime' }, SHOW_IDENTITY_TTL);
  t.after(() => del(cacheKey));
  const requested = [];
  const stream = 'https://video.example/index.m3u8';
  t.mock.method(globalThis, 'fetch', async value => {
    const url = new URL(value);
    requested.push(url.href);
    if (url.hostname === 'graphql.anilist.co') return Response.json({ data: { Media: { id: 999999, idMal: 123, title: { english: 'Test Anime' }, status: 'FINISHED' } } });
    if (url.pathname === '/ajax/episode/list/123') return Response.json({ result: '<a data-id="1" data-num="1" data-ids="a,b"></a>' });
    if (url.pathname === '/ajax/server/list') return Response.json({ result: '<div class="type" data-type="sub"><ul><li data-link-id="first">First</li><li data-link-id="second">Second</li></ul></div><div class="type" data-type="dl"><ul><li data-link-id="download">Download</li></ul></div>' });
    if (url.pathname === '/ajax/server' && url.searchParams.get('get') === 'first') return Response.json({ result: { url: `https://embed.example/#${btoa(stream)}` } });
    assert.fail(`Unnecessary startup request: ${url.href}`);
  });
  const response = await anikoto.fetch(new Request('https://api.example/watch/anikoto/999999/sub/anikoto-1?fast=true'));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.streams.length, 1);
  assert.equal(data.streams[0].url, stream);
  assert.deepEqual(data.downloads, []);
  assert.equal(requested.length, 4);
});
