const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page1 = await browser.newPage();
        const page2 = await browser.newPage();
        
        page1.on('console', msg => console.log('PAGE 1 LOG:', msg.text()));
        page2.on('console', msg => console.log('PAGE 2 LOG:', msg.text()));

        await page1.goto('http://localhost:3000');
        
        await page1.evaluate(() => {
            if (window.engine) {
                console.log("ENGINE HAS ON?", typeof window.engine.on);
                window.engine.on(p2pml.core.Events.PieceBytesDownloaded, (m,s) => console.log("DL:", m, s));
                window.engine.on(p2pml.core.Events.PeerConnect, (p) => console.log("PEER CONNECT!", p));
            }
        });
        
        await page2.goto('http://localhost:3000');
        
        await new Promise(r => setTimeout(r, 10000));
        
        await browser.close();
    } catch (err) {
        console.error("Puppeteer Script Error:", err);
    }
})();
