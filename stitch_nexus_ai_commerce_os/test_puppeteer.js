const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        
        // Output console logs
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
        
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto('http://192.168.1.18/otomatisasi_alur_kerja_bpmn/code.html', { waitUntil: 'networkidle2' });
        
        console.log("Page loaded. Looking for sidebar items...");
        
        const sidebarItems = await page.$$('.sidebar-item');
        console.log("Found sidebar items:", sidebarItems.length);
        
        if (sidebarItems.length > 0) {
            console.log("Clicking the 'Gerbang Pembayaran' sidebar item...");
            const gopayNode = await page.$('[data-name="Gerbang Pembayaran"]');
            if (gopayNode) {
                await gopayNode.click();
                await new Promise(r => setTimeout(r, 2000)); // Wait for API and animations
                
                const toasts = await page.$$('.node-toast');
                console.log("Toasts found after click:", toasts.length);
                
                const link = await page.$('a[href^="https://simulator.gopay"]');
                if (link) {
                    console.log("SUCCESS: Gopay payment link generated!");
                } else {
                    console.log("FAILED: Gopay payment link not found.");
                }
            } else {
                console.log("Could not find Gerbang Pembayaran node.");
            }
            
            await page.screenshot({ path: 'screenshot.png' });
            console.log("Screenshot saved.");
        } else {
            console.log("No sidebar items found.");
        }
        
        await browser.close();
    } catch (e) {
        console.error("Test failed:", e);
    }
})();
