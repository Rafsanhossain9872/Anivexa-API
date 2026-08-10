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
import { getEpisodesResponse, getFilteredEpisodesResponse } from "./core/episode-cache.js";
import { resolveProviders }         from "./core/episode-strategy.js";
import { getAsync, setAsync, isFresh, mapTTL, WATCH_TTL, _CACHE_ENABLED } from "./core/smartcache.js";

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['GET', 'OPTIONS'],
}));

function json(c, data, status = 200) {
  c.header("Cache-Control", "public, max-age=300");
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
    c.header("Cache-Control", "public, max-age=300");
    return new Response(res.body, res);
  }

  const promise = (async () => {
    const response = await handlerFn();
    if (response.status === 200) {
      try {
        const data = await response.clone().json();
        await setAsync(cacheKey, data, WATCH_TTL);
      } catch {}
    }
    return response;
  })();

  watchInflight.set(cacheKey, promise);
  try { 
    const res = await promise; 
    c.header("Cache-Control", "public, max-age=300");
    return new Response(res.body, res);
  } finally { 
    watchInflight.delete(cacheKey); 
  }
}

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
    return json(c, await getEpisodesResponse(anilistId, c.env));
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

app.get('/watch/allmanga/:id/:audio/allmanga-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:manga:${id}:${audio}:${ep}`, () => mangaHandler.fetch(c.req.raw));
});

app.get('/watch/reanime/:id/:audio/reanime-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:reanime:${id}:${audio}:${ep}`, () => reanimeHandler.fetch(rewriteRequest(c.req.raw, `/watch/${id}/${audio}/${ep}`)));
});

app.get('/stream/reanime/:id/:audio/:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return reanimeHandler.fetch(rewriteRequest(c.req.raw, `/stream/${id}/${audio}/${ep}`));
});

app.get('/watch/anikoto/:id/:audio/anikoto-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anikoto:${id}:${audio}:${ep}`, () => anikotoHandler.fetch(c.req.raw));
});

app.get('/watch/animegg/:id/:audio/animegg-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:animegg:${id}:${audio}:${ep}`, () => animeggHandler.fetch(c.req.raw));
});

app.get('/watch/anineko/:id/:audio/anineko-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anineko:${id}:${audio}:${ep}`, () => aninekoHandler.fetch(c.req.raw));
});

app.get('/watch/2dhive/:id/:audio/2dhive-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:2dhive:${id}:${audio}:${ep}`, () => dhiveHandler.fetch(c.req.raw));
});

app.get('/watch/animenosub/:id/:audio/animenosub-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:animenosub:${id}:${audio}:${ep}`, () => animenosubHandler.fetch(c.req.raw));
});

