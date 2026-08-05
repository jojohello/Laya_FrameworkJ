import {
    cloneDefaultTextureImportRules,
    normalizeAssetPath,
    normalizeTextureImportRule,
    resolveTextureImportRule,
    TEXTURE_IMPORT_SETTINGS_NAME,
    TextureImportAuditReport,
    TextureImportDecision,
    TextureDirectoryReimportReport,
    TextureImporterSettingsData,
    TextureImportRuleData,
    TextureImportSettingsData,
    validateTextureImportRules,
} from "./TextureImportTypes";

interface ImageSize {
    width: number;
    height: number;
}

interface AtlasConfigData {
    includeSubFolders?: boolean;
    eachMaxWidth?: number;
    eachMaxHeight?: number;
}

/** Scene-process owner of rule matching, AtlasConfig boundaries and image reimport. */
export class TextureImportRuleService {
    private static _settings: IEditorEnv.ISettings;
    private static _firstSync: Promise<void>;

    static async preprocessImage(importer: IEditorEnv.IImageAssetImporter): Promise<TextureImportDecision> {
        const settings = await this.getSettingsData();
        const invalidRules = validateTextureImportRules(settings);
        if (invalidRules.length > 0) {
            return {
                assetPath: importer.asset.file,
                atlasManaged: false,
                matched: false,
                needsChange: false,
                error: invalidRules.join("；"),
            };
        }
        const decision = await this.analyzeAsset(importer.asset, importer.settings as TextureImporterSettingsData, importer.assetFullPath);
        if (!decision.matched || decision.atlasManaged || decision.error) return decision;

        const rule = await this.getRuleForAsset(importer.asset.file);
        if (!rule) return decision;
        this.applyRule(importer.settings as TextureImporterSettingsData, rule);
        return decision;
    }

    static async audit(): Promise<TextureImportAuditReport> {
        return this.inspectAllImages();
    }

    static async applyAndReimport(): Promise<TextureImportAuditReport> {
        const before = await this.inspectAllImages();
        if (before.invalidRules.length > 0 || before.errors.length > 0) return before;
        const changedImages = await this.reimportChangedImages();
        await EditorEnv.assetMgr.flushChanges();
        const dependencyCount = this.reimportImageDependents(changedImages);
        await EditorEnv.assetMgr.flushChanges();
        const after = await this.inspectAllImages();
        after.applied = before.needsChange;
        after.reimportedDependencies = dependencyCount;
        return after;
    }

    static async inspectConfiguredDirectories(): Promise<TextureDirectoryReimportReport> {
        const settings = await this.getSettingsData();
        return this.collectConfiguredDirectoryAssets(settings).report;
    }

    static async reimportConfiguredDirectories(): Promise<TextureDirectoryReimportReport> {
        const settings = await this.getSettingsData();
        const collection = this.collectConfiguredDirectoryAssets(settings);
        const report = collection.report;
        if (report.invalidRules.length > 0 || report.missingPaths.length > 0) return report;

        // Images must finish first so atlas, TileMap and other dependent importers see the new texture settings.
        for (const asset of collection.images) {
            EditorEnv.assetMgr.importAsset(asset, ["texture-import-rules-full-directory"]);
        }
        await EditorEnv.assetMgr.flushChanges();
        for (const asset of collection.otherAssets) {
            EditorEnv.assetMgr.importAsset(asset, ["texture-import-rules-full-directory-dependent"]);
        }
        await EditorEnv.assetMgr.flushChanges();
        return report;
    }

