
const puppeteer = require("puppeteer-core");
(async () => {
    try {
        const browser = await puppeteer.launch({ 
            executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            headless: "new" 
        });
        const page = await browser.newPage();
        
        page.on("console", msg => console.log("PAGE LOG:", msg.text()));
        page.on("pageerror", error => console.log("PAGE ERROR:", error.message));
        
        await page.setViewport({ width: 1920, height: 1080 });
        await page.goto("http://192.168.1.18/otomatisasi_alur_kerja_bpmn/code.html", { waitUntil: "networkidle2" });
        
        const items = await page.$$(".sidebar-item");
        if (items.length > 0) {
            console.log("Clicking item...");
            await items[0].click();
            await new Promise(r => setTimeout(r, 2000));
        } else {
            console.log("No items found");
        }
        await browser.close();
    } catch (e) {
        console.error("Test failed:", e);
    }
})();

