export const TEXTURE_IMPORT_SETTINGS_NAME = "JFrameworkTextureImportRules";
export const TEXTURE_IMPORT_SETTINGS_TYPE = "JFrameworkTextureImportSettings";
export const TEXTURE_IMPORT_RULE_TYPE = "JFrameworkTextureImportRule";
export const TEXTURE_IMPORT_DIALOG_NAME = "JFrameworkTextureImportDialog";

export const TEXTURE_FORMAT_OPTIONS = [
    { name: "不压缩（RGBA 32位）", value: "R8G8B8A8" },
    { name: "ASTC 4x4", value: "ASTC_4X4" },
    { name: "ASTC 6x6", value: "ASTC_6X6" },
    { name: "ASTC 8x8", value: "ASTC_8X8" },
    { name: "ASTC 10x10", value: "ASTC_10X10" },
    { name: "ASTC 12x12", value: "ASTC_12X12" },
] as const;

export const TEXTURE_FORMATS = new Set<string>(TEXTURE_FORMAT_OPTIONS.map(option => option.value));
export const PC_TEXTURE_FORMAT_OPTIONS = [
    { name: "RGBA 32位", value: "R8G8B8A8" },
    { name: "BC1", value: "BC1" },
    { name: "BC3", value: "BC3" },
] as const;
export const PC_TEXTURE_FORMATS = new Set<string>(PC_TEXTURE_FORMAT_OPTIONS.map(option => option.value));

export interface TextureImportRuleData {
    id: string;
    enabled: boolean;
    path: string;
    recursive: boolean;
    skipWhenAtlasManaged: boolean;
    pcFormat: string;
    androidFormat: string;
    iosFormat: string;
    quality: number;
}

export interface TextureImportSettingsData {
    version: number;
    rules: TextureImportRuleData[];
}

export interface TexturePlatformSettingsData {
    format: string;
    quality: number;
}

export interface TextureImporterSettingsData {
    textureType?: number;
    platformDefault?: {
        format?: number;
        quality?: number;
    };
    platformPC?: TexturePlatformSettingsData;
    platformAndroid?: TexturePlatformSettingsData;
    platformIOS?: TexturePlatformSettingsData;
    [key: string]: unknown;
}

export interface TextureImportDecision {
    assetPath: string;
    ruleId?: string;
    atlasManaged: boolean;
    matched: boolean;
    needsChange: boolean;
    error?: string;
}

export interface TextureImportAuditReport {
    scanned: number;
    applied: number;
    matched: number;
    atlasManaged: number;
    needsChange: number;
    unchanged: number;
    unmatched: number;
    invalidRules: string[];
    changedPaths: string[];
    unmatchedPaths: string[];
    errors: string[];
    reimportedDependencies?: number;
}

export interface TextureDirectoryReimportReport {
    directories: number;
    assets: number;
    images: number;
    otherAssets: number;
    invalidRules: string[];
    missingPaths: string[];
}

export const DEFAULT_TEXTURE_IMPORT_RULES: TextureImportRuleData[] = [
    createTextureImportRule("big-images", "bigImg"),
    createTextureImportRule("characters", "character"),
    createTextureImportRule("effects", "effects"),
    createTextureImportRule("maps", "map"),
    createTextureImportRule("startup-ui", "startupUI"),
    createTextureImportRule("ui", "ui"),
];

export function createTextureImportRule(
    id: string = "new-rule",
    path: string = "",
    format: string = "ASTC_6X6",
): TextureImportRuleData {
    return {
        id,
        enabled: true,
        path,
        recursive: true,
        skipWhenAtlasManaged: true,
        pcFormat: "R8G8B8A8",
        androidFormat: format,
        iosFormat: format,
        quality: 1,
    };
}

export function cloneDefaultTextureImportRules(): TextureImportRuleData[] {
    return DEFAULT_TEXTURE_IMPORT_RULES.map(rule => ({ ...rule }));
}

export function normalizeTextureImportRule(rule: Partial<TextureImportRuleData>): TextureImportRuleData {
    return {
        ...createTextureImportRule(String(rule.id ?? "new-rule"), String(rule.path ?? "")),
        ...rule,
    };
}

export function normalizeAssetPath(value: string): string {
    return String(value ?? "")
        .replace(/\\/g, "/")
        .replace(/^\.\//, "")
        .replace(/^assets\//, "")
        .replace(/^\/+|\/+$/g, "")
        .replace(/\/{2,}/g, "/");
}

export function isPathInRule(assetPath: string, rule: TextureImportRuleData): boolean {
    const normalizedAssetPath = normalizeAssetPath(assetPath);
    const normalizedRulePath = normalizeAssetPath(rule.path);
    if (!normalizedRulePath) return false;
    if (normalizedAssetPath === normalizedRulePath) return true;
    return rule.recursive && normalizedAssetPath.startsWith(`${normalizedRulePath}/`);
}

export function resolveTextureImportRule(assetPath: string, rules: ReadonlyArray<TextureImportRuleData>): TextureImportRuleData | undefined {
    return rules
        .filter(rule => rule.enabled && isPathInRule(assetPath, rule))
        .sort((left, right) => normalizeAssetPath(right.path).length - normalizeAssetPath(left.path).length)[0];
}

export function validateTextureImportRules(settings: Partial<TextureImportSettingsData>): string[] {
    const errors: string[] = [];
    const paths = new Set<string>();
    const ids = new Set<string>();
    for (const [index, rule] of (settings.rules ?? []).entries()) {
        if (!rule || !rule.enabled) continue;
        const prefix = `规则 ${index + 1}`;
        const id = String(rule.id ?? "").trim();
        const path = normalizeAssetPath(rule.path);
        if (!id) errors.push(`${prefix} 缺少 id`);
        else if (ids.has(id)) errors.push(`${prefix} 的 id 重复：${id}`);
        else ids.add(id);
        if (!path) errors.push(`${prefix} 缺少目录路径`);
        else if (path === ".." || path.startsWith("../") || path.includes("/../")) errors.push(`${prefix} 不能越出 assets：${path}`);
        else if (paths.has(path)) errors.push(`${prefix} 的目录重复：${path}`);
        else paths.add(path);
        if (!PC_TEXTURE_FORMATS.has(rule.pcFormat)) errors.push(`${prefix} PC 格式无效：${rule.pcFormat}`);
        if (!TEXTURE_FORMATS.has(rule.androidFormat)) errors.push(`${prefix} Android 格式无效：${rule.androidFormat}`);
        if (!TEXTURE_FORMATS.has(rule.iosFormat)) errors.push(`${prefix} iOS 格式无效：${rule.iosFormat}`);
        if (!Number.isInteger(rule.quality) || rule.quality < 0 || rule.quality > 2) errors.push(`${prefix} quality 必须是 0、1 或 2`);
    }
    return errors;
}
