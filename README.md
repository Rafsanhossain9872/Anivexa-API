<div align="center">


<img src="docs/logo.svg" width="80" height="80"/>


# Anivexa API 2.2

**Anime streaming aggregator API — one endpoint, all your sources.**

![Views](https://visitor-badge.laobi.icu/badge?page_id=walterwhite-69.Anivexa-API)
[![Discord](https://img.shields.io/badge/Join%20Discord-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/MARQ9z9QSX)
[![GitHub stars](https://img.shields.io/github/stars/walterwhite-69/Anivexa-API?style=flat-square&color=yellow)](https://github.com/walterwhite-69/Anivexa-API/stargazers)

</div>

---

## What is this?

A single API that aggregates anime episode lists and streaming links from multiple providers. Give it an AniList ID, get back everything — episodes, sources, and stream URLs — all in one place.

It's the backbone powering **[Anivexa](https://github.com/walterwhite-69/Anivexa)**, a full anime streaming client built on top of this.

---

## Providers

| Provider | Status | Notes |
|---|---|---|
| **AllManga** | ✅ Active | Large Library |
| **AnimePahe** | ❌ Removed | Cloudflare JS Challenge — no reliable bypass |
| **Reanime** | ✅ Active | Solid source for a wide range of titles |
| **AniKoto** | ✅ Active | Good library, consistent |
| **AnimeGG** | ✅ Active | Fuzzy title matching + compact-query fix for sequels (e.g. Re:Zero S4) |
| **AniNeko** | ✅ Active | Reliable slug-based matching |
| **AniDB App** | ✅ Active | Language-aware, AniDB ID backed |
| **AniZone** | ✅ Active | HLS + subtitles, sub-only; year-based re-scoring prevents wrong-season matches |
| **2dhive** | ✅ Active | Uses MAL ID internally; AniList ID used everywhere else |
| **Anibd** | ✅ Active | Uses Anilist ID internally; AniList ID used everywhere else |
| **Kickassanime** | ✅ Active | Fuzzy search, medium library |
| **AnimeDunya** | ✅ Active | HLS + subtitles, sub-only, MAL ID backed |

---

## Routes

```
GET /metadata/:anilistId
GET /metadata/:malId?source=mal
```
Returns lightweight Watch-page details, cover artwork, and canonical ID mappings. AniZip supplies a short-lived partial fallback when AniList is blocked, so this route does not require a Python metadata server. MAL lookups explicitly map to AniList IDs and retain `idMal` separately.

```
GET /map/:anilistId
```
Returns cross-platform ID mappings — MAL, TVDB, TMDB, Kitsu, AniDB, and more.

```
GET /episodes/:anilistId
GET /episodes/:provider[/:provider...]/:anilistId
```
Returns episode lists in a single response with smart background refresh. Pass one or more provider names in the path to filter results — e.g. `/episodes/anizone/allmanga/16498` returns only those two. Omit providers to get all of them.

```
GET /watch/:provider/:anilistId/sub|dub/:provider-:ep
```
Returns stream URLs for a specific episode from a specific provider.

```
GET /stream/reanime/:id/sub|dub/:ep
```
302 redirect directly to the HLS stream.

### Faster playback startup

```
GET /api/watch/:anilistId/sub|dub/:ep
GET /api/hls/:anilistId/sub|dub/:ep
```

The unified playback routes try up to **three providers concurrently** and return the first usable result, starting another fallback when a provider fails. Slow losing requests are cancelled. `/api/watch` returns stream metadata in the client-compatible `ep_X` format; `/api/hls` returns the first successfully fetched and rewritten HLS playlist, skipping inaccessible playlists.

For normal iframe playback on Cloudflare Workers Free, use `/api/watch/:id/sub|dub/:ep?mode=embed`. Reanime's direct server-list lookup returns embed URLs without title searches or Worker-side WASM/PBKDF2/AES decryption. This mode starts one provider at a time to avoid speculative CPU-heavy scraping. The Anixo frontend requests it for normal playback and uses `?mode=hls` when native video is required for Watch2Gether. Native HLS remains subject to Cloudflare CPU limits and signed upstream media availability.

AniKoto title searches run concurrently and the matched show identity is cached. Unified playback uses its fast mode, which stops at the first HLS source and skips download-link extraction. If that playlist is inaccessible, `/api/hls` also tries AniKoto's full source list. You can request fast mode directly with `/watch/anikoto/:id/sub|dub/anikoto-:ep?fast=true`.

Unified playback responses use `Cache-Control: no-store`: signed/IP-bound stream URLs are resolved afresh. The `X-Provider` response header identifies the winning provider. For quick episode selection, request only the providers you need, for example `/episodes/reanime/16498?map=false`, instead of waiting for the complete provider catalogue.

When AniList is blocked from the hosting network, stream discovery can use AniZip's titles and ID mappings before trying ARM/Jikan. This fallback has a five-second request timeout, retains the AniList/MAL ID distinction, and uses a short-lived metadata cache because AniZip does not supply an authoritative airing status.

These changes remove sequential fallback delays, but five-second **video playback** is still dependent on upstream response times, the first media segment, network latency, and the client's buffering. API response time alone does not measure time to the first video frame.

---

## Self-hosted

```bash
git clone https://github.com/Rafsanhossain9872/Anivexa-API
cd Anivexa-API
npm ci
npm start
```

Runs on Node.js 22.12+ (Node 24 recommended). No build step needed. The default port is 4000; set `PORT=4001` when running beside Anixo's comments service.

Environment settings are documented in `.env.example`. Export them through your runtime, or start with `node --env-file-if-exists=.env server.js`. Store Telegram/TMDB/Redis credentials in environment variables or Worker secrets. Previously exposed credentials must be rotated; removing current literals does not remove historical commits.

Node media proxies validate public DNS addresses and every redirect. Worker media proxying requires `PROXY_ALLOWED_HOSTS` configured for the actual CDNs. `wrangler.toml` includes the observed Flixcloud and ForestCDN domains used by Reanime; add other providers' media domains when needed. Third-party streams remain dependent on provider availability; native HLS playback has not been verified against every provider.

The companion [Anixo local preview guide](https://github.com/Rafsanhossain9872/Anixo/blob/main/docs/LOCAL_PREVIEW.md) covers the isolated eight-service setup and regression/browser/socket checks. Telegram uploads require owner-configured credentials and are not part of those tests.

---

## Deploying on Vercel

> ⚠️ **Not recommended.** Vercel runs on shared datacenter IPs that are widely blocked by anime streaming sites. Most providers will fail silently or return errors — the API will technically run but you'll get little to no data back. Use a self-hosted VPS or use railway, render etc etc. The proxy file is for anidb app not for streams!

---

## Contributing

> **Only request providers that self-host their content. No scrapers of third-party sites.**

Got a provider you'd like added? Open an issue or drop it in the Discord.

This project is community-kept-alive — if it helps you, please:

- ⭐ **Star the repo** so others can find it
- 💬 **[Join the Discord](https://discord.gg/MARQ9z9QSX)** to discuss, report issues, or suggest providers
- 🛠️ **Open a PR** if you want to add or fix something

---

<div align="center">

hope it helped :3

[![Discord](https://img.shields.io/badge/Join%20the%20community-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/MARQ9z9QSX)

</div>
