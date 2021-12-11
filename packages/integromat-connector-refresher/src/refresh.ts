import type { BotAction, ConditionalBotAction } from "@botmation/core";
import type { CheerioAPI } from "cheerio"; // necessary for the type CheerioStatic

import {
    $$,
    chain,
    click,
    elementExists,
    errors,
    evaluate,
    forAll,
    givenThat,
    goTo,
    pipe,
    type,
    waitForNavigation,
} from "@botmation/core";

export const injectJQuery = (): BotAction =>
    evaluate(() => {
        ((function () {
            if (!window.jQuery) {
                // Load the script
                const script = document.createElement("SCRIPT") as HTMLScriptElement;
                script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
                script.type = "text/javascript";
                document.getElementsByTagName("head")[0].appendChild(script);

                let jQueryResolved: (data: JQuery) => void;
                let jQueryReject: (error: unknown) => void;
                const jQueryPromise = new Promise((resolve, reject) => {
                    jQueryResolved = resolve;
                    jQueryReject = reject;
                });

                script.onload = function () {
                    jQueryResolved(window.jQuery);
                };
                script.onerror = function (error) {
                    jQueryReject(error);
                };

                return jQueryPromise;
            } else {
                return Promise.resolve(window.jQuery);
            }
        })());
    })
;

export const login = (email: string, password: string): BotAction =>
    chain(
        errors("Integromat login()")(
            goTo("https://www.integromat.com/en/login"),
            click("form input[name=\"email\"]"),
            type(email),
            click("form input[name=\"password\"]"),
            type(password),
            click("form button[type=\"button\"]"),
            waitForNavigation,
        ),
    )
;

export const isLoggedIn: ConditionalBotAction = pipe()(
    goTo("https://www.integromat.com/en/login"),
    elementExists("div.content.content-dashboard"),
);

export const refreshConnector = (...connectorNames: string[]): BotAction =>
    chain(
        errors("Integromat connector refresh")(
            ((): BotAction => {
                connectorNames = (connectorNames || []).map((name) => name.trim().toLowerCase());
                return () => Promise.resolve();
            })(),
            goTo("https://www.integromat.com/accounts"),
            injectJQuery(),
            $$("div.list-group-item.connection"),
            forAll()((connector: CheerioAPI) => ([
                givenThat(() => Promise.resolve(
                    !connectorNames ||
                        connectorNames.length === 0 ||
                        connectorNames.indexOf(connector(".list-group-title")
                            .text()
                            .trim()
                            .toLowerCase()) >= 0,
                ),
                )(click("div.list-group-item.connection button.btn-success[data-id*='" +
                    connector("button.btn-success").attr("data-id") + "']"),
                ),
            ])),
        ),
    )
;
