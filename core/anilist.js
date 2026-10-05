const __name = (fn, _) => fn;
import { providerFetch as fetch } from './network.js';
function cacheMedia(id, media) {
  resolved.set(id, { data: media, expiresAt: Date.now() + (media.status === 'FINISHED' ? 86400000 : 300000) });
  if (resolved.size > 500) resolved.delete(resolved.keys().next().value);
}

var resolved = new Map();
var inflight = new Map();
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var ARM = "https://arm.haglund.dev/api/v2/ids";
var JIKAN = "https://api.jikan.moe/v4";
const ANIZIP = 'https://api.ani.zip/mappings';
var STATUS_MAP = {
  "Currently Airing": "RELEASING",
  "Finished Airing": "FINISHED",
  "Not yet aired": "NOT_YET_RELEASED",
  "On Hiatus": "HIATUS"
};

const AL_STATUS_MAP = {
  RELEASING: "RELEASING",
  FINISHED: "FINISHED",
  NOT_YET_RELEASED: "NOT_YET_RELEASED",
  CANCELLED: "FINISHED",
  HIATUS: "HIATUS",
};

async function fetchFromAniList(id) {
  const fullQuery = `query($id:Int){Media(id:$id,type:ANIME){id idMal title{english romaji native userPreferred} coverImage{extraLarge large medium color} bannerImage description(asHtml:false) genres duration averageScore isAdult countryOfOrigin status format episodes seasonYear startDate{year month day} synonyms nextAiringEpisode{episode airingAt timeUntilAiring}}}`;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query: fullQuery, variables: { id } }),
    signal: AbortSignal.timeout(1500),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const json = await res.json();
  return json.data?.Media ?? null;
}

