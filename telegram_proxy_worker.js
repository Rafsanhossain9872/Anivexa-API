/**
 * Tenzora v2.0 - Telegram Edge Proxy (Cloudflare Worker)
 * 
 * This stateless worker intercepts chunk requests and streams them directly 
 * from the Telegram Bot API. It implements generous caching and permissive CORS
 * to enable the P2P WebTorrent mesh network on the frontend.
 */

// We will use Cloudflare's Cache API to dramatically reduce Telegram API hits
const CACHE_TTL = 604800; // Cache for 7 days
const BOT_TOKEN = "8532496824:AAEYckkTeuO1JzV7r7G1YGcMSqbscaO4bmc";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Basic routing
    if (pathSegments.length === 0) {
      return new Response("Tenzora Edge Proxy is Online", { status: 200 });
    }

    // Expected URL format: /stream/<file_id_or_path>
    if (pathSegments[0] === 'stream' && pathSegments[1]) {
      return handleStreamRequest(request, pathSegments[1], env, ctx);
    }

    return new Response("Not Found", { status: 404 });
  }
};

/**
 * Handles the actual fetching and streaming of the Telegram file
 */
async function handleStreamRequest(request, fileIdentifier, env, ctx) {
  // CORS Headers required for frontend P2P/HLS player
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "Range, Content-Type",
    "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
  };

  // Handle preflight requests
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url);
  
  // 1. Check if we already have the raw file cached at the edge
  let response = await cache.match(cacheKey);
  if (response) {
    // If cached, just inject CORS and return
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
    return new Response(response.body, { ...response, headers: newHeaders });
  }

  try {
    let filePath = fileIdentifier;

    // 2. If the identifier is a file_id (doesn't contain a '/'), we must resolve it to a file_path first
    if (!fileIdentifier.includes('/')) {
      const tgApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileIdentifier}`;
      
      const fileRes = await fetch(tgApiUrl);
      const fileData = await fileRes.json();

      if (!fileData.ok) {
        return new Response(JSON.stringify(fileData), { 
          status: 404, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
      }
      filePath = fileData.result.file_path;
    }

    // 3. Stream the actual file from Telegram's content servers
    const tgFileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
    
    // We forward the Range header to allow seeking in the video player
    const fetchHeaders = new Headers();
    if (request.headers.has("Range")) {
      fetchHeaders.set("Range", request.headers.get("Range"));
    }

    const tgResponse = await fetch(tgFileUrl, { headers: fetchHeaders });

    if (!tgResponse.ok) {
      return new Response("Failed to fetch file from Telegram", { status: tgResponse.status });
    }

    // 4. Determine Content-Type based on extension
    let contentType = "application/octet-stream"; // Default for .bin chunks
    if (filePath.endsWith('.m3u8')) {
      contentType = "application/vnd.apple.mpegurl";
    } else if (filePath.endsWith('.ts')) {
      contentType = "video/MP2T";
    } else if (filePath.endsWith('.mp4')) {
      contentType = "video/mp4";
    }

    // 5. Build the final Edge response
    const responseHeaders = new Headers(tgResponse.headers);
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Cache-Control", `public, max-age=${CACHE_TTL}`);
    Object.entries(corsHeaders).forEach(([k, v]) => responseHeaders.set(k, v));

    const finalResponse = new Response(tgResponse.body, {
      status: tgResponse.status,
      statusText: tgResponse.statusText,
      headers: responseHeaders,
    });

    // 6. Cache the successful response for future users in the background
    // We only cache 200 OK responses, not 206 Partial Content (Range requests)
    if (tgResponse.status === 200) {
      ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
    }

    return finalResponse;

  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, { 
      status: 500, 
      headers: corsHeaders 
    });
  }
}