app.get('/watch/anizone/:id/:audio/anizone-:ep', async (c) => {
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
// Sequential fallback across 7 providers; normalizes to frontend's expected format:
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

  // Primary HLS from stream_url
  if (data.stream_url) {
    streams.push({ type: "hls", url: data.stream_url });
  }
  // Additional streams array
  if (Array.isArray(data.streams)) {
    for (const s of data.streams) {
      if (s.url && s.type === "hls" && !streams.find(x => x.url === s.url)) {
        streams.push({ type: "hls", url: s.url });
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
        streams.push({ type: "hls", url: s.url });
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
        streams.push({ type: "hls", url });
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
        streams.push({ type: "hls", url });
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
        streams.push({ type: "hls", url: s.url });
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
        streams.push({ type: "hls", url: s.url });
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
        streams.push({ type: "hls", url: s.url });
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

async function tryProvider(handler, path) {
  try {
    const fakeUrl = new URL(`https://dummy${path}`);
    const fakeReq = new Request(fakeUrl.toString(), { method: "GET" });
    const res = await handler.fetch(fakeReq);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

app.get('/api/watch/:anilistId/:lang/:ep', async (c) => {
  const anilistId = c.req.param('anilistId');
  const lang = c.req.param('lang');
  const ep = c.req.param('ep');
  const audio = lang === "dub" ? "dub" : "sub";
  const episodeKey = `ep_${ep}`;

  // Check cache first
  const cacheKey = `apiwatch:${anilistId}:${audio}:${ep}`;
  const cached = await getAsync(cacheKey);
  if (cached && isFresh(cached)) {
    c.header("Cache-Control", "public, max-age=300");
    return c.json(cached.data);
  }

  // Sequential fallback chain: reanime → anikoto → allmanga → anineko → 2dhive → animenosub → anizone
  const providers = [
    {
      name: "reanime",
      handler: reanimeHandler,
      path: `/watch/${anilistId}/${audio}/${ep}`,
      normalize: normalizeReanime,
    },
    {
      name: "anikoto",
      handler: anikotoHandler,
      path: `/watch/anikoto/${anilistId}/${audio}/anikoto-${ep}`,
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

  for (const provider of providers) {
    try {
      const rawData = await tryProvider(provider.handler, provider.path);
      if (!rawData || rawData.error) continue;

      const normalized = provider.normalize(rawData);
      if (!normalized || normalized.streams.length === 0) continue;

      const result = { [episodeKey]: normalized };

      // Cache successful result
      await setAsync(cacheKey, result, WATCH_TTL).catch(() => {});

      c.header("Cache-Control", "public, max-age=300");
      c.header("X-Provider", provider.name);
      return c.json(result);
    } catch {
      continue;
    }
  }

  return c.json({ error: "No streams found from any provider", anilistId, episode: ep, audio }, 404);
});

app.get('/api/proxy', async (c) => {
  const url = c.req.query('url');
  const referer = c.req.query('referer');
  if (!url) return c.json({ error: 'URL required' }, 400);

  const headers = new Headers();
  headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  headers.set('Accept', '*/*');
  headers.set('Accept-Language', 'en-US,en;q=0.9');
  headers.set('Sec-Fetch-Dest', 'empty');
  headers.set('Sec-Fetch-Mode', 'cors');
  headers.set('Sec-Fetch-Site', 'cross-site');

  let targetOrigin = '';
  try {
    targetOrigin = new URL(url).origin;
  } catch (e) {}

  if (referer) {
    headers.set('Referer', referer);
    try { headers.set('Origin', new URL(referer).origin); } catch(e) {}
  } else if (targetOrigin) {
    headers.set('Referer', targetOrigin + '/');
    headers.set('Origin', targetOrigin);
  }

  try {
    const response = await fetch(url, { headers });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    // Remove strict CORS headers from target if they exist
    responseHeaders.delete('Access-Control-Allow-Credentials');
    
    const contentType = responseHeaders.get('content-type') || '';
    if (contentType.includes('mpegurl') || contentType.includes('mpegURL') || url.includes('.m3u8')) {
      let bodyText = await response.text();
      const baseUrl = new URL(url);
      const reqUrl = new URL(c.req.url);
      const proxyBase = `${reqUrl.protocol}//${reqUrl.host}/api/proxy`;

      bodyText = bodyText.split('\n').map(line => {
        let trimmed = line.trim();
        if (!trimmed) return line;

        // Handle tags with URIs, e.g. #EXT-X-KEY:METHOD=AES-128,URI="key.bin"
        if (trimmed.startsWith('#') && trimmed.includes('URI=')) {
          return trimmed.replace(/URI="([^"]+)"/, (match, p1) => {
            try {
              const absUrl = new URL(p1, baseUrl).toString();
              const proxyUrl = `${proxyBase}?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(referer || '')}`;
              return `URI="${proxyUrl}"`;
            } catch (e) {
              return match;
            }
          });
        }

        // Handle playlist/segment URIs
        if (!trimmed.startsWith('#')) {
          try {
            const absUrl = new URL(trimmed, baseUrl).toString();
            const proxyUrl = `${proxyBase}?url=${encodeURIComponent(absUrl)}&referer=${encodeURIComponent(referer || '')}`;
            return proxyUrl;
          } catch (e) {
            return trimmed;
          }
        }

        return trimmed;
      }).join('\n');

      return new Response(bodyText, {
        status: response.status,
        headers: responseHeaders
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.get('/', (c) => {
  return json(c, {
    name: "Anivexa API 2.1 (Hono Edition)",
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