    private static async inspectAllImages(): Promise<TextureImportAuditReport> {
        const settings = await this.getSettingsData();
        const invalidRules = validateTextureImportRules(settings);
        const report: TextureImportAuditReport = {
            scanned: 0,
            applied: 0,
            matched: 0,
            atlasManaged: 0,
            needsChange: 0,
            unchanged: 0,
            unmatched: 0,
            invalidRules,
            changedPaths: [],
            unmatchedPaths: [],
            errors: [],
        };
        if (invalidRules.length > 0) return report;

        const assets = EditorEnv.assetMgr.getAssetsByType([IEditorEnv.AssetType.Image]);
        for (const asset of assets) {
            report.scanned++;
            try {
                const meta = await EditorEnv.assetMgr.readMetaAsync(asset, true);
                const importerSettings = (meta?.importer ?? {}) as TextureImporterSettingsData;
                const decision = await this.analyzeAsset(asset, importerSettings, EditorEnv.assetMgr.getFullPath(asset), settings.rules);
                if (decision.error) {
                    if (report.errors.length < 30) report.errors.push(`${asset.file}: ${decision.error}`);
                    continue;
                }
                if (!decision.matched) {
                    report.unmatched++;
                    if (report.unmatchedPaths.length < 30) report.unmatchedPaths.push(asset.file);
                    continue;
                }
                report.matched++;
                if (decision.atlasManaged) {
                    report.atlasManaged++;
                    continue;
                }
                if (decision.needsChange) {
                    report.needsChange++;
                    if (report.changedPaths.length < 50) report.changedPaths.push(asset.file);
                } else {
                    report.unchanged++;
                }
            } catch (error) {
                const message = `${asset.file}: ${error instanceof Error ? error.message : String(error)}`;
                if (report.errors.length < 30) report.errors.push(message);
            }
        }
        return report;
    }

    private static async reimportChangedImages(): Promise<Set<string>> {
        const settings = await this.getSettingsData();
        const assets = EditorEnv.assetMgr.getAssetsByType([IEditorEnv.AssetType.Image]);
        const changedImages = new Set<string>();
        for (const asset of assets) {
            const meta = await EditorEnv.assetMgr.readMetaAsync(asset, true);
            const importerSettings = (meta?.importer ?? {}) as TextureImporterSettingsData;
            const decision = await this.analyzeAsset(asset, importerSettings, EditorEnv.assetMgr.getFullPath(asset), settings.rules);
            if (decision.needsChange && !decision.error) {
                EditorEnv.assetMgr.importAsset(asset, ["texture-import-rules"]);
                changedImages.add(normalizeAssetPath(asset.file));
            }
        }
        return changedImages;
    }

    private static reimportImageDependents(changedImages: ReadonlySet<string>): number {
        if (changedImages.size === 0) return 0;
        const dependents = new Map<string, IEditorEnv.IAssetInfo>();
        const candidates = EditorEnv.assetMgr.getAssetsByType([
            IEditorEnv.AssetType.Atlas,
            IEditorEnv.AssetType.Json,
        ]);
        for (const asset of candidates) {
            const references = this.readImageReferences(asset);
            if (references.some(path => changedImages.has(path))) dependents.set(asset.id, asset);
        }
        for (const asset of Array.from(dependents.values()).sort((left, right) => left.file.localeCompare(right.file))) {
            EditorEnv.assetMgr.importAsset(asset, ["texture-import-rules-dependent"]);
        }
        return dependents.size;
    }

    private static readImageReferences(asset: IEditorEnv.IAssetInfo): string[] {
        try {
            const fs = IEditorEnv.require("fs") as { readFileSync(path: string, encoding: string): string };
            const data = JSON.parse(fs.readFileSync(EditorEnv.assetMgr.getFullPath(asset), "utf8")) as any;
            const references: string[] = [];
            if (asset.type === IEditorEnv.AssetType.Atlas && typeof data?.meta?.image === "string") {
                references.push(this.resolveAssetReference(asset.file, data.meta.image));
            } else if (asset.type === IEditorEnv.AssetType.Json && Array.isArray(data?.tilesets)) {
                for (const tileset of data.tilesets) {
                    if (typeof tileset?.image === "string") {
                        references.push(this.resolveAssetReference(asset.file, tileset.image));
                    }
                }
            }
            return references;
        } catch {
            return [];
        }
    }

