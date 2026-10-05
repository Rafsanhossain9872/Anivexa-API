import 'dotenv/config';
const token = process.env.BOT_TOKEN;
const id = process.argv[2];
if (!token || !id) throw new Error('Set BOT_TOKEN and run: node verify_file.js <file_id>');
const response = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(15000) });
const data = await response.json();
if (!response.ok || !data.ok) { console.error(data.description || 'File lookup failed'); process.exitCode = 1; }
else console.log({ file_path: data.result.file_path, file_size: data.result.file_size });
