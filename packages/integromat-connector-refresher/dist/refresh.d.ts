import type { BotAction, ConditionalBotAction } from "@botmation/core";
export declare const injectJQuery: () => BotAction;
export declare const login: (email: string, password: string) => BotAction;
export declare const isLoggedIn: ConditionalBotAction;
export declare const refreshConnector: (...connectorNames: string[]) => BotAction;
//# sourceMappingURL=refresh.d.ts.map