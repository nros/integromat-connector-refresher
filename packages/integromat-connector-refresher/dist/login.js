"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveLoginCookies = void 0;
const tslib_1 = require("tslib");
const fs = (0, tslib_1.__importStar)(require("fs/promises"));
const puppeteer_1 = (0, tslib_1.__importDefault)(require("puppeteer"));
const core_1 = require("@botmation/core");
const refresh_1 = require("./refresh");
async function saveLoginCookies(fileName, username, password) {
    let browser;
    let page;
    try {
        browser = await puppeteer_1.default.launch({
            devtools: false,
            headless: true,
            args: ["--lang=en-US,en"],
            // slowMo: 25, // for debugging purpose
        });
        const pages = await browser.pages();
        page = pages.length === 0 ? await browser.newPage() : pages[0];
        // create the cookie file if missing
        await fs.access(fileName).catch(() => fs.writeFile(fileName, "{}"));
        await (0, core_1.chain)((0, refresh_1.login)(username, password), (page) => page.cookies()
            .then((cookies) => fs.writeFile(fileName, JSON.stringify(cookies, undefined, 4))))(page);
        await page.close();
        await browser.close();
    }
    catch (error) {
        console.error(error);
        setTimeout(async () => {
            if (page)
                await page.close();
            if (browser)
                await browser.close();
        });
    }
}
exports.saveLoginCookies = saveLoginCookies;
//# sourceMappingURL=login.js.map