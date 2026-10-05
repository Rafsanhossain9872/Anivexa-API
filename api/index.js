import worker from '../index.js';
import { toWebRequest, sendWebResponse } from '../core/node-adapter.js';

export default async function handler(req, res) {
  try { await sendWebResponse(res, await worker.fetch(await toWebRequest(req), process.env)); }
  catch (error) {
    if (res.headersSent) return res.destroy(error);
    res.statusCode = error.status || 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error.status === 413 ? error.message : 'Request failed' }));
  }
}
