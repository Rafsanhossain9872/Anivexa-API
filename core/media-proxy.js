import { getRequestSignal } from './network.js';

export function isPrivateAddress(address) {
  const host = address.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (host === 'localhost' || /\.(localhost|local|internal|lan)$/.test(host) || host === 'metadata.google.internal') return true;
  if (host.includes(':')) {
    if (host.startsWith('::ffff:')) {
      const tail = host.slice(7);
      if (tail.includes('.')) return isPrivateAddress(tail);
      const parts = tail.split(':');
      if (parts.length === 2) return isPrivateAddress(`${parseInt(parts[0], 16) >> 8}.${parseInt(parts[0], 16) & 255}.${parseInt(parts[1], 16) >> 8}.${parseInt(parts[1], 16) & 255}`);
    }
    // Only global unicast IPv6; exclude documentation and transition networks.
    return !/^[23][0-9a-f]{3}:/.test(host) || /^(2001:db8|2001:0:|2002:)/.test(host);
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || b === 2)) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0);
  }
  return !host.includes('.');
}

export function validateMediaURL(value, allowedHosts = '') {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isPrivateAddress(url.hostname) || (url.port && !['80', '443'].includes(url.port))) throw new Error('Only public HTTP(S) media URLs are allowed');
  const patterns = allowedHosts.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (patterns.length && !patterns.some(p => p.startsWith('*.') ? url.hostname.endsWith(p.slice(1)) : url.hostname === p)) throw new Error('Media host is not allowed');
  return url;
}

let dispatcherPromise;
async function publicDispatcher() {
  if (!globalThis.process?.versions?.node || typeof WebSocketPair !== 'undefined' || typeof EdgeRuntime !== 'undefined') return undefined;
  dispatcherPromise ||= Promise.all([import('undici'), import('node:dns/promises')]).then(([{ Agent }, dns]) => new Agent({
    connect: { lookup(hostname, options, callback) {
      dns.lookup(hostname, { all: true }).then(addresses => {
        if (!addresses.length || addresses.some(a => isPrivateAddress(a.address))) return callback(new Error('Private-network media addresses are blocked'));
        const matching = options.family ? addresses.filter(a => a.family === options.family) : addresses;
        if (!matching.length) return callback(new Error('No public address for requested family'));
        if (options.all) callback(null, matching);
        else callback(null, matching[0].address, matching[0].family);
      }).catch(callback);
    } }
  }));
  return dispatcherPromise;
}

export async function fetchMedia(value, options = {}, env = {}) {
  const signal = AbortSignal.any([options.signal, getRequestSignal(), AbortSignal.timeout(30000)].filter(Boolean));
  signal.throwIfAborted();
  let url = validateMediaURL(value, env.PROXY_ALLOWED_HOSTS || globalThis.process?.env?.PROXY_ALLOWED_HOSTS || '');
  const dispatcher = await publicDispatcher();
  if (!dispatcher && (typeof WebSocketPair !== 'undefined' || typeof EdgeRuntime !== 'undefined') && !(env.PROXY_ALLOWED_HOSTS || globalThis.process?.env?.PROXY_ALLOWED_HOSTS)) throw new Error('Configure PROXY_ALLOWED_HOSTS for edge media proxying');
  for (let redirects = 0; redirects <= 5; redirects++) {
    const response = await fetch(url, { ...options, ...(dispatcher ? { dispatcher } : {}), redirect: 'manual', signal });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location) throw new Error('Invalid upstream redirect');
    url = validateMediaURL(new URL(location, url).href, env.PROXY_ALLOWED_HOSTS || globalThis.process?.env?.PROXY_ALLOWED_HOSTS || '');
  }
  throw new Error('Too many media redirects');
}

export function rewriteM3U8(text, base, proxy, referer = '') {
  const rewrite = value => `${proxy}?url=${encodeURIComponent(new URL(value, base).href)}&referer=${encodeURIComponent(referer)}`;
  return text.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;
    if (trimmed.startsWith('#')) return line.replace(/URI="([^"]+)"/g, (_match, uri) => `URI="${rewrite(uri)}"`);
    return rewrite(trimmed);
  }).join('\n');
}

export async function readPlaylist(response, maxBytes = 2 * 1024 * 1024) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty upstream playlist');
  const decoder = new TextDecoder();
  let text = '', bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('Upstream playlist is too large');
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export async function resolveHLS(value, proxy, referer = '', env = {}) {
  let url = validateMediaURL(value, env.PROXY_ALLOWED_HOSTS || '').href;
  const headers = { 'User-Agent': 'Mozilla/5.0', Accept: '*/*', 'Accept-Encoding': 'identity', Referer: referer || `${new URL(url).origin}/` };
  for (let follow = 0; follow < 5; follow++) {
    const response = await fetchMedia(url, { headers }, env);
    if (!response.ok) { await response.body?.cancel(); throw new Error('Upstream playlist is unavailable'); }
    const text = await readPlaylist(response);
    const base = response.url || url;
    if (text.trim().startsWith('#EXTM3U')) return new Response(rewriteM3U8(text, base, proxy, referer), { headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' } });
    const path = text.trim();
    if (!path || path.includes('\n') || /[<>\s]/.test(path)) throw new Error('Invalid upstream playlist');
    url = validateMediaURL(new URL(path, base).href, env.PROXY_ALLOWED_HOSTS || '').href;
  }
  throw new Error('No valid HLS playlist was found');
}

export async function mediaProxy(request, env = {}) {
  const incoming = new URL(request.url);
  const target = validateMediaURL(incoming.searchParams.get('url'), env.PROXY_ALLOWED_HOSTS || '');
  const referer = incoming.searchParams.get('referer') || `${target.origin}/`;
  const headers = new Headers({ 'User-Agent': 'Mozilla/5.0', Accept: '*/*', 'Accept-Encoding': 'identity', Referer: referer, Origin: new URL(referer).origin });
  for (const name of ['range', 'if-range']) if (request.headers.has(name)) headers.set(name, request.headers.get(name));
  const response = await fetchMedia(target.href, { headers, signal: request.signal }, env);
  const resultHeaders = new Headers({ 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Content-Range, Accept-Ranges, Content-Length', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'" });
  for (const name of ['content-type', 'content-range', 'accept-ranges', 'cache-control', 'etag', 'last-modified']) if (response.headers.has(name)) resultHeaders.set(name, response.headers.get(name));
  const type = response.headers.get('content-type') || '';
  if (/text\/html|javascript|application\/json|image\/svg/i.test(type)) {
    await response.body?.cancel();
    return Response.json({ error: 'Upstream did not return media' }, { status: 502 });
  }
  if (/mpegurl/i.test(type) || new URL(response.url || target.href).pathname.endsWith('.m3u8')) {
    const text = await readPlaylist(response);
    if (!response.ok || !text.trim().startsWith('#EXTM3U') || text.length > 2 * 1024 * 1024) return Response.json({ error: 'Invalid upstream playlist' }, { status: 502 });
    resultHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    resultHeaders.delete('content-range');
    resultHeaders.delete('accept-ranges');
    return new Response(rewriteM3U8(text, response.url || target.href, `${incoming.origin}${incoming.pathname}`, referer), { status: response.status, headers: resultHeaders });
  }
  if (!response.headers.has('content-encoding') && response.headers.has('content-length')) resultHeaders.set('content-length', response.headers.get('content-length'));
  return new Response(response.body, { status: response.status, headers: resultHeaders });
}
