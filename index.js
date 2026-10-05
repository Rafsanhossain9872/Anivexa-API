import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { getMedia }                from "./core/anilist.js";
import { mapAnimeIds }             from "./core/mapper.js";
import mangaHandler                from "./providers/allmanga.js";
import reanimeHandler              from "./providers/reanime.js";
import anikotoHandler              from "./providers/anikoto.js";
import aninekoHandler              from "./providers/anineko.js";
import dhiveHandler                from "./providers/2dhive.js";
import animenosubHandler           from "./providers/animenosub.js";
import anizoneHandler              from "./providers/anizone.js";
import animeggHandler              from './providers/animegg.js';
import { mediaProxy, fetchMedia, readPlaylist, resolveHLS } from './core/media-proxy.js';
import { toWebVTT } from './core/subtitles.js';
import { withDeadline, withRequestBudget, providerFetch } from './core/network.js';
import { firstSuccessfulProvider } from './core/provider-race.js';
import anibdHandler from './providers/anibd.js';
import anidbappHandler from './providers/anidbapp.js';
import kaaHandler from './providers/kickassanime.js';
import animedunyaHandler from './providers/animedunya.js';
import { getEpisodesResponse, getFilteredEpisodesResponse } from "./core/episode-cache.js";
import { resolveProviders }         from "./core/episode-strategy.js";
import { getAsync, setAsync, isFresh, mapTTL, WATCH_TTL, _CACHE_ENABLED, configureCache } from "./core/smartcache.js";

const app = new Hono();
app.use('*', async (c, next) => {
  configureCache(c.env);
  const edge = typeof WebSocketPair !== 'undefined';
  await withRequestBudget(next, edge ? 40 : 150, edge ? c.executionCtx.waitUntil.bind(c.executionCtx) : undefined, c.req.raw.signal);
});

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['GET', 'OPTIONS'],
}));

function json(c, data, status = 200) {
  c.header("Cache-Control", status >= 400 ? 'no-store' : 'public, max-age=300');
  return c.json(data, status);
}

function rewriteRequest(request, newPath) {
  const u = new URL(request.url);
  u.pathname = newPath;
  return new Request(u.toString(), { method: request.method, headers: request.headers });
}

const watchInflight = new Map();

async function cachedWatch(c, cacheKey, handlerFn) {
  const entry = await getAsync(cacheKey);
  if (entry && isFresh(entry)) return json(c, entry.data);

  if (watchInflight.has(cacheKey)) {
    await watchInflight.get(cacheKey).catch(() => {});
    const warm = await getAsync(cacheKey);
    if (warm && isFresh(warm)) return json(c, warm.data);
    const res = await handlerFn();
    c.header("Cache-Control", "no-store");
    return new Response(res.body, res);
  }

  const promise = (async () => {
    const response = await handlerFn();
    if (response.status === 200) {
      try {
        const data = await response.clone().json();
        if (!data?.error) await setAsync(cacheKey, data, Math.min(WATCH_TTL, 5 * 60 * 1000));
      } catch {}
    }
    return response;
  })();

  watchInflight.set(cacheKey, promise);
  try { 
    const res = await promise; 
    c.header("Cache-Control", "no-store");
    return new Response(res.body, res);
  } finally { 
    watchInflight.delete(cacheKey); 
  }
}

app.get('/metadata/:id{[0-9]+}', async c => {
  const id = Number(c.req.param('id'));
  const source = c.req.query('source') || 'anilist';
  if (!Number.isSafeInteger(id) || id <= 0 || !['anilist', 'mal'].includes(source)) return json(c, { error: 'Invalid metadata parameters' }, 400);
  try {
    const data = await withDeadline(async () => {
      let anilistId = id;
      if (source === 'mal') {
        const response = await providerFetch(`https://api.ani.zip/mappings?mal_id=${id}`);
        if (!response.ok) throw new Error('ID mapping unavailable');
        const mapping = await response.json();
        if (Number(mapping.mappings?.mal_id) !== id) throw new Error('ID mapping mismatch');
        anilistId = Number(mapping.mappings?.anilist_id);
        if (!Number.isSafeInteger(anilistId) || anilistId <= 0) throw new Error('AniList mapping unavailable');
      }
      const media = await getMedia(anilistId);
      if (source === 'mal' && Number(media.idMal) !== id) throw new Error('ID mapping mismatch');
      return {
        ...media, anilistId, isMAL: false, type: 'ANIME',
        genres: media.genres || [], tags: media.tags || [],
        coverImage: media.coverImage || { extraLarge: null, large: null, medium: null },
        characters: media.characters || { edges: [] },
        studios: media.studios || { nodes: [] },
        recommendations: media.recommendations || { nodes: [] },
        relations: media.relations || { edges: [] },
      };
    }, 6000);
    return json(c, data);
  } catch {
    return json(c, { error: 'Anime metadata is unavailable' }, 502);
  }
});

