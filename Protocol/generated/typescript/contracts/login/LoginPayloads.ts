/** Generated from Protocol/contracts/login/schema.json. Do not edit. */

function isRecord(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, any>, keys: readonly string[]): boolean {
    return Object.keys(value).every(key => keys.includes(key));
}

export interface LoginRequest {
    type: string;
    authCode: string;
    platform: string;
    deviceInfo: string;
    version: string;
    developerAccount?: string;
    profileEncryptedData?: string;
    profileIv?: string;
}

export function isLoginRequest(value: unknown): value is LoginRequest {
    return isRecord(value)
        && hasOnlyKeys(value, ["type","authCode","platform","deviceInfo","version","developerAccount","profileEncryptedData","profileIv"])
        && typeof value.type === "string" && value.type.length >= 5 && value.type.length <= 7 && new RegExp("^(GUEST|WECHAT)$").test(value.type)
        && typeof value.authCode === "string" && value.authCode.length >= 1 && value.authCode.length <= 512
        && typeof value.platform === "string" && value.platform.length >= 1 && value.platform.length <= 32
        && typeof value.deviceInfo === "string" && value.deviceInfo.length >= 1 && value.deviceInfo.length <= 512
        && typeof value.version === "string" && value.version.length >= 1 && value.version.length <= 64
        && (value.developerAccount === undefined || (typeof value.developerAccount === "string" && value.developerAccount.length >= 1 && value.developerAccount.length <= 24 && new RegExp("^[a-zA-Z0-9_!@#$%^&*]+$").test(value.developerAccount)))
        && (value.profileEncryptedData === undefined || (typeof value.profileEncryptedData === "string" && value.profileEncryptedData.length >= 1 && value.profileEncryptedData.length <= 16384))
        && (value.profileIv === undefined || (typeof value.profileIv === "string" && value.profileIv.length >= 1 && value.profileIv.length <= 256));
}

export interface LoginResponse {
    success: boolean;
    errorCode?: string;
    errorMessage?: string;
    token?: string;
    userId?: string;
    loginTimestamp?: number;
    nickname?: string;
    avatar?: string;
    gatewayWsUrl?: string;
}

export function isLoginResponse(value: unknown): value is LoginResponse {
    return isRecord(value)
        && hasOnlyKeys(value, ["success","errorCode","errorMessage","token","userId","loginTimestamp","nickname","avatar","gatewayWsUrl"])
        && typeof value.success === "boolean"
        && (value.errorCode === undefined || (typeof value.errorCode === "string" && value.errorCode.length >= 1 && value.errorCode.length <= 64))
        && (value.errorMessage === undefined || (typeof value.errorMessage === "string" && value.errorMessage.length >= 1 && value.errorMessage.length <= 256))
        && (value.token === undefined || (typeof value.token === "string" && value.token.length >= 1 && value.token.length <= 4096))
        && (value.userId === undefined || (typeof value.userId === "string" && value.userId.length >= 1 && value.userId.length <= 100))
        && (value.loginTimestamp === undefined || (Number.isSafeInteger(value.loginTimestamp) && value.loginTimestamp >= 0 && value.loginTimestamp <= 9007199254740991))
        && (value.nickname === undefined || (typeof value.nickname === "string" && value.nickname.length >= 1 && value.nickname.length <= 100))
        && (value.avatar === undefined || (typeof value.avatar === "string" && value.avatar.length >= 1 && value.avatar.length <= 2048))
        && (value.gatewayWsUrl === undefined || (typeof value.gatewayWsUrl === "string" && value.gatewayWsUrl.length >= 6 && value.gatewayWsUrl.length <= 2048 && new RegExp("^wss?://.+").test(value.gatewayWsUrl)))
        && (value.success !== true || (value.token !== undefined && value.userId !== undefined && value.loginTimestamp !== undefined && value.nickname !== undefined && value.avatar !== undefined && value.gatewayWsUrl !== undefined && value.errorCode === undefined && value.errorMessage === undefined))
        && (value.success !== false || (value.errorCode !== undefined && value.errorMessage !== undefined && value.token === undefined && value.userId === undefined && value.loginTimestamp === undefined && value.nickname === undefined && value.avatar === undefined && value.gatewayWsUrl === undefined));
}