    private static resolveAssetReference(ownerFile: string, reference: string): string {
        const normalizedReference = normalizeAssetPath(reference);
        if (reference.replace(/\\/g, "/").startsWith("assets/")) return normalizedReference;
        const ownerParts = normalizeAssetPath(ownerFile).split("/");
        ownerParts.pop();
        const parts = ownerParts.concat(normalizedReference.split("/"));
        const resolved: string[] = [];
        for (const part of parts) {
            if (!part || part === ".") continue;
            if (part === "..") resolved.pop();
            else resolved.push(part);
        }
        return resolved.join("/");
    }

    private static collectConfiguredDirectoryAssets(settings: TextureImportSettingsData): {
        report: TextureDirectoryReimportReport;
        images: IEditorEnv.IAssetInfo[];
        otherAssets: IEditorEnv.IAssetInfo[];
    } {
        const invalidRules = validateTextureImportRules(settings);
        const missingPaths: string[] = [];
        const directories = new Map<string, IEditorEnv.IAssetInfo>();
        const assets = new Map<string, IEditorEnv.IAssetInfo>();
        if (invalidRules.length === 0) {
            for (const rule of settings.rules) {
                if (!rule.enabled) continue;
                const path = normalizeAssetPath(rule.path);
                const folder = EditorEnv.assetMgr.getAsset(path);
                if (!folder || folder.type !== IEditorEnv.AssetType.Folder) {
                    missingPaths.push(path);
                    continue;
                }
                directories.set(folder.id, folder);
                for (const asset of EditorEnv.assetMgr.getAllAssetsInDir(folder)) {
                    if (asset.type === IEditorEnv.AssetType.Folder) continue;
                    if ((asset.flags & IEditorEnv.AssetFlags.SubAsset) !== 0) continue;
                    assets.set(asset.id, asset);
                }
            }
        }
        const orderedAssets = Array.from(assets.values()).sort((left, right) => left.file.localeCompare(right.file));
        const images = orderedAssets.filter(asset => asset.type === IEditorEnv.AssetType.Image);
        const otherAssets = orderedAssets.filter(asset => asset.type !== IEditorEnv.AssetType.Image);
        return {
            report: {
                directories: directories.size,
                assets: orderedAssets.length,
                images: images.length,
                otherAssets: otherAssets.length,
                invalidRules,
                missingPaths,
            },
            images,
            otherAssets,
        };
    }