app.get('/map/:anilistId', async (c) => {
  const anilistId = c.req.param('anilistId');
  const cacheKey  = `map:${anilistId}`;
  const entry     = await getAsync(cacheKey);
  if (entry && isFresh(entry)) return json(c, entry.data);

  try {
    const [data, media] = await Promise.all([
      mapAnimeIds(anilistId),
      getMedia(anilistId).catch(() => null),
    ]);
    await setAsync(cacheKey, data, mapTTL(media?.status ?? "RELEASING"));
    return json(c, data);
  } catch (e) {
    if (entry) return json(c, entry.data);
    return json(c, { error: e.message }, 500);
  }
});

app.get('/episodes/:anilistId{[0-9]+}', async (c) => {
  const anilistId = c.req.param('anilistId');
  try {
    return json(c, await getEpisodesResponse(anilistId, { ...c.env, waitUntil: typeof WebSocketPair !== 'undefined' ? c.executionCtx.waitUntil.bind(c.executionCtx) : undefined }));
  } catch (e) {
    return json(c, { error: e.message }, 500);
  }
});

app.get('/episodes/*', async (c) => {
  const url = new URL(c.req.url);
  const path = url.pathname;
  const m = path.match(/^\/episodes\/((?:[\w-]+\/)+)(\d+)\/?$/i);
  if (m) {
    const rawNames  = m[1].replace(/\/$/, "").split("/");
    const anilistId = m[2];
    const includeMap = url.searchParams.get("map") !== "false";
    const { resolved, unknown } = resolveProviders(rawNames);

    if (resolved.size === 0) {
      return json(c, { error: "No valid providers specified", unknown }, 400);
    }

    try {
      const data = await getFilteredEpisodesResponse(anilistId, resolved, includeMap);
      if (unknown.length) data._unknownProviders = unknown;
      return json(c, data);
    } catch (e) {
      return json(c, { error: e.message }, 500);
    }
  }
  return c.notFound();
});

app.get('/watch/allmanga/:id/:audio/:ep{allmanga-[0-9]+}', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:manga:${id}:${audio}:${ep}`, () => mangaHandler.fetch(c.req.raw));
});

app.get('/watch/reanime/:id/:audio/:ep{reanime-[0-9]+}', async (c) => {
  const { id, audio, ep } = c.req.param();
  const variant = c.req.query('mode') === 'embed' ? ':embed' : '';
  return cachedWatch(c, `watch:reanime:${id}:${audio}:${ep}${variant}`, () => reanimeHandler.fetch(rewriteRequest(c.req.raw, `/watch/${id}/${audio}/${ep.replace('reanime-', '')}`)));
});

app.get('/stream/reanime/:id/:audio/:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return reanimeHandler.fetch(rewriteRequest(c.req.raw, `/stream/${id}/${audio}/${ep}`));
});

app.get('/watch/anikoto/:id/:audio/:ep{anikoto-[0-9]+}', async (c) => {
  const { id, audio, ep } = c.req.param();
  const variant = c.req.query('fast') === 'true' ? ':fast' : '';
  return cachedWatch(c, `watch:anikoto:${id}:${audio}:${ep}${variant}`, () => anikotoHandler.fetch(c.req.raw));
});

app.get('/watch/animegg/:id/:audio/:ep{animegg-[0-9]+}', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:animegg:${id}:${audio}:${ep}`, () => animeggHandler.fetch(c.req.raw));
});

