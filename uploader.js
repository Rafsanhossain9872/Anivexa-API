import 'dotenv/config';
import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import input from "input";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use the pre-compiled ffmpeg binary
ffmpeg.setFfmpegPath(ffmpegStatic);

// Ensure the output directory exists
const outputDir = path.join(__dirname, "temp_hls");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Helper to update or append to .env file
 */
function updateEnvFile(key, value) {
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
        envContent += `\n${key}=${value}\n`;
    }
    fs.writeFileSync(envPath, envContent.trim() + '\n');
}

/**
 * Step 1: Chunk the MP4 video using FFmpeg
 */
async function chunkVideo(inputPath, outputM3u8) {
    return new Promise((resolve, reject) => {
        console.log(`\n⏳ [1/3] Chunking video: ${path.basename(inputPath)}...`);
        
        ffmpeg(inputPath)
            .outputOptions([
                '-codec:v libx264',
                '-codec:a aac',
                '-hls_time 3',                   // Target segment duration (3 seconds)
                '-hls_playlist_type vod',        // Video on demand
                '-hls_segment_filename', path.join(outputDir, 'chunk_%03d.bin'), // Output as .bin
                '-f hls'
            ])
            .output(outputM3u8)
            .on('progress', (progress) => {
                // Show progress so user knows it's not frozen
                if (progress.percent) {
                    process.stdout.write(`\r   -> Processing: ${progress.percent.toFixed(2)}% done `);
                }
            })
            .on('end', () => {
                console.log('\n✅ Video chunking complete!');
                resolve();
            })
            .on('error', (err) => {
                console.error('\n❌ Error chunking video:', err.message);
                reject(err);
            })
            .run();
    });
}

/**
 * Step 2: Upload a single file to Telegram
 */
async function uploadToTelegram(client, filePath, peerId) {
    try {
        console.log(`   ⬆️ Uploading ${path.basename(filePath)}...`);
        const result = await client.sendFile(peerId, {
            file: filePath,
            forceDocument: true, 
            caption: path.basename(filePath)
        });
        
        return {
            filename: path.basename(filePath),
            messageId: result.id,
            documentId: result.media?.document?.id?.toString() || null,
            accessHash: result.media?.document?.accessHash?.toString() || null,
            fileReference: result.media?.document?.fileReference?.toString("base64") || null
        };
    } catch (error) {
        console.error(`\n❌ Failed to upload ${filePath}:`, error.message);
        throw error;
    }
}

/**
 * Main execution flow
 */
(async () => {
    try {
        console.log("==========================================");
        console.log("   Tenzora Telegram Uploader (Phase 1)    ");
        console.log("==========================================\n");

        // 1. Get API Credentials
        let apiId = process.env.TELEGRAM_API_ID;
        let apiHash = process.env.TELEGRAM_API_HASH;

        if (!apiId || !apiHash) {
            console.log("⚠️ Missing API credentials in .env");
            apiId = await input.text("Enter your Telegram API_ID: ");
            apiHash = await input.text("Enter your Telegram API_HASH: ");
            updateEnvFile('TELEGRAM_API_ID', apiId);
            updateEnvFile('TELEGRAM_API_HASH', apiHash);
            console.log("✅ Saved API credentials to .env");
        }
        apiId = parseInt(apiId);

        // 2. Get input file
        let inputMp4 = process.argv[2];
        if (!inputMp4) {
            inputMp4 = await input.text("Enter the path to the MP4 file: ");
        }
        
        // Resolve absolute path and handle quotes
        inputMp4 = path.resolve(inputMp4.replace(/^["'](.+(?=["']$))["']$/, '$1'));
        
        if (!fs.existsSync(inputMp4)) {
            console.error(`❌ File not found: ${inputMp4}`);
            process.exit(1);
        }

        // 3. Get target channel
        let targetChannel = process.env.TELEGRAM_CHANNEL_ID;
        if (!targetChannel) {
            targetChannel = await input.text("Enter the target Telegram Channel ID (e.g., -100123456789): ");
            updateEnvFile('TELEGRAM_CHANNEL_ID', targetChannel);
        }

        // Convert channel ID to BigInt if it's numeric, otherwise let gramjs handle the username
        let peerId = targetChannel;
        if (/^-?\d+$/.test(targetChannel)) {
            peerId = BigInt(targetChannel);
        }

        // 4. Initialize MTProto Client
        console.log(`\n⏳ [2/3] Connecting to Telegram...`);
        const stringSession = new StringSession(process.env.TELEGRAM_SESSION || "");
        
        const client = new TelegramClient(stringSession, apiId, apiHash, {
            connectionRetries: 5,
        });

        await client.start({
            phoneNumber: async () => await input.text("Please enter your phone number (e.g., +1234567890): "),
            password: async () => await input.text("Please enter your 2FA password: "),
            phoneCode: async () => await input.text("Please enter the login code you received on Telegram: "),
            onError: (err) => console.log(err),
        });

        console.log("✅ Connected and authenticated!");
        
        // Automatically save session to .env
        const sessionString = client.session.save();
        if (sessionString && sessionString !== process.env.TELEGRAM_SESSION) {
            updateEnvFile('TELEGRAM_SESSION', sessionString);
            console.log("✅ Saved Telegram session string to .env automatically.");
        }

        // 5. Chunk Video
        const m3u8Path = path.join(outputDir, "index.m3u8");
        await chunkVideo(inputMp4, m3u8Path);

        // 6. Read generated chunks
        const files = fs.readdirSync(outputDir);
        const chunks = files.filter(f => f.endsWith('.bin')).sort();
        
        if (chunks.length === 0) {
            console.error("❌ No .bin chunks found after FFmpeg processing. The video file might be invalid.");
            process.exit(1);
        }

        // 7. Upload Chunks Sequentially
        console.log(`\n⏳ [3/3] Uploading ${chunks.length} chunks to Telegram (Channel: ${targetChannel})...`);
        const uploadLog = {};

        for (const chunk of chunks) {
            const chunkPath = path.join(outputDir, chunk);
            const uploadData = await uploadToTelegram(client, chunkPath, peerId);
            uploadLog[chunk] = uploadData;
            
            // 1.5-second delay to strictly respect Telegram's flood limits for bots/userbots
            await new Promise(res => setTimeout(res, 1500));
        }

        // 8. Upload Manifest
        console.log(`\n   ⬆️ Uploading manifest (index.m3u8)...`);
        const m3u8UploadData = await uploadToTelegram(client, m3u8Path, peerId);
        uploadLog["index.m3u8"] = m3u8UploadData;

        // 9. Save Log Output
        const logPath = path.join(__dirname, `upload_log_${Date.now()}.json`);
        fs.writeFileSync(logPath, JSON.stringify(uploadLog, null, 2));
        
        console.log(`\n🎉 Success! All files uploaded.`);
        console.log(`📄 Upload log saved to: ${logPath}`);
        
        // 10. Clean up temporary files
        for (const file of files) {
            fs.unlinkSync(path.join(outputDir, file));
        }
        fs.rmdirSync(outputDir);
        console.log("🧹 Cleaned up temporary files.");

    } catch (error) {
        console.error("\n❌ Fatal Error:", error);
    } finally {
        process.exit(0);
    }
})();