    private static async analyzeAsset(
        asset: IEditorEnv.IAssetInfo,
        importerSettings: TextureImporterSettingsData,
        fullPath: string,
        suppliedRules?: ReadonlyArray<TextureImportRuleData>,
    ): Promise<TextureImportDecision> {
        const rules = suppliedRules ?? (await this.getSettingsData()).rules;
        const rule = resolveTextureImportRule(asset.file, rules);
        if (!rule) {
            return { assetPath: asset.file, atlasManaged: false, matched: false, needsChange: false };
        }

        try {
            const atlasManaged = rule.skipWhenAtlasManaged
                ? await this.isActuallyManagedByAtlasConfig(asset, importerSettings, fullPath)
                : false;
            return {
                assetPath: asset.file,
                ruleId: rule.id,
                atlasManaged,
                matched: true,
                needsChange: !atlasManaged && !this.matchesRule(importerSettings, rule),
            };
        } catch (error) {
            return {
                assetPath: asset.file,
                ruleId: rule.id,
                atlasManaged: false,
                matched: true,
                needsChange: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private static async getRuleForAsset(assetPath: string): Promise<TextureImportRuleData | undefined> {
        return resolveTextureImportRule(assetPath, (await this.getSettingsData()).rules);
    }

    private static async getSettingsData(): Promise<TextureImportSettingsData> {
        if (!this._settings) {
            this._settings = EditorEnv.getSettings(TEXTURE_IMPORT_SETTINGS_NAME, true);
            this._firstSync = this._settings.sync();
        }
        await this._firstSync;
        const data = this._settings.data as Partial<TextureImportSettingsData>;
        return {
            version: Number(data.version ?? 1),
            rules: Array.isArray(data.rules)
                ? data.rules.map(rule => normalizeTextureImportRule(rule))
                : cloneDefaultTextureImportRules(),
        };
    }

    private static applyRule(settings: TextureImporterSettingsData, rule: TextureImportRuleData): void {
        const usesCompressedTexture = rule.androidFormat !== "R8G8B8A8" || rule.iosFormat !== "R8G8B8A8";
        settings.platformDefault = {
            ...(settings.platformDefault ?? {}),
            format: usesCompressedTexture ? 10 : 0,
            quality: rule.quality,
        };
        settings.platformPC = {
            ...(settings.platformPC ?? {}),
            format: rule.pcFormat,
            quality: rule.quality,
        };
        settings.platformAndroid = {
            ...(settings.platformAndroid ?? {}),
            format: rule.androidFormat,
            quality: rule.quality,
        };
        settings.platformIOS = {
            ...(settings.platformIOS ?? {}),
            format: rule.iosFormat,
            quality: rule.quality,
        };
    }

    private static matchesRule(settings: TextureImporterSettingsData, rule: TextureImportRuleData): boolean {
        const expectedDefaultFormat = rule.androidFormat !== "R8G8B8A8" || rule.iosFormat !== "R8G8B8A8" ? 10 : 0;
        return settings.platformDefault?.format === expectedDefaultFormat
            && settings.platformDefault?.quality === rule.quality
            && settings.platformPC?.format === rule.pcFormat
            && settings.platformPC?.quality === rule.quality
            && settings.platformAndroid?.format === rule.androidFormat
            && settings.platformAndroid?.quality === rule.quality
            && settings.platformIOS?.format === rule.iosFormat
            && settings.platformIOS?.quality === rule.quality;
    }

    private static async isActuallyManagedByAtlasConfig(
        asset: IEditorEnv.IAssetInfo,
        settings: TextureImporterSettingsData,
        fullPath: string,
    ): Promise<boolean> {
        const effectiveTextureType = settings.textureType ?? Number(EditorEnv.editorSettings.data.textureType ?? 0);
        if (effectiveTextureType !== 2) return false;

        const size = await this.readImageSize(fullPath);
        let folder = asset.parentId ? EditorEnv.assetMgr.getAsset(asset.parentId) : null;
        let isDirectFolder = true;
        const visited = new Set<string>();
        while (folder && folder.type === IEditorEnv.AssetType.Folder && !visited.has(folder.id)) {
            visited.add(folder.id);
            for (const child of folder.children) {
                if (child.type !== IEditorEnv.AssetType.AtlasConfig) continue;
                const config = this.readAtlasConfig(child);
                if (!isDirectFolder && config.includeSubFolders !== true) continue;
                const maxWidth = Number(config.eachMaxWidth ?? 512);
                const maxHeight = Number(config.eachMaxHeight ?? 512);
                if (size.width <= maxWidth && size.height <= maxHeight) return true;
            }
            isDirectFolder = false;
            folder = folder.parentId ? EditorEnv.assetMgr.getAsset(folder.parentId) : null;
        }
        return false;
    }

    private static readAtlasConfig(asset: IEditorEnv.IAssetInfo): AtlasConfigData {
        const fs = IEditorEnv.require("fs") as { readFileSync(path: string, encoding: string): string };
        const text = fs.readFileSync(EditorEnv.assetMgr.getFullPath(asset), "utf8");
        return JSON.parse(text) as AtlasConfigData;
    }

    private static async readImageSize(fullPath: string): Promise<ImageSize> {
        const sharp = IEditorEnv.require("sharp") as (path: string) => { metadata(): Promise<{ width?: number; height?: number }> };
        const metadata = await sharp(fullPath).metadata();
        const width = Number(metadata.width ?? 0);
        const height = Number(metadata.height ?? 0);
        if (width <= 0 || height <= 0) throw new Error("无法读取图片尺寸");
        return { width, height };
    }
}
