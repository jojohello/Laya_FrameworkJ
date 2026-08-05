export enum GameEnvironment {
    Local = "local",
    Test = "test",
    Production = "production",
}

export enum Platform {
    WEB = "web",
    ANDROID = "android",
    IOS = "ios",
    MINIGAME = "minigame",
}

export enum LoginMode {
    Developer = "developer",
    Wechat = "wechat",
}

export interface GameEndpointConfig {
    loginApiBaseUrl: string;
    resourceBaseUrl: string;
    /** Local-development fallback only. Production must use the URL returned by login. */
    gatewayFallbackUrl: string;
}

export interface MyGameConfigSnapshot {
    environment: GameEnvironment;
    platform: Platform;
    loginMode: LoginMode;
    endpoints: Readonly<GameEndpointConfig>;
    remoteResourcePackages: ReadonlyArray<string>;
}

const LOGIN_MODE_PROFILES: Record<GameEnvironment, LoginMode> = {
    [GameEnvironment.Local]: LoginMode.Developer,
    [GameEnvironment.Test]: LoginMode.Wechat,
    [GameEnvironment.Production]: LoginMode.Wechat,
};

const ENDPOINT_PROFILES: Record<GameEnvironment, GameEndpointConfig> = {
    [GameEnvironment.Local]: {
        loginApiBaseUrl: "http://127.0.0.1:8081/api",
        resourceBaseUrl: "http://127.0.0.1:8080/",
        gatewayFallbackUrl: "ws://127.0.0.1:8082/ws/native",
    },
    [GameEnvironment.Test]: {
        loginApiBaseUrl: "",
        resourceBaseUrl: "",
        gatewayFallbackUrl: "",
    },
    [GameEnvironment.Production]: {
        loginApiBaseUrl: "",
        resourceBaseUrl: "",
        gatewayFallbackUrl: "",
    },
};

/**
 * Hand-maintained game configuration owned by the Start package.
 * Logic receives only the immutable snapshot published on window.
 */
export class MyGameConfig {
    static readonly environment: GameEnvironment = GameEnvironment.Local;

    static readonly remoteResourcePackages = Object.freeze([
        "bigImg",
        "character",
        "config",
        "effects",
        "guides",
        "map",
        "scene",
        "shaders",
        "ui",
    ]);

    static get platform(): Platform {
        // onWeiXin also includes pages opened in the WeChat browser; only onMiniGame means mini-game SDK.
        if (Laya.Browser.onMiniGame) return Platform.MINIGAME;
        if (Laya.Browser.onAndroid) return Platform.ANDROID;
        if (Laya.Browser.onIOS) return Platform.IOS;
        return Platform.WEB;
    }

    static get loginMode(): LoginMode {
        return LOGIN_MODE_PROFILES[this.environment];
    }

    static get loginApiBaseUrl(): string {
        return this.requireUrl("登录服务器", this.currentEndpoints.loginApiBaseUrl);
    }

    static get resourceBaseUrl(): string {
        return this.ensureTrailingSlash(this.requireUrl("远程资源服务器", this.currentEndpoints.resourceBaseUrl));
    }

    /**
     * IDE preview registers packages from the project asset database. A published build
     * (including WeChat Developer Tools) must register the same packages from HTTP/HTTPS.
     */
    static get resourcePackageBaseUrl(): string | undefined {
        return Laya.LayaEnv.isPreview ? undefined : this.resourceBaseUrl;
    }

    static get gatewayFallbackUrl(): string {
        return this.currentEndpoints.gatewayFallbackUrl.trim();
    }

    static get isLocalEnvironment(): boolean {
        return this.environment === GameEnvironment.Local;
    }

    static createSnapshot(): Readonly<MyGameConfigSnapshot> {
        this.validateCurrentProfile();
        const endpoints = Object.freeze({
            loginApiBaseUrl: this.loginApiBaseUrl,
            resourceBaseUrl: this.resourceBaseUrl,
            gatewayFallbackUrl: this.gatewayFallbackUrl,
        });
        return Object.freeze({
            environment: this.environment,
            platform: this.platform,
            loginMode: this.loginMode,
            endpoints,
            remoteResourcePackages: this.remoteResourcePackages,
        });
    }

    static publish(): Readonly<MyGameConfigSnapshot> {
        const snapshot = this.createSnapshot();
        (Laya.Browser.window as any).myGameConfig = snapshot;
        return snapshot;
    }

    private static get currentEndpoints(): Readonly<GameEndpointConfig> {
        return ENDPOINT_PROFILES[this.environment];
    }

    private static requireUrl(name: string, value: string): string {
        const url = value.trim();
        if (!url) throw new Error(`${name}未配置，当前环境：${this.environment}`);
        return url;
    }

    private static validateCurrentProfile(): void {
        const loginUrl = this.loginApiBaseUrl;
        const resourceUrl = this.resourceBaseUrl;
        if (!/^https?:\/\//i.test(loginUrl)) {
            throw new Error(`登录服务器必须使用 HTTP/HTTPS：${loginUrl}`);
        }
        if (!/^https?:\/\//i.test(resourceUrl)) {
            throw new Error(`远程资源服务器必须使用 HTTP/HTTPS：${resourceUrl}`);
        }
        if (this.environment === GameEnvironment.Production) {
            if (this.loginMode !== LoginMode.Wechat) {
                throw new Error("Production 环境必须使用真实微信登录模式");
            }
            if (!loginUrl.toLowerCase().startsWith("https://") || !resourceUrl.toLowerCase().startsWith("https://")) {
                throw new Error("Production 环境的登录与资源服务器必须使用 HTTPS");
            }
            if (this.gatewayFallbackUrl) {
                throw new Error("Production 环境不得配置 Gateway 兜底地址，应使用登录响应返回值");
            }
        }
    }

    private static ensureTrailingSlash(url: string): string {
        return url.endsWith("/") ? url : `${url}/`;
    }
}