async function fetchFromAniZip(id) {
  const res = await fetch(`${ANIZIP}?anilist_id=${id}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const mappedId = data.mappings?.anilist_id;
  if (mappedId != null && Number(mappedId) !== id) return null;
  const title = {
    english: data.titles?.en || null,
    romaji: data.titles?.['x-jat'] || null,
    native: data.titles?.ja || null,
  };
  if (!Object.values(title).some(value => typeof value === 'string' && value.trim())) return null;
  const dates = Object.entries(data.episodes ?? {})
    .filter(([number]) => /^\d+$/.test(number))
    .map(([, episode]) => episode.airDate || episode.airdate || episode.airDateUtc)
    .filter(value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))
    .sort();
  const year = dates.length ? Number(dates[0].slice(0, 4)) : null;
  const poster = data.images?.find(image => image.coverType === 'Poster')?.url || null;
  const banner = data.images?.find(image => ['Banner', 'Fanart'].includes(image.coverType))?.url || poster;
  return {
    id,
    idMal: Number(data.mappings?.mal_id || data.mappings?.myanimelist_id) || null,
    title,
    coverImage: { extraLarge: poster, large: poster, medium: poster },
    bannerImage: banner,
    description: null,
    genres: [],
    duration: null,
    averageScore: null,
    characters: { edges: [] },
    recommendations: { nodes: [] },
    relations: { edges: [] },
    studios: { nodes: [] },
    _metadataSource: 'anizip',
    type: 'ANIME',
    // AniZip has no authoritative airing status; use short-lived cache rules.
    status: 'RELEASING',
    format: data.mappings?.type?.toUpperCase() || null,
    episodes: Number(data.episodeCount) || null,
    seasonYear: year,
    startDate: year ? { year } : null,
    nextAiringEpisode: null,
    synonyms: [...new Set(Object.values(title).filter(Boolean))],
  };
}

async function getMedia(anilistId) {
  const id = Number(anilistId);
    if (resolved.has(id) && resolved.get(id).expiresAt > Date.now()) return resolved.get(id).data;
    resolved.delete(id);
  if (inflight.has(id)) return inflight.get(id);
  const promise = (async () => {
    const primary = await fetchFromAniList(id);
    if (primary) {
      const media = { ...primary, id, status: AL_STATUS_MAP[primary.status] || 'RELEASING', synonyms: primary.synonyms || [] };
      cacheMedia(id, media);
      return media;
    }
    // Cloudflare egress can be blocked by AniList while Jikan is unavailable.
    // Keep title/ID-based stream discovery working through an independent source.
    const mapped = await fetchFromAniZip(id).catch(() => null);
    if (mapped) {
      cacheMedia(id, mapped);
      return mapped;
    }
    const arm = await fetch(`${ARM}?source=anilist&id=${id}`, {
      headers: { "User-Agent": UA, "Accept": "application/json" }
    }).then((r) => {
      if (!r.ok) return null;
      return r.json();
    }).catch(() => null);

    const malId = arm?.myanimelist ?? null;

    if (!malId) {
      const al = await fetchFromAniList(id);
      if (!al) throw new Error(`No data found for AniList ID ${id}`);
      const media = {
        id,
        idMal: null,
        title: {
          english: al.title?.english ?? null,
          romaji: al.title?.romaji ?? null,
          native: al.title?.native ?? null,
        },
        status: AL_STATUS_MAP[al.status] ?? "RELEASING",
        format: al.format ?? null,
        episodes: al.episodes ?? null,
        seasonYear: al.seasonYear ?? null,
        startDate: al.startDate ?? null,
        nextAiringEpisode: al.nextAiringEpisode ?? null,
        synonyms: Array.isArray(al.synonyms) ? al.synonyms : [],
      };
      cacheMedia(id, media);
      inflight.delete(id);
      return media;
    }

    const al = await fetchFromAniList(id).catch(() => null);
    let jikan = null;
    for (let attempt = 0; attempt <= 4; attempt++) {
      const r = await fetch(`${JIKAN}/anime/${malId}`, { headers: { "User-Agent": UA, Accept: "application/json" } }).catch(() => null);
      if (!r) { if (al) break; throw new Error('Jikan is unavailable'); }
      if (r.status === 429) {
        const wait = (parseInt(r.headers.get("Retry-After") ?? "1") || 1) * 1e3 + attempt * 500;
        if (attempt < 4) {
          await new Promise((res) => setTimeout(res, wait));
          continue;
        }
        throw new Error(`Jikan 429 for MAL ID ${malId} (exhausted retries)`);
      }
      // On 5xx / network errors, fall back to AniList-only data if available rather than hard-failing.
      if (!r.ok) {
        if (al) break; // exit loop, jikan stays null, fall through to AniList fallback below
        throw new Error(`Jikan ${r.status}`);
      }
      jikan = await r.json();
      break;
    }
    const d = jikan?.data ?? null;
    // If Jikan was unavailable but we have AniList data, build a partial media object from AniList only.
    if (!d && al) {
      const media = {
        id,
        idMal: malId,
        title: {
          english: al.title?.english ?? null,
          romaji: al.title?.romaji ?? null,
          native: al.title?.native ?? null,
        },
        status: AL_STATUS_MAP[al.status] ?? "RELEASING",
        format: al.format ?? null,
        episodes: al.episodes ?? null,
        seasonYear: al.seasonYear ?? null,
        startDate: al.startDate ?? null,
        nextAiringEpisode: al.nextAiringEpisode ?? null,
        synonyms: Array.isArray(al.synonyms) ? al.synonyms : [],
      };
      cacheMedia(id, media);
      inflight.delete(id);
      return media;
    }
    if (!d) throw new Error(`Jikan returned no data for MAL ID ${malId}`);
    const media = {
      id,
      idMal: malId,
      title: {
        english: al?.title?.english ?? d.title_english ?? null,
        romaji: al?.title?.romaji ?? d.title ?? null,
        native: al?.title?.native ?? d.title_japanese ?? null,
      },
      status: AL_STATUS_MAP[al?.status] ?? STATUS_MAP[d.status] ?? "RELEASING",
      format: al?.format ?? d.type ?? null,
      episodes: al?.episodes ?? d.episodes ?? null,
      seasonYear: al?.seasonYear ?? d.year ?? null,
      startDate: al?.startDate ?? (d.aired?.from ? { year: new Date(d.aired.from).getFullYear() } : null),
      nextAiringEpisode: al?.nextAiringEpisode ?? null,
      synonyms: [
        ...(d.titles?.map((t) => t.title).filter(Boolean) ?? []),
        ...(Array.isArray(al?.synonyms) ? al.synonyms : []),
      ],
    };
    cacheMedia(id, media);
    inflight.delete(id);
    return media;
  })().finally(() => inflight.delete(id));
  inflight.set(id, promise);
  return promise;
}
__name(getMedia, "getMedia");

function forgetMedia(anilistId) {
  resolved.delete(Number(anilistId));
}

export { getMedia, forgetMedia };
