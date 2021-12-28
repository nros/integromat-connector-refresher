"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshConnector = exports.isLoggedIn = exports.login = exports.injectJQuery = void 0;
const core_1 = require("@botmation/core");
const injectJQuery = () => (0, core_1.evaluate)(() => {
    ((function () {
        if (!window.jQuery) {
            // Load the script
            const script = document.createElement("SCRIPT");
            script.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
            script.type = "text/javascript";
            document.getElementsByTagName("head")[0].appendChild(script);
            let jQueryResolved;
            let jQueryReject;
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
        }
        else {
            return Promise.resolve(window.jQuery);
        }
    })());
});
exports.injectJQuery = injectJQuery;
const login = (email, password) => (0, core_1.chain)((0, core_1.errors)("Integromat login()")((0, core_1.goTo)("https://www.integromat.com/en/login"), (0, core_1.click)("form input[name=\"email\"]"), (0, core_1.type)(email), (0, core_1.click)("form input[name=\"password\"]"), (0, core_1.type)(password), (0, core_1.click)("form button[type=\"button\"]"), core_1.waitForNavigation));
exports.login = login;
exports.isLoggedIn = (0, core_1.pipe)()((0, core_1.goTo)("https://www.integromat.com/en/login"), (0, core_1.elementExists)("div.content.content-dashboard"));
const refreshConnector = (...connectorNames) => (0, core_1.chain)((0, core_1.errors)("Integromat connector refresh")((() => {
    connectorNames = (connectorNames || []).map((name) => name.trim().toLowerCase());
    return () => Promise.resolve();
})(), (0, core_1.goTo)("https://www.integromat.com/accounts"), (0, exports.injectJQuery)(), (0, core_1.$$)("div.list-group-item.connection"), (0, core_1.forAll)()((connector) => ([
    (0, core_1.givenThat)(() => Promise.resolve(!connectorNames ||
        connectorNames.length === 0 ||
        connectorNames.indexOf(connector(".list-group-title")
            .text()
            .trim()
            .toLowerCase()) >= 0))((0, core_1.click)("div.list-group-item.connection button.btn-success[data-id*='" +
        connector("button.btn-success").attr("data-id") + "']")),
]))));
exports.refreshConnector = refreshConnector;
//# sourceMappingURL=refresh.js.map