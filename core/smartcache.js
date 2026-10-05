import { providerFetch as fetch } from './network.js';

export let _CACHE_ENABLED = globalThis.process?.env?.CACHE_ENABLED !== 'false';
let UPSTASH_REDIS_REST_URL = '';
let UPSTASH_REDIS_REST_TOKEN = '';
let REDIS_ENABLED = false;

export function configureCache(env = {}) {
  const settings = { ...globalThis.process?.env, ...env };
  _CACHE_ENABLED = settings.CACHE_ENABLED !== 'false';
  UPSTASH_REDIS_REST_URL = settings.UPSTASH_REDIS_REST_URL || '';
  UPSTASH_REDIS_REST_TOKEN = settings.UPSTASH_REDIS_REST_TOKEN || '';
  REDIS_ENABLED = /^https:\/\//.test(UPSTASH_REDIS_REST_URL) && Boolean(UPSTASH_REDIS_REST_TOKEN);
}
configureCache();

function encodeEntry(entry) {
  return JSON.stringify(entry, (_, value) => value === Infinity ? "__Infinity__" : value);
}

function decodeEntry(raw) {
  return JSON.parse(raw, (_, value) => value === "__Infinity__" ? Infinity : value);
}

async function redisCommand(command) {
  if (!REDIS_ENABLED || typeof fetch !== "function") return null;
  const res = await fetch(UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.result ?? null;
}

async function redisWrite(key, entry) {
  if (!REDIS_ENABLED) return;
  const value = encodeEntry(entry);
  if (Number.isFinite(entry.ttl) && entry.ttl > 0) {
    await redisCommand(["SET", key, value, "PX", Math.ceil(entry.ttl)]);
    return;
  }
  await redisCommand(["SET", key, value]);
}

let diskRead  = () => null;
let diskWrite = () => {};
let diskDel   = () => {};



const MAX_MEM = 800;
const mem     = new Map();

function evict() {
  if (mem.size <= MAX_MEM) return;
  const drop = mem.size - MAX_MEM;
  let   n    = 0;
  for (const k of mem.keys()) {
    if (n++ >= drop) break;
    mem.delete(k);
  }
}

export function get(key) {
  if (!_CACHE_ENABLED) return null;
  let e = mem.get(key);
  if (e && e.expiresAt > Date.now()) return e;
  if (e) { mem.delete(key); diskDel(key); return null; }

  e = diskRead(key);
  if (!e) return null;

  mem.set(key, e);
  evict();
  return e;
}

export async function getAsync(key) {
  if (!_CACHE_ENABLED) return null;
  let e = get(key);
  if (e) return e;

  const raw = await redisCommand(["GET", key]);
  if (!raw) return null;

  try {
    e = typeof raw === "string" ? decodeEntry(raw) : raw;
    if (!isFresh(e)) {
      await delAsync(key);
      return null;
    }
    mem.set(key, e);
    evict();
    diskWrite(key, e);
    return e;
  } catch {
    return null;
  }
}

function setLocal(key, data, ttlMs, refreshAfterMs) {
  const now   = Date.now();
  const entry = {
    data,
    cachedAt:     now,
    ttl:          ttlMs,
    refreshAfter: refreshAfterMs ?? ttlMs,
    expiresAt:    now + ttlMs,
  };
  mem.delete(key);
  mem.set(key, entry);
  evict();
  diskWrite(key, entry);
  return entry;
}

export function set(key, data, ttlMs, refreshAfterMs) {
  if (!_CACHE_ENABLED) return { data, cachedAt: Date.now(), ttl: ttlMs, refreshAfter: refreshAfterMs ?? ttlMs, expiresAt: Date.now() + ttlMs };
  const entry = setLocal(key, data, ttlMs, refreshAfterMs);
  redisWrite(key, entry).catch(() => {});
  return entry;
}

export async function setAsync(key, data, ttlMs, refreshAfterMs) {
  if (!_CACHE_ENABLED) return { data, cachedAt: Date.now(), ttl: ttlMs, refreshAfter: refreshAfterMs ?? ttlMs, expiresAt: Date.now() + ttlMs };
  const entry = setLocal(key, data, ttlMs, refreshAfterMs);
  await redisWrite(key, entry);
  return entry;
}

export function isFresh(entry) {
  return entry !== null && entry !== undefined && Date.now() < entry.expiresAt;
}

export function needsRefresh(entry) {
  return !entry || Date.now() - entry.cachedAt > entry.refreshAfter;
}

function delLocal(key) {
  mem.delete(key);
  diskDel(key);
}

export function del(key) {
  delLocal(key);
  redisCommand(["DEL", key]).catch(() => {});
}

export async function delAsync(key) {
  delLocal(key);
  await redisCommand(["DEL", key]);
}

export function delByPrefix(prefix) {
  for (const k of [...mem.keys()]) {
    if (k.startsWith(prefix)) mem.delete(k);
  }
}

export async function delByPrefixAsync(prefix) {
  delByPrefix(prefix);
  const keys = await redisCommand(["KEYS", `${prefix}*`]);
  if (Array.isArray(keys) && keys.length) {
    await redisCommand(["DEL", ...keys]);
  }
}

const MIN  = 60_000;
const HOUR = 60 * MIN;
const DAY  = 24 * HOUR;

export function episodeTTL(status) {
  switch (status) {
    case "FINISHED":         return [7 * DAY,   Infinity];
    case "RELEASING":        return [2 * HOUR,  15 * MIN];
    case "HIATUS":           return [6 * HOUR,  60 * MIN];
    case "NOT_YET_RELEASED": return [30 * MIN,  15 * MIN];
    default:                 return [HOUR,       15 * MIN];
  }
}

export function jikanPageTTL(isLastPage, status) {
  if (!isLastPage || status === "FINISHED") return [7 * DAY, Infinity];
  switch (status) {
    case "RELEASING":        return [2 * HOUR,  15 * MIN];
    case "HIATUS":           return [6 * HOUR,  60 * MIN];
    case "NOT_YET_RELEASED": return [30 * MIN,  15 * MIN];
    default:                 return [2 * HOUR,  15 * MIN];
  }
}

export function mapTTL(status) {
  return status === "FINISHED" ? 30 * DAY : 12 * HOUR;
}

export const WATCH_TTL         = 3 * HOUR;
export const SHOW_IDENTITY_TTL = 24 * HOUR;
export const THIRTY_DAYS       = 30 * DAY;
