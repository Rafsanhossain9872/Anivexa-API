import http from "node:http";
import 'dotenv/config';
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import worker from "./index.js";
import { toWebRequest, sendWebResponse } from './core/node-adapter.js';

const PORT  = process.env.PORT ?? 4000;
const BASE  = process.env.BASE_PATH ?? "";
const __dir = dirname(fileURLToPath(import.meta.url));

const STATIC = {
  "/":           { file: "docs/landing.html", mime: "text/html" },
  "/docs":       { file: "docs/index.html",   mime: "text/html" },
  "/style.css":  { file: "docs/style.css",    mime: "text/css"  },
  "/logo.svg":   { file: "docs/logo.svg",     mime: "image/svg+xml" },
};

function serveStatic(res, entry) {
  try {
    const body = readFileSync(join(__dir, entry.file));
    res.writeHead(200, {
      "Content-Type":  entry.mime + "; charset=utf-8",
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  console.log(`→ ${req.method} ${req.url}`);

  const pathname = req.url.split("?")[0];
  const staticEntry = STATIC[pathname];

  if (req.method === "GET" && staticEntry) {
    return serveStatic(res, staticEntry);
  }

  try {
    const request = await toWebRequest(req, BASE);
    await sendWebResponse(res, await worker.fetch(request, process.env));
  } catch (err) {
    console.error("Unhandled error:", err);
    if (res.headersSent) return res.destroy(err);
    res.statusCode = err.status || 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: err.status === 413 ? err.message : 'Request failed' }));
  }
});

server.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  console.log(`Anivexa dev server → http://localhost:${PORT}`);
});