app.get('/watch/anineko/:id/:audio/:ep{anineko-[0-9]+}', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anineko:${id}:${audio}:${ep}`, () => aninekoHandler.fetch(c.req.raw));
});

app.get('/watch/2dhive/:id/:audio/:ep{2dhive-[0-9]+}', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:2dhive:${id}:${audio}:${ep}`, () => dhiveHandler.fetch(c.req.raw));
});

app.get('/watch/animenosub/:id/:audio/:ep{animenosub-[0-9]+}', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:animenosub:${id}:${audio}:${ep}`, () => animenosubHandler.fetch(c.req.raw));
});

app.get('/watch/anizone/:id/:audio/:ep{anizone-[0-9]+}', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anizone:${id}:${audio}:${ep}`, () => anizoneHandler.fetch(c.req.raw));
});

app.get('/stream/2dhive/:id/:audio/:ep', async (c) => {
  return dhiveHandler.fetch(c.req.raw);
});

app.get('/stream/2dhive/download/:id/:audio/:ep', async (c) => {
  return dhiveHandler.fetch(c.req.raw);
});

// ── /api/watch — Server 1 Unified Endpoint ──
for (const [name, handler] of [['anibd', anibdHandler], ['anidbapp', anidbappHandler], ['kaa', kaaHandler], ['animedunya', animedunyaHandler]]) {
  app.get(`/watch/${name}/:id/:audio/:ep{${name}-[0-9]+}`, async c => cachedWatch(c, `watch:${name}:${c.req.param('id')}:${c.req.param('audio')}:${c.req.param('ep')}`, () => withDeadline(() => handler.fetch(c.req.raw))));
}
// First usable result across 7 providers; normalizes to frontend's expected format:
// { "ep_X": { streams: [...], subtitles: [...], intro: {}, outro: {} } }

const LANG_CODES = {
  eng: "English", en: "English", english: "English",
  jpn: "Japanese", ja: "Japanese", japanese: "Japanese",
  spa: "Spanish", es: "Spanish", spanish: "Spanish",
  fre: "French", fr: "French", french: "French",
  ger: "German", de: "German", german: "German",
  por: "Portuguese", pt: "Portuguese", portuguese: "Portuguese",
  ita: "Italian", it: "Italian", italian: "Italian",
  ara: "Arabic", ar: "Arabic", arabic: "Arabic",
  rus: "Russian", ru: "Russian", russian: "Russian",
  kor: "Korean", ko: "Korean", korean: "Korean",
  chi: "Chinese", zh: "Chinese", chinese: "Chinese",
  hin: "Hindi", hi: "Hindi", hindi: "Hindi",
  tur: "Turkish", tr: "Turkish", turkish: "Turkish",
  pol: "Polish", pl: "Polish", polish: "Polish",
  dut: "Dutch", nl: "Dutch", dutch: "Dutch",
  vie: "Vietnamese", vi: "Vietnamese", vietnamese: "Vietnamese",
  tha: "Thai", th: "Thai", thai: "Thai",
  ind: "Indonesian", id: "Indonesian", indonesian: "Indonesian",
  may: "Malay", ms: "Malay", malay: "Malay",
  rum: "Romanian", ro: "Romanian", romanian: "Romanian",
  hun: "Hungarian", hu: "Hungarian", hungarian: "Hungarian",
  gre: "Greek", el: "Greek", greek: "Greek",
  heb: "Hebrew", he: "Hebrew", hebrew: "Hebrew",
  swe: "Swedish", sv: "Swedish", swedish: "Swedish",
  cze: "Czech", cs: "Czech", czech: "Czech",
  fin: "Finnish", fi: "Finnish", finnish: "Finnish",
};

