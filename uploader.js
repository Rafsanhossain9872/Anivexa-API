import 'dotenv/config';
import { mkdtemp, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';
import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';

const [video, id, episode, audio = 'sub'] = process.argv.slice(2);
if (!video || !/^\d+$/.test(id || '') || !/^\d+$/.test(episode || '') || !['sub', 'dub'].includes(audio)) throw new Error('Usage: node uploader.js <video-file> <AniList-ID> <episode> [sub|dub]');
const { BOT_TOKEN, TELEGRAM_CHAT_ID, TELEGRAM_EDGE_URL } = process.env;
if (!BOT_TOKEN || !TELEGRAM_CHAT_ID || !TELEGRAM_EDGE_URL) throw new Error('Set BOT_TOKEN, TELEGRAM_CHAT_ID and TELEGRAM_EDGE_URL in .env');
const working = await mkdtemp(join(tmpdir(), 'anivexa-upload-'));
try {
  await new Promise((resolve, reject) => {
    const child = spawn(process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', video, '-c:v', 'copy', '-c:a', 'aac', '-f', 'hls', '-hls_time', '4', '-hls_playlist_type', 'vod', '-hls_segment_filename', join(working, 'segment_%05d.ts'), join(working, 'playlist.m3u8')], { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`FFmpeg failed (${code})`)));
  });
  const manifest = await readFile(join(working, 'playlist.m3u8'), 'utf8');
  const names = manifest.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#'));
  const mapping = new Map();
  for (const name of names) {
    if (basename(name) !== name || !name.endsWith('.ts')) throw new Error('Unexpected segment name');
    const bytes = await readFile(join(working, name));
    if (bytes.length > 19 * 1024 * 1024) throw new Error('Segment exceeds Telegram download limits; re-encode the source at a lower bitrate.');
    let uploaded;
    for (let attempt = 0; attempt < 3 && !uploaded; attempt++) {
      const form = new FormData();
      form.set('chat_id', TELEGRAM_CHAT_ID);
      form.set('document', new Blob([bytes], { type: 'video/mp2t' }), name);
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: form, signal: AbortSignal.timeout(120000) });
      const data = await response.json();
      if (response.ok && data.ok && data.result?.document?.file_id) uploaded = data.result.document.file_id;
      else if (attempt === 2) throw new Error(data.description || 'Telegram upload failed');
      else await new Promise(resolve => setTimeout(resolve, 2000));
    }
    mapping.set(name, `${TELEGRAM_EDGE_URL.replace(/\/$/, '')}/stream/${encodeURIComponent(uploaded)}`);
    console.log(`Uploaded segment ${mapping.size}/${names.length}`);
  }
  const playlist = manifest.split('\n').map(line => mapping.get(line.trim()) || line).join('\n');
  const registryURL = new URL('./telegram-streams.json', import.meta.url);
  let registry = {};
  try { registry = JSON.parse(await readFile(registryURL, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const key = `${id}:${audio}:${episode}`;
  const origin = (process.env.PUBLIC_ORIGIN || 'http://localhost:4001').replace(/\/$/, '');
  registry[key] = { url: `${origin}/api/telegram-playlist/${id}/${audio}/${episode}`, playlist, updatedAt: new Date().toISOString() };
  await writeFile(registryURL, JSON.stringify(registry, null, 2));
  await writeFile(new URL('./final_playlist.m3u8', import.meta.url), playlist);
  console.log(`Registered ${key}. Original segment durations have been preserved.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await rm(working, { recursive: true, force: true });
}
