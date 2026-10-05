import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export async function toWebRequest(req, basePath = '') {
  const protocol = req.headers['x-forwarded-proto']?.split(',')[0].trim() === 'https' || req.socket?.encrypted ? 'https' : 'http';
  const path = basePath && req.url.startsWith(`${basePath}/`) ? req.url.slice(basePath.length) : req.url;
  const url = new URL(path, process.env.PUBLIC_ORIGIN || `${protocol}://${req.headers.host || 'localhost'}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256 * 1024) throw Object.assign(new Error('Request body too large'), { status: 413 });
    chunks.push(chunk);
  }
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  return new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : body, duplex: 'half' });
}

export async function sendWebResponse(res, response) {
  res.statusCode = response.status;
  for (const [key, value] of response.headers) res.setHeader(key, value);
  if (!response.body) return res.end();
  await pipeline(Readable.fromWeb(response.body), res);
}
