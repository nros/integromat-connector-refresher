"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = (0, tslib_1.__importStar)(require("fs/promises"));
const http = (0, tslib_1.__importStar)(require("http"));
const https = (0, tslib_1.__importStar)(require("https"));
const path = (0, tslib_1.__importStar)(require("path"));
const commander_1 = require("commander");
const login_1 = require("./login");
const COOKIE_FILE = path.join(process.cwd(), "integromat-cookies.json");
const LOG = (...args) => {
    if (args) {
        // ignore
    }
}; // console.log;
// get the cookie file
async function getSessionCookie(username, password) {
    LOG(`Reading cookie file: ${COOKIE_FILE}`);
    // create the cookie file if it does not exist
    await fs.access(COOKIE_FILE)
        .catch(() => (0, login_1.saveLoginCookies)(COOKIE_FILE, username, password))
        .then(() => fs.access(COOKIE_FILE));
    const content = await fs.readFile(COOKIE_FILE);
    const cookieData = JSON.parse(content.toString());
    LOG(`Reading cookies: ${JSON.stringify(cookieData, undefined, 4)}`);
    return "sid=" + cookieData?.filter((cookie) => cookie.name === "sid")?.pop()?.value;
}
// from here: https://medium.com/@gevorggalstyan/how-to-promisify-node-js-http-https-requests-76a5a58ed90c
async function request(url, method = "GET", cookies, postData) {
    const lib = url.startsWith("https://") ? https : http;
    const [h] = url.split("://")[1].split("/");
    const [host, port] = h.split(":");
    const path = url.replace(/^(https?:\/\/)?[^/]+/, "");
    const params = {
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
    return new Promise((resolve, reject) => {
        const request = lib.request(params, (response) => {
            if (response?.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
                console.error("request error", response);
                return reject(new Error(`Status Code: ${response?.statusCode}`));
            }
            const data = [];
            response.on("data", (chunk) => {
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
async function callApiToRefreshConnector(connectorId, username, password) {
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
        const resultJSON = JSON.parse(result);
        if (resultJSON?.code && resultJSON.code === "IM001") {
            // access denied, cookie is invalid, try again with new cookie
            LOG("Session has timed-out. Refreshing cookie and retrying!");
            await fs.unlink(COOKIE_FILE);
        }
        else if (!resultJSON?.response || !resultJSON.code || resultJSON.code !== "OK") {
            LOG(`Calling API failed: ${result}`);
            throw new Error("FAILED to refresh connector. \n" + JSON.stringify(resultJSON.debug, undefined, 4));
        }
        else {
            LOG("SUCCESSfully refreshed", result);
            return;
        }
    }
}
function refresh(connectorId, username, password) {
    return callApiToRefreshConnector(connectorId, username, password)
        .catch(console.error);
}
(async () => {
    const program = new commander_1.Command();
    program
        .requiredOption("-u, --username <username>", "The Integromat username to use for login.")
        .requiredOption("-p, --password <password>", "The Integromat password of the user to use for login.")
        .requiredOption("-c, --connection-id <id>", "The ID of the connector to refresh.");
    program.parse(process.argv);
    const options = program.opts();
    return await refresh(options.connectorId, options.username, options.password);
})();
//# sourceMappingURL=index.js.map