function detectSubLang(sub) {
  // 1. Direct fields
  if (sub.lang && sub.lang !== "Unknown") return sub.lang;
  if (sub.label) return sub.label;
  if (sub.srclang) {
    const mapped = LANG_CODES[sub.srclang.toLowerCase()];
    if (mapped) return mapped;
    return sub.srclang;
  }
  // 2. Extract from URL filename: ..._eng_5.ass or ..._eng.srt
  const url = sub.url || sub.file || "";
  const filename = url.split("/").pop() || "";
  const langMatch = filename.match(/[_.-]([a-z]{2,3})[_.-]?\d*\.[a-z]{2,4}$/i);
  if (langMatch) {
    const code = langMatch[1].toLowerCase();
    if (LANG_CODES[code]) return LANG_CODES[code];
  }
  // 3. Check anywhere in the URL for common patterns
  const urlLower = url.toLowerCase();
  for (const [code, name] of Object.entries(LANG_CODES)) {
    if (code.length >= 3 && urlLower.includes(`_${code}`) || urlLower.includes(`/${code}/`) || urlLower.includes(`-${code}.`) || urlLower.includes(`-${code}_`)) {
      return name;
    }
  }
  return "Unknown";
}

function normalizeReanime(rawRes) {
  const data = rawRes;
  const streams = [];
  const subtitles = [];
  let intro = { start: 0, end: 0 };
  let outro = { start: 0, end: 0 };

  // Include redirect_url (Worker /stream endpoint that 302s to the raw stream)
  if (data.redirect_url && !data.stream_url) {
    streams.push({ type: "hls", url: data.redirect_url });
  }
  // Primary HLS from stream_url
  if (data.stream_url) {
    streams.push({ type: "hls", url: data.stream_url, referer: data.referer || 'https://flixcloud.cc/' });
  }
  // Additional streams array
  if (Array.isArray(data.streams)) {
    for (const s of data.streams) {
      if (s.url && !streams.find(x => x.url === s.url)) {
        streams.push({ ...s, type: s.type || "hls", url: s.url });
      }
    }
  }
  // Include embed URLs from allServers (flixcloud embed pages with built-in decryption player)
  if (Array.isArray(data.allServers)) {
    for (const s of data.allServers) {
      if (s.embed && !streams.find(x => x.url === s.embed)) {
        streams.push({ type: "embed", url: s.embed, server: s.name });
      }
    }
  }
  // Subtitles
  if (Array.isArray(data.subtitles)) {
    for (const s of data.subtitles) {
      subtitles.push({ lang: detectSubLang(s), url: s.url || s.file || "" });
    }
  }
  // Intro/Outro — prefer intro_chapter, fallback to numeric fields
  if (data.intro && (data.intro.start || data.intro.end)) {
    intro = { start: Number(data.intro.start) || 0, end: Number(data.intro.end) || 0 };
  } else if (data.intro_start || data.intro_end) {
    intro = { start: Number(data.intro_start) || 0, end: Number(data.intro_end) || 0 };
  }
  if (data.outro && (data.outro.start || data.outro.end)) {
    outro = { start: Number(data.outro.start) || 0, end: Number(data.outro.end) || 0 };
  } else if (data.outro_start || data.outro_end) {
    outro = { start: Number(data.outro_start) || 0, end: Number(data.outro_end) || 0 };
  }

  if (streams.length === 0) return null;
  return { streams, subtitles, intro, outro };
}

function normalizeAnikoto(rawRes) {
  const data = rawRes;
  const streams = [];
  const subtitles = [];
  let intro = { start: 0, end: 0 };
  let outro = { start: 0, end: 0 };

  if (Array.isArray(data.streams)) {
    for (const s of data.streams) {
      if (s.url && (s.type === "hls" || s.url.includes(".m3u8"))) {
        streams.push({ ...s, type: "hls", url: s.url });
        // Grab intro/outro from the first HLS stream
        if (s.intro && (s.intro.start || s.intro.end) && !intro.end) {
          intro = { start: Number(s.intro.start) || 0, end: Number(s.intro.end) || 0 };
        }
        if (s.outro && (s.outro.start || s.outro.end) && !outro.end) {
          outro = { start: Number(s.outro.start) || 0, end: Number(s.outro.end) || 0 };
        }
      }
    }
  }
  if (Array.isArray(data.subtitles)) {
    for (const s of data.subtitles) {
      subtitles.push({ lang: detectSubLang(s), url: s.url || "" });
    }
  }

  if (streams.length === 0) return null;
  return { streams, subtitles, intro, outro };
}

