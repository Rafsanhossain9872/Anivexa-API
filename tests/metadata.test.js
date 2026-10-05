import test from 'node:test';
import assert from 'node:assert/strict';
import { getMedia, forgetMedia } from '../core/anilist.js';
import { mapAnimeIds } from '../core/mapper.js';
import app from '../index.js';

test('blocked AniList and unavailable Jikan do not prevent title-based discovery through AniZip', async t => {
  const id = 204011;
  forgetMedia(id);
  t.after(() => forgetMedia(id));
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (value, options) => {
    const url = new URL(value);
    requests.push(url.hostname);
    if (url.hostname === 'graphql.anilist.co') return Response.json({ errors: [{ message: 'Blocked', status: 403 }] }, { status: 403 });
    assert.equal(url.hostname, 'api.ani.zip', 'No slow ARM/Jikan request is needed once titles are available');
    assert.equal(url.searchParams.get('anilist_id'), String(id));
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({
      titles: { en: 'Psyren', 'x-jat': 'Psyren', ja: 'PSYЯEN' },
      mappings: { anilist_id: id, mal_id: 63098, type: 'TV' },
      episodes: {}, episodeCount: 0,
      images: [{ coverType: 'Poster', url: 'https://images.example/psyren.jpg' }],
    });
  });
  const media = await getMedia(id);
  assert.equal(media.id, 204011);
  assert.equal(media.idMal, 63098);
  assert.equal(media.title.english, 'Psyren');
  assert.equal(media.title.native, 'PSYЯEN');
  assert.equal(media.format, 'TV');
  assert.equal(media.episodes, null);
  assert.equal(media.seasonYear, null);
  assert.equal(media.status, 'RELEASING');
  assert.equal(media.coverImage.large, 'https://images.example/psyren.jpg');
  assert.equal(media._metadataSource, 'anizip');
  assert.deepEqual(media.synonyms, ['Psyren', 'PSYЯEN']);
  assert.strictEqual(await getMedia(id), media);
  assert.deepEqual(requests, ['graphql.anilist.co', 'api.ani.zip']);
});

test('AniZip fallback keeps the release year needed to disambiguate sequels', async t => {
  const id = 444001;
  forgetMedia(id);
  t.after(() => forgetMedia(id));
  t.mock.method(globalThis, 'fetch', async value => new URL(value).hostname === 'graphql.anilist.co'
    ? new Response('Unavailable', { status: 503 })
    : Response.json({
      titles: { en: 'Test Season 2', 'x-jat': 'Test 2' },
      mappings: { anilist_id: id, mal_id: 444002, type: 'TV' },
      episodeCount: 12,
      episodes: { '2': { airDate: '2024-04-12' }, '1': { airDate: '2024-04-05' }, S1: { airDate: '2023-12-01' } },
    }));
  const media = await getMedia(id);
  assert.equal(media.seasonYear, 2024);
  assert.deepEqual(media.startDate, { year: 2024 });
  assert.equal(media.episodes, 12);
});

test('wrong-ID or untitled AniZip responses retain the ARM/Jikan fallback', async t => {
  for (const [id, mapping] of [
    [444010, { titles: { en: 'Wrong Anime' }, mappings: { anilist_id: 444999, mal_id: 1 } }],
    [444011, { titles: {}, mappings: { anilist_id: 444011, mal_id: 1 } }],
  ]) {
    forgetMedia(id);
    t.after(() => forgetMedia(id));
    const mocked = t.mock.method(globalThis, 'fetch', async value => {
      const url = new URL(value);
      if (url.hostname === 'graphql.anilist.co') return new Response('Blocked', { status: 403 });
      if (url.hostname === 'api.ani.zip') return Response.json(mapping);
      if (url.hostname === 'arm.haglund.dev') return Response.json({ myanimelist: 444012 });
      assert.equal(url.pathname, '/v4/anime/444012');
      return Response.json({ data: { title: 'Correct Anime', title_english: 'Correct Anime', status: 'Finished Airing', type: 'TV', episodes: 12, year: 2024 } });
    });
    const media = await getMedia(id);
    assert.equal(media.id, id);
    assert.equal(media.idMal, 444012);
    assert.equal(media.title.english, 'Correct Anime');
    assert.equal(media.status, 'FINISHED');
    mocked.mock.restore();
  }
});

test('authoritative AniList metadata wins without requesting a fallback', async t => {
  const id = 444020;
  forgetMedia(id);
  t.after(() => forgetMedia(id));
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async value => {
    assert.equal(new URL(value).hostname, 'graphql.anilist.co');
    requests++;
    return Response.json({ data: { Media: { id, idMal: 444021, title: { english: 'Original Title' }, status: 'FINISHED', episodes: 24 } } });
  });
  const media = await getMedia(id);
  assert.equal(media.status, 'FINISHED');
  assert.equal(media.episodes, 24);
  assert.equal(requests, 1);
});

