import type { Browser, Page } from "puppeteer";

import * as fs from "fs/promises";
import puppeteer from "puppeteer";
import { chain } from "@botmation/core";
import { login } from "./refresh";

export async function saveLoginCookies(fileName: string, username: string, password: string): Promise<void> {
    let browser: Browser;
    let page: Page;

    try {
        browser = await puppeteer.launch({
            devtools: false,
            headless: true,
            args: ["--lang=en-US,en"],
            // slowMo: 25, // for debugging purpose
        });

        const pages = await browser.pages();
        page = pages.length === 0 ? await browser.newPage() : pages[0];

        // create the cookie file if missing
        await fs.access(fileName).catch(() => fs.writeFile("{}", fileName));

        await chain(
            login(username, password),
            (page) => page.cookies()
                .then((cookies) => fs.writeFile(fileName, JSON.stringify(cookies, undefined, 4)))
            ,
        )(page);

        await page.close();
        await browser.close();
    } catch (error) {
        console.error(error);

        setTimeout(async () => {
            if (page) await page.close();
            if (browser) await browser.close();
        });
    }
}
