import { readFile, writeFile } from 'node:fs/promises';
const [id, audio = 'sub', episode = '1'] = process.argv.slice(2);
if (!/^\d+$/.test(id || '') || !['sub', 'dub'].includes(audio) || !/^\d+$/.test(episode)) throw new Error('Usage: node generate_playlist.js <AniList ID> <sub|dub> <episode>');
const registry = JSON.parse(await readFile(new URL('./telegram-streams.json', import.meta.url), 'utf8'));
const entry = registry[`${id}:${audio}:${episode}`];
if (!entry?.playlist?.startsWith('#EXTM3U')) throw new Error('No uploaded manifest exists for this episode. Run uploader.js first.');
await writeFile(new URL('./final_playlist.m3u8', import.meta.url), entry.playlist);
console.log('Playlist generated from the original manifest, preserving segment durations.');