test('/map preserves the MAL ID from available media when ARM is down', async t => {
  const id = 444030;
  forgetMedia(id);
  t.after(() => forgetMedia(id));
  t.mock.method(globalThis, 'fetch', async value => new URL(value).hostname === 'graphql.anilist.co'
    ? Response.json({ data: { Media: { id, idMal: 444031, title: { english: 'Test Anime' }, status: 'FINISHED', synonyms: [] } } })
    : new Response('Unavailable', { status: 503 }));
  const result = await mapAnimeIds(id);
  assert.equal(result.mappings.aniId, id);
  assert.equal(result.mappings.malId, 444031);
  assert.equal(result.mappings.title, 'Test Anime');
});

test('/metadata supplies Watch-compatible details with no Python service', async t => {
  const id = 555010;
  forgetMedia(id);
  t.after(() => forgetMedia(id));
  t.mock.method(globalThis, 'fetch', async value => new URL(value).hostname === 'graphql.anilist.co'
    ? new Response('Blocked', { status: 403 })
    : Response.json({ titles: { en: 'Test Anime' }, mappings: { anilist_id: id, mal_id: 555011, type: 'TV' }, images: [{ coverType: 'Poster', url: 'https://images.example/test.jpg' }] }));
  const response = await app.fetch(new Request(`https://api.example/metadata/${id}`), { CACHE_ENABLED: 'false' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  const media = await response.json();
  assert.equal(media.id, id);
  assert.equal(media.anilistId, id);
  assert.equal(media.idMal, 555011);
  assert.equal(media.title.english, 'Test Anime');
  assert.equal(media.coverImage.large, 'https://images.example/test.jpg');
  assert.deepEqual(media.characters.edges, []);
  assert.deepEqual(media.studios.nodes, []);
});

test('/metadata explicitly maps MAL IDs instead of treating them as AniList IDs', async t => {
  const malId = 555020, anilistId = 555021;
  forgetMedia(anilistId);
  t.after(() => forgetMedia(anilistId));
  t.mock.method(globalThis, 'fetch', async (value, options) => {
    const url = new URL(value);
    if (url.hostname === 'api.ani.zip') {
      assert.equal(url.searchParams.get('mal_id'), String(malId));
      return Response.json({ mappings: { mal_id: malId, anilist_id: anilistId } });
    }
    assert.equal(JSON.parse(options.body).variables.id, anilistId);
    return Response.json({ data: { Media: { id: anilistId, idMal: malId, title: { english: 'Mapped Anime' }, status: 'FINISHED' } } });
  });
  const response = await app.fetch(new Request(`https://api.example/metadata/${malId}?source=mal`), { CACHE_ENABLED: 'false' });
  assert.equal(response.status, 200);
  const media = await response.json();
  assert.equal(media.id, anilistId);
  assert.equal(media.idMal, malId);
  assert.equal(media.anilistId, anilistId);
});

test('/metadata rejects invalid sources and mismatched mappings', async t => {
  const invalid = await app.fetch(new Request('https://api.example/metadata/123?source=tmdb'), { CACHE_ENABLED: 'false' });
  assert.equal(invalid.status, 400);
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => { requests++; return Response.json({ mappings: { mal_id: 999, anilist_id: 555030 } }); });
  const mismatched = await app.fetch(new Request('https://api.example/metadata/123?source=mal'), { CACHE_ENABLED: 'false' });
  assert.equal(mismatched.status, 502);
  assert.equal(mismatched.headers.get('Cache-Control'), 'no-store');
  assert.equal(requests, 1);
});

test('a stalled AniList connection is aborted before it can starve the independent metadata fallback', async t => {
  const id = 555040;
  forgetMedia(id);
  t.after(() => forgetMedia(id));
  let aborted = false;
  t.mock.method(globalThis, 'fetch', (value, options) => {
    if (new URL(value).hostname === 'graphql.anilist.co') {
      return new Promise((_, reject) => options.signal.addEventListener('abort', () => { aborted = true; reject(options.signal.reason); }, { once: true }));
    }
    return Promise.resolve(Response.json({ titles: { en: 'Fallback Anime' }, mappings: { anilist_id: id, mal_id: 555041, type: 'TV' } }));
  });
  // Keep Node's event loop alive while the platform's unref'ed timeout fires.
  const keepAlive = setTimeout(() => {}, 5000);
  try {
    const media = await getMedia(id);
    assert.equal(media.title.english, 'Fallback Anime');
    assert.equal(aborted, true);
  } finally { clearTimeout(keepAlive); }
});
