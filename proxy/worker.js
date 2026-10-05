export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get("url");
    const ref = url.searchParams.get("ref") ?? "https://anidb.app/";

    if (!target) {
      return new Response(JSON.stringify({ error: "Missing ?url= param" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    let targetUrl;
    try { targetUrl = new URL(target); } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (targetUrl.protocol !== 'https:' || targetUrl.username || targetUrl.password || !(targetUrl.hostname === 'anidb.app' || targetUrl.hostname.endsWith('.anidb.app'))) {
      return new Response(JSON.stringify({ error: "Only anidb.app requests allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const res = await fetch(target, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": ref,
        "X-Requested-With": request.headers.get("X-Requested-With") ?? "",
      },
    }).catch(() => null);

    if (!res) {
      return new Response(JSON.stringify({ error: "Fetch failed" }), {
        status: 502,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (res.status >= 300 && res.status < 400) return Response.json({ error: 'Upstream redirects are not supported' }, { status: 502 });
    const headers = new Headers();
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Content-Type", res.headers.get("Content-Type") ?? "text/plain");

    return new Response(res.body, { status: res.status, headers });
  },
};