function normalizeAllmanga(rawRes) {
  const data = rawRes;
  const streams = [];
  let intro = { start: 0, end: 0 };
  let outro = { start: 0, end: 0 };

  if (Array.isArray(data.sources)) {
    for (const s of data.sources) {
      const url = s.extractedUrl || s.url;
      if (url && (url.includes(".m3u8") || s.extractedType === "hls")) {
        streams.push({ ...s, type: "hls", url });
      }
    }
  }
  if (data.intro && (data.intro.start || data.intro.end)) {
    intro = { start: Number(data.intro.start) || 0, end: Number(data.intro.end) || 0 };
  }
  if (data.outro && (data.outro.start || data.outro.end)) {
    outro = { start: Number(data.outro.start) || 0, end: Number(data.outro.end) || 0 };
  }

  if (streams.length === 0) return null;
  return { streams, subtitles: [], intro, outro };
}

function normalizeAnineko(rawRes) {
  const data = rawRes;
  const streams = [];

  if (Array.isArray(data.streams)) {
    for (const s of data.streams) {
      const url = s.url || s.m3u8;
      if (url && (url.includes(".m3u8") || s.type === "hls")) {
        streams.push({ ...s, type: "hls", url });
      }
    }
  }

  if (streams.length === 0) return null;
  return { streams, subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 } };
}

function normalize2dhive(rawRes) {
  const data = rawRes;
  const streams = [];
  const subtitles = [];

  if (Array.isArray(data.streams)) {
    for (const s of data.streams) {
      if (s.url && (s.url.includes(".m3u8") || s.url.startsWith("/stream/"))) {
        streams.push({ ...s, type: "hls", url: s.url });
      }
      if (s.subtitle) {
        subtitles.push({ lang: "English", url: s.subtitle });
      }
    }
  }

  if (streams.length === 0) return null;
  return { streams, subtitles, intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 } };
}

function normalizeAnimenosub(rawRes) {
  const data = rawRes;
  const streams = [];

  if (Array.isArray(data.streams)) {
    for (const s of data.streams) {
      if (s.url && (s.type === "hls" || s.url.includes(".m3u8"))) {
        streams.push({ ...s, type: "hls", url: s.url });
      }
    }
  }

  if (streams.length === 0) return null;
  return { streams, subtitles: [], intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 } };
}

function normalizeAnizone(rawRes) {
  const data = rawRes;
  const streams = [];
  const subtitles = [];

  if (Array.isArray(data.streams)) {
    for (const s of data.streams) {
      if (s.url && (s.type === "hls" || s.url.includes(".m3u8"))) {
        streams.push({ ...s, type: "hls", url: s.url });
        if (Array.isArray(s.subtitles)) {
          for (const sub of s.subtitles) {
            subtitles.push({ lang: detectSubLang(sub), url: sub.url || "" });
          }
        }
      }
    }
  }

  if (streams.length === 0) return null;
  return { streams, subtitles, intro: { start: 0, end: 0 }, outro: { start: 0, end: 0 } };
}

async function tryProvider(provider, origin, signal) {
  const fakeReq = new Request(new URL(provider.path, origin), { method: 'GET', signal });
  const res = await provider.handler.fetch(fakeReq);
  if (!res.ok) { await res.body?.cancel(); return null; }
  const data = await res.json();
  return data?.error ? null : provider.normalize(data);
}

