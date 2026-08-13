import https from 'https';

const BOT_TOKEN = "8532496824:AAF0E-I5z1ZPS_qJ8k-1oTwZOPjgSQDgq8I";

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function verifyLatestFile() {
  console.log("Fetching updates from Bot API...");
  try {
    const updates = await fetchJson(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
    
    if (!updates.ok) {
      console.error("Failed to get updates:", updates);
      return;
    }

    if (updates.result.length === 0) {
      console.log("❌ No messages found in getUpdates! Please send or forward a .bin file to your bot in Telegram first.");
      return;
    }

    // Find the latest document
    const messageWithDoc = updates.result.reverse().find(u => u.message && u.message.document);
    
    if (!messageWithDoc) {
      console.log("❌ No documents found in the recent messages sent to the bot.");
      return;
    }

    const fileId = messageWithDoc.message.document.file_id;
    const fileName = messageWithDoc.message.document.file_name || "Unknown File";
    
    console.log(`\n✅ Found Document: ${fileName}`);
    console.log(`Clean file_id: ${fileId}\n`);
    
    console.log("⏳ Verifying file_id with getFile...");
    const fileRes = await fetchJson(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    
    console.log("\n📝 Response from getFile:");
    console.log(JSON.stringify(fileRes, null, 2));

  } catch (error) {
    console.error("Error:", error);
  }
}

verifyLatestFile();
