import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { getMedia }                from "./core/anilist.js";
import { mapAnimeIds }             from "./core/mapper.js";
import mangaHandler                from "./providers/allmanga.js";
import reanimeHandler              from "./providers/reanime.js";
import anikotoHandler              from "./providers/anikoto.js";
import animeggHandler              from "./providers/animegg.js";
import aninekoHandler              from "./providers/anineko.js";
import anidbappHandler             from "./providers/anidbapp.js";
import dhiveHandler                from "./providers/2dhive.js";
import animenosubHandler           from "./providers/animenosub.js";
import anizoneHandler              from "./providers/anizone.js";
import anibdHandler                from "./providers/anibd.js";
import senshiHandler               from "./providers/senshi.js";
import kaaHandler                  from "./providers/kickassanime.js";
import animedunyaHandler           from "./providers/animedunya.js";
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

app.get('/watch/anidbapp/:id/:audio/anidbapp-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anidbapp:${id}:${audio}:${ep}`, () => anidbappHandler.fetch(c.req.raw));
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

app.get('/watch/anibd/:id/:audio/anibd-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:anibd:${id}:${audio}:${ep}`, () => anibdHandler.fetch(c.req.raw));
});

app.get('/watch/senshi/:id/:audio/senshi-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:senshi:${id}:${audio}:${ep}`, () => senshiHandler.fetch(c.req.raw));
});

app.get('/watch/kaa/:id/:audio/kaa-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:kaa:${id}:${audio}:${ep}`, () => kaaHandler.fetch(c.req.raw));
});

app.get('/watch/animedunya/:id/:audio/animedunya-:ep', async (c) => {
  const { id, audio, ep } = c.req.param();
  return cachedWatch(c, `watch:animedunya:${id}:${audio}:${ep}`, () => animedunyaHandler.fetch(c.req.raw));
});

app.get('/stream/2dhive/:id/:audio/:ep', async (c) => {
  return dhiveHandler.fetch(c.req.raw);
});

app.get('/stream/2dhive/download/:id/:audio/:ep', async (c) => {
  return dhiveHandler.fetch(c.req.raw);
});

app.get('/', (c) => {
  return json(c, {
    name: "Anivexa API 2.1 (Hono Edition)",
    cache: _CACHE_ENABLED,
    providers: [
      "allmanga",
      "reanime",
      "anikoto",
      "animegg",
      "anineko",
      "anidbapp",
      "2dhive",
      "animenosub",
      "anizone",
      "anibd",
      "senshi",
      "kaa",
      "animedunya",
    ],
    routes: [
      "/map/:anilistId",
      "/episodes/:anilistId",
      "/episodes/:provider[/:provider...]/:anilistId?map=true|false",
      "/watch/allmanga/:id/sub|dub/allmanga-:ep",
      "/watch/reanime/:id/sub|dub/reanime-:ep",
      "/stream/reanime/:id/sub|dub/:ep",
      "/watch/anikoto/:id/sub|dub/anikoto-:ep",
      "/watch/animegg/:id/sub|dub/animegg-:ep",
      "/watch/anineko/:id/sub|dub/anineko-:ep",
      "/watch/anidbapp/:id/sub|dub/anidbapp-:ep",
      "/watch/2dhive/:id/sub|dub/2dhive-:ep",
      "/stream/2dhive/:id/sub|dub/:ep",
      "/stream/2dhive/download/:id/sub|dub/:ep",
      "/watch/animenosub/:id/sub|dub/animenosub-:ep",
      "/watch/anizone/:id/sub|dub/anizone-:ep",
      "/watch/anibd/:id/sub|dub/anibd-:ep",
      "/watch/senshi/:id/sub|dub/senshi-:ep",
      "/watch/kaa/:id/sub|dub/kaa-:ep",
      "/watch/animedunya/:id/sub|dub/animedunya-:ep",
    ],
  });
});

export default app;