function playbackProviders(anilistId, audio, ep, embedOnly = false) {
  return [
    {
      name: "reanime",
      handler: reanimeHandler,
      path: `/watch/${anilistId}/${audio}/${ep}${embedOnly ? '?mode=embed' : ''}`,
      normalize: normalizeReanime,
    },
    {
      name: "anikoto",
      handler: anikotoHandler,
      path: `/watch/anikoto/${anilistId}/${audio}/anikoto-${ep}?fast=true`,
      normalize: normalizeAnikoto,
    },
    {
      name: "allmanga",
      handler: mangaHandler,
      path: `/watch/allmanga/${anilistId}/${audio}/allmanga-${ep}`,
      normalize: normalizeAllmanga,
    },
    {
      name: "anineko",
      handler: aninekoHandler,
      path: `/watch/anineko/${anilistId}/${audio}/anineko-${ep}`,
      normalize: normalizeAnineko,
    },
    {
      name: "2dhive",
      handler: dhiveHandler,
      path: `/watch/2dhive/${anilistId}/${audio}/2dhive-${ep}`,
      normalize: normalize2dhive,
    },
    {
      name: "animenosub",
      handler: animenosubHandler,
      path: `/watch/animenosub/${anilistId}/${audio}/animenosub-${ep}`,
      normalize: normalizeAnimenosub,
    },
    {
      name: "anizone",
      handler: anizoneHandler,
      path: `/watch/anizone/${anilistId}/${audio}/anizone-${ep}`,
      normalize: normalizeAnizone,
    },
  ];
}

app.get('/api/watch/:anilistId/:lang/:ep', async (c) => {
  const { anilistId, lang, ep } = c.req.param();
  const audio = lang === 'dub' ? 'dub' : 'sub';
  const origin = new URL(c.req.url).origin;
  const mode = c.req.query('mode');
  const embedOnly = mode === 'embed';
  // Always fetch fresh URLs: flixcloud tokens can be IP-locked and time-limited.
  c.header('Cache-Control', 'no-store');
  c.header('X-Playback-Mode', embedOnly ? 'embed' : 'native');
  const result = await firstSuccessfulProvider(playbackProviders(anilistId, audio, ep, embedOnly), async (provider, signal) => {
    const normalized = await tryProvider(provider, origin, signal);
    if (!normalized?.streams.length) return null;
    if (mode === 'hls' && !normalized.streams.some(stream => ['hls', 'mp4'].includes(stream.type))) return null;
    for (const stream of normalized.streams) stream.url = new URL(stream.url, c.req.url).href;
    return normalized;
  }, { signal: c.req.raw.signal, concurrency: embedOnly ? 1 : 3 });

  if (result) {
    c.header('X-Provider', result.provider.name);
    return c.json({ [`ep_${ep}`]: result.value });
  }

  return c.json({ error: "No streams found from any provider", anilistId, episode: ep, audio }, 404);
});

// HLS streaming endpoint: resolves stream URL + proxies M3U8 in ONE request.
// Follows the flixcloud M3U8 chain: master.m3u8 returns an encrypted path,
// which must be resolved to get the actual variant playlist with #EXTM3U tags.
app.get('/api/hls/:anilistId/:lang/:ep', async (c) => {
  const { anilistId, lang, ep } = c.req.param();
  const audio = lang === 'dub' ? 'dub' : 'sub';
  const origin = new URL(c.req.url).origin;
  const result = await firstSuccessfulProvider(playbackProviders(anilistId, audio, ep), async (provider, signal) => {
    // If AniKoto's first source is inaccessible, retain its full source fallback.
    const paths = provider.name === 'anikoto' ? [provider.path, provider.path.split('?')[0]] : [provider.path];
    const attempted = new Set();
    for (const path of paths) {
      signal.throwIfAborted();
      const normalized = await tryProvider({ ...provider, path }, origin, signal);
      if (!normalized?.streams.length) continue;
      for (const stream of normalized.streams.filter(s => s.type === 'hls' || s.url?.includes('.m3u8'))) {
        signal.throwIfAborted();
        const url = new URL(stream.url, c.req.url).href;
        if (attempted.has(url)) continue;
        attempted.add(url);
        try {
          return await resolveHLS(url, `${origin}/api/proxy`, stream.referer || stream.headers?.Referer || '', c.env);
        } catch { /* Try the next stream after inaccessible or invalid playlists. */ }
      }
    }
    return null;
  }, { signal: c.req.raw.signal });

  if (result) {
    result.value.headers.set('X-Provider', result.provider.name);
    return result.value;
  }
  return json(c, { error: 'No accessible HLS playlist was found' }, 502);
});

