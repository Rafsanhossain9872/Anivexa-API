const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers': 'Range', 'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges' };

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: cors });
    const url = new URL(request.url);
    if (url.pathname === '/') return new Response('Telegram media proxy is online', { headers: cors });
    const playlist = url.pathname.match(/^\/playlist\/(\d+)\/(sub|dub)\/(\d+)$/);
    if (playlist) {
      if (!env.PLAYLISTS) return Response.json({ error: 'PLAYLISTS KV binding is not configured' }, { status: 503, headers: cors });
      const manifest = await env.PLAYLISTS.get(`${playlist[1]}:${playlist[2]}:${playlist[3]}`);
      if (!manifest) return new Response('Playlist not found', { status: 404, headers: cors });
      const body = manifest.split('\n').map(line => line.trim() && !line.trim().startsWith('#') ? new URL(line.trim(), url.origin).href : line).join('\n');
      return new Response(request.method === 'HEAD' ? null : body, { headers: { ...cors, 'Content-Type': 'application/vnd.apple.mpegurl', 'Cache-Control': 'public, max-age=300' } });
    }
    if (!url.pathname.startsWith('/stream/')) return new Response('Not found', { status: 404, headers: cors });
    if (!env.BOT_TOKEN) return Response.json({ error: 'BOT_TOKEN secret is not configured' }, { status: 503, headers: cors });
    try {
      const identifier = decodeURIComponent(url.pathname.slice('/stream/'.length));
      if (!identifier || identifier.length > 512 || identifier.includes('..') || !/^[a-zA-Z0-9_./-]+$/.test(identifier)) return new Response('Invalid file identifier', { status: 400, headers: cors });
      const cache = globalThis.caches?.default;
      const cached = await cache?.match(request);
      if (cached) return new Response(request.method === 'HEAD' ? null : cached.body, { status: cached.status, headers: cached.headers });
      let path = identifier;
      if (!identifier.includes('/')) {
        const metadata = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${encodeURIComponent(identifier)}`, { signal: AbortSignal.timeout(15000) });
        const data = await metadata.json();
        if (!metadata.ok || !data.ok || !data.result?.file_path) return new Response('File not found', { status: 404, headers: cors });
        path = data.result.file_path;
      }
      if (path.includes('..') || !/^(documents|videos|animations|photos|voice|video_notes|audio)\/[a-zA-Z0-9_./-]+$/.test(path)) return new Response('Invalid file path', { status: 400, headers: cors });
      const headers = new Headers({ 'Accept-Encoding': 'identity' });
      if (request.headers.has('Range')) headers.set('Range', request.headers.get('Range'));
      const upstream = await fetch(`https://api.telegram.org/file/bot${env.BOT_TOKEN}/${path}`, { method: request.method, headers, signal: AbortSignal.timeout(30000) });
      const responseHeaders = new Headers(cors);
      for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) if (upstream.headers.has(name)) responseHeaders.set(name, upstream.headers.get(name));
      responseHeaders.set('Content-Type', path.endsWith('.ts') || path.endsWith('.bin') ? 'video/mp2t' : upstream.headers.get('content-type') || 'application/octet-stream');
      responseHeaders.set('Cache-Control', 'public, max-age=600');
      const response = new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
      if (cache && request.method === 'GET' && !request.headers.has('Range') && upstream.status === 200) ctx.waitUntil(cache.put(new Request(url.href), response.clone()));
      return response;
    } catch { return Response.json({ error: 'Telegram stream request failed' }, { status: 502, headers: cors }); }
  }
};
