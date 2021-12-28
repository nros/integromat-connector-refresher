import type { Protocol } from "puppeteer";

import * as fs from "fs/promises";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import { Command } from "commander";

import { saveLoginCookies } from "./login";

const COOKIE_FILE = path.join(process.cwd(), "integromat-cookies.json");
const LOG = (...args: unknown[]) => {
    if (args) {
        // ignore
    }
}; // console.log;

// get the cookie file
async function getSessionCookie(username: string, password: string): Promise<string> {
    LOG(`Reading cookie file: ${COOKIE_FILE}`);

    // create the cookie file if it does not exist
    await fs.access(COOKIE_FILE)
        .catch(() => saveLoginCookies(COOKIE_FILE, username, password))
        .then(() => fs.access(COOKIE_FILE));

    const content = await fs.readFile(COOKIE_FILE);
    const cookieData = JSON.parse(content.toString()) as Protocol.Network.Cookie[];

    LOG(`Reading cookies: ${JSON.stringify(cookieData, undefined, 4)}`);
    return "sid=" + cookieData?.filter((cookie) => cookie.name === "sid")?.pop()?.value;
}

// from here: https://medium.com/@gevorggalstyan/how-to-promisify-node-js-http-https-requests-76a5a58ed90c
async function request(url: string, method = "GET", cookies?: string[], postData?: string): Promise<string> {
    const lib = url.startsWith("https://") ? https : http;

    const [h] = url.split("://")[1].split("/");
    const [host, port] = h.split(":");

    const path = url.replace(/^(https?:\/\/)?[^/]+/, "");

    const params: https.RequestOptions = {
        method,
        host,
        port: port || url.startsWith("https://") ? 443 : 80,
        path: path || "/",
    };

    if (cookies) {
        params.headers = {
            Cookie: cookies.join("; "),
        };
    }

    LOG("Request options:", params);

    return new Promise((resolve: (data: string) => void, reject: (error: Error) => void) => {
        const request = lib.request(params, (response: http.IncomingMessage) => {
            if (response?.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                console.error("request error", response);
                return reject(new Error(`Status Code: ${response?.statusCode}`));
            }

            const data: Buffer[] = [];
            response.on("data", (chunk: Buffer) => {
                data.push(chunk);
            });

            response.on("end", () => resolve(Buffer.concat(data).toString()));
        });

        request.on("error", reject);

        if (cookies) {
            request.setHeader("Cookie", cookies);
        }

        if (postData) {
            request.write(postData);
        }

        // IMPORTANT
        request.end();
    });
}


interface IntegromatConnectorTestResponseJson {
    code: string;
    response?: true;
    debug: (unknown[])[];
}

async function callApiToRefreshConnector(connectorId: string, username: string, password: string): Promise<void> {
    if (!connectorId) {
        throw new Error("No connector ID provided!");
    }

    let retriesLeft = 3;
    while (retriesLeft > 0) {
        retriesLeft--;

        // get the session cookie
        const sessionCookie = await getSessionCookie(username, password);
        LOG("Session cookie is: " + sessionCookie);

        const result = await request(`https://www.integromat.com/api/account/${connectorId}/test`, "GET", [sessionCookie]);

        const resultJSON = JSON.parse(result) as IntegromatConnectorTestResponseJson;
        if (resultJSON?.code && resultJSON.code === "IM001") {
            // access denied, cookie is invalid, try again with new cookie
            LOG("Session has timed-out. Refreshing cookie and retrying!");
            await fs.unlink(COOKIE_FILE);

        } else if (!resultJSON?.response || !resultJSON.code || resultJSON.code !== "OK") {
            LOG(`Calling API failed: ${result}`);
            throw new Error("FAILED to refresh connector. \n" + JSON.stringify(resultJSON.debug, undefined, 4));
        } else {
            LOG("SUCCESSfully refreshed", result);
            return;
        }
    }
}

function refresh(connectorId: string, username: string, password: string): Promise<void> {
    return callApiToRefreshConnector(connectorId, username, password)
        .catch(console.error);
}

(async () => {
    const program = new Command();
    program
        .requiredOption("-u, --username <username>", "The Integromat username to use for login.")
        .requiredOption("-p, --password <password>", "The Integromat password of the user to use for login.")
        .requiredOption("-c, --connection-id <id>", "The ID of the connector to refresh.")
    ;
    program.parse(process.argv);

    const options = program.opts();
    return await refresh(options.connectorId, options.username, options.password);
})();