app.get('/api/subtitles', async c => {
  try {
    const response = await fetchMedia(c.req.query('url'), { headers: { Accept: 'text/*', 'User-Agent': 'Mozilla/5.0' } }, c.env);
    if (!response.ok) { await response.body?.cancel(); return json(c, { error: 'Subtitles are unavailable' }, 502); }
    return new Response(toWebVTT(await readPlaylist(response)), { headers: { 'Content-Type': 'text/vtt; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300', 'X-Content-Type-Options': 'nosniff' } });
  } catch { return json(c, { error: 'Could not load subtitles' }, 502); }
});

app.get('/api/proxy', async (c) => {
  try {
    return await mediaProxy(c.req.raw, c.env);
  } catch (e) {
    return c.json({ error: e.message }, e instanceof TypeError || /allowed|blocked|Private/.test(e.message) ? 400 : 502);
  }
});

app.get('/api/telegram/:id/:audio/:ep', async c => {
  const { id, audio, ep } = c.req.param();
  if (!/^\d+$/.test(id) || !['sub', 'dub'].includes(audio) || !/^\d+$/.test(ep)) return c.json({ error: 'Invalid episode parameters' }, 400);
  try {
    let registry;
    if (c.env.TELEGRAM_PLAYLISTS?.get) registry = { [`${id}:${audio}:${ep}`]: await c.env.TELEGRAM_PLAYLISTS.get(`${id}:${audio}:${ep}`, 'json') };
    else if (globalThis.process?.versions?.node && typeof WebSocketPair === 'undefined' && typeof EdgeRuntime === 'undefined') {
      const { readFile } = await import('node:fs/promises');
      registry = JSON.parse(await readFile(new URL('./telegram-streams.json', import.meta.url), 'utf8'));
    }
    const entry = registry?.[`${id}:${audio}:${ep}`];
    if (!entry?.url) return c.json({ error: 'No Telegram upload is registered for this episode' }, 404);
    c.header('Cache-Control', 'no-store');
    return c.json({ [`ep_${ep}`]: { streams: [{ type: 'telegram', url: entry.url }], subtitles: [] } });
  } catch { return c.json({ error: 'No Telegram upload is registered for this episode' }, 404); }
});

app.get('/api/telegram-playlist/:id/:audio/:ep', async c => {
  try {
    if (!globalThis.process?.versions?.node || typeof WebSocketPair !== 'undefined' || typeof EdgeRuntime !== 'undefined') return c.json({ error: 'Use the Telegram Worker PLAYLISTS binding on edge deployments' }, 503);
    const { readFile } = await import('node:fs/promises');
    const registry = JSON.parse(await readFile(new URL('./telegram-streams.json', import.meta.url), 'utf8'));
    const entry = registry[`${c.req.param('id')}:${c.req.param('audio')}:${c.req.param('ep')}`];
    if (!entry?.playlist) return c.notFound();
    return new Response(entry.playlist, { headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' } });
  } catch { return c.json({ error: 'Playlist not found' }, 404); }
});

app.get('/', (c) => {
  return json(c, {
    name: "Anivexa API 2.2 (Hono Edition)",
    cache: _CACHE_ENABLED,
    providers: [
      "allmanga",
      "reanime",
      "anikoto",
      "anineko",
      "2dhive",
      "animenosub",
      "anizone",
    ],
    routes: [
      "/metadata/:id?source=anilist|mal",
      "/map/:anilistId",
      "/episodes/:anilistId",
      "/episodes/:provider[/:provider...]/:anilistId?map=true|false",
      "/api/watch/:anilistId/:lang/:ep",
      "/watch/allmanga/:id/sub|dub/allmanga-:ep",
      "/watch/reanime/:id/sub|dub/reanime-:ep",
      "/stream/reanime/:id/sub|dub/:ep",
      "/watch/anikoto/:id/sub|dub/anikoto-:ep",
      "/watch/anineko/:id/sub|dub/anineko-:ep",
      "/watch/2dhive/:id/sub|dub/2dhive-:ep",
      "/stream/2dhive/:id/sub|dub/:ep",
      "/stream/2dhive/download/:id/sub|dub/:ep",
      "/watch/animenosub/:id/sub|dub/animenosub-:ep",
      "/watch/anizone/:id/sub|dub/anizone-:ep",
    ],
  });
});

export default app;
