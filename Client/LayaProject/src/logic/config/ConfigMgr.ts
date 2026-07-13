/**
 * JSON config manager for client runtime.
 *
 * CSV files are exported by Config/tools/exportClient.js. Runtime code only
 * consumes generated JSON files and config/config-manifest.json.
 */
import { IManager } from "../core/IManager";

type ConfigId = number | string;

export interface ConfigTableMeta {
    name: string;
    file: string;
    path: string;
    rows?: number;
}

interface ConfigManifest {
    version: number;
    generatedAt?: string;
    tables: ConfigTableMeta[];
}

interface ConfigTableInfo {
    name: string;
    path: string;
    data: any[];
    map: Map<ConfigId, any>;
    fieldIndexes: Map<string, Map<any, any[]>>;
    idKey: string | null;
    isParsed: boolean;
}

export class ConfigMgr implements IManager {
    private static _instance: ConfigMgr;

    static get instance(): ConfigMgr {
        if (!this._instance) this._instance = new ConfigMgr();
        return this._instance;
    }

    private constructor() {}

    private readonly _tableMetas: ConfigTableMeta[] = [];
    private readonly _tableCache: Map<string, ConfigTableInfo> = new Map();
    private _configPath: string = "config/";
    private _manifestFile: string = "config-manifest.json";

    async init(): Promise<void> {
        await this.loadManifest();

        if (this._tableMetas.length === 0) {
            console.warn("[ConfigMgr] No config tables in manifest");
            return;
        }

        const paths = this._tableMetas.map(meta => this.resolvePath(meta));

        try {
            await Laya.loader.load(paths);

            for (const meta of this._tableMetas) {
                const path = this.resolvePath(meta);
                const res = Laya.loader.getRes(path);
                
                // LayaAir 3.x: JSON 数据存储在 data 属性中
                const data = res?.data;

                if (!Array.isArray(data)) {
                    console.error(`[ConfigMgr] Invalid config table: ${meta.name}, path=${path}`);
                    continue;
                }

                this._tableCache.set(meta.name, {
                    name: meta.name,
                    path,
                    data,
                    map: new Map(),
                    fieldIndexes: new Map(),
                    idKey: null,
                    isParsed: false,
                });
            }
        } catch (error) {
            console.error("[ConfigMgr] Failed to load config tables:", error);
            throw error;
        }
    }

    update(_dt: number): void {
    }

    reset(): void {
        this._tableCache.clear();
    }

    release(): void {
        for (const info of this._tableCache.values()) {
            Laya.loader.clearRes(info.path);
        }
        this._tableCache.clear();
    }

    getConfig<T = any>(tableName: string, id: ConfigId): T | null {
        const info = this.getParsedTableInfo(tableName);
        if (!info) return null;
        return (info.map.get(id) as T) || null;
    }

    requireConfig<T = any>(tableName: string, id: ConfigId): T {
        const config = this.getConfig<T>(tableName, id);
        if (!config) {
            throw new Error(`[ConfigMgr] Missing config: ${tableName}.${id}`);
        }
        return config;
    }

    getConfigTable<T = any>(tableName: string): readonly T[] {
        const info = this.getTableInfo(tableName);
        return info ? info.data as readonly T[] : [];
    }

    getAll<T = any>(tableName: string): readonly T[] {
        return this.getConfigTable<T>(tableName);
    }

    getByField<T = any>(tableName: string, fieldName: string, value: any): readonly T[] {
        const info = this.getParsedTableInfo(tableName);
        if (!info) return [];

        let index = info.fieldIndexes.get(fieldName);
        if (!index) {
            index = this.buildFieldIndex(info, fieldName);
            info.fieldIndexes.set(fieldName, index);
        }

        return (index.get(value) as T[]) || [];
    }

    getFirstByField<T = any>(tableName: string, fieldName: string, value: any): T | null {
        const list = this.getByField<T>(tableName, fieldName, value);
        return list.length > 0 ? list[0] : null;
    }

    hasConfig(tableName: string, id: ConfigId): boolean {
        const info = this.getParsedTableInfo(tableName);
        return info ? info.map.has(id) : false;
    }

    async reloadConfig(tableName: string): Promise<boolean> {
        const meta = this.getTableMeta(tableName);
        if (!meta) {
            console.error(`[ConfigMgr] Cannot reload unknown table: ${tableName}`);
            return false;
        }

        const path = this.resolvePath(meta);
        Laya.loader.clearRes(path);
        this._tableCache.delete(tableName);

        try {
            await Laya.loader.load(path);
            const data = Laya.loader.getRes(path);
            if (!Array.isArray(data)) {
                console.error(`[ConfigMgr] Invalid config table after reload: ${tableName}`);
                return false;
            }

            this._tableCache.set(tableName, {
                name: tableName,
                path,
                data,
                map: new Map(),
                fieldIndexes: new Map(),
                idKey: null,
                isParsed: false,
            });
            return true;
        } catch (error) {
            console.error(`[ConfigMgr] Failed to reload config: ${tableName}`, error);
            return false;
        }
    }

    async loadConfig(tableName: string): Promise<boolean> {
        if (this._tableCache.has(tableName)) {
            return true;
        }
        if (!this.getTableMeta(tableName)) {
            this.addConfig(tableName);
        }
        return this.reloadConfig(tableName);
    }

    setConfigPath(prefix: string): void {
        this._configPath = prefix.endsWith("/") ? prefix : `${prefix}/`;
    }

    setManifestFile(fileName: string): void {
        this._manifestFile = fileName;
    }

    addConfig(tableName: string, fileName?: string): void {
        if (this.getTableMeta(tableName)) {
            return;
        }

        const file = fileName || `${tableName}.json`;
        this._tableMetas.push({
            name: tableName,
            file,
            path: `${this._configPath}${file}`,
        });
    }

    isLoaded(tableName: string): boolean {
        return this._tableCache.has(tableName);
    }

    getLoadedTables(): string[] {
        return Array.from(this._tableCache.keys());
    }

    get loadedCount(): number {
        return this._tableCache.size;
    }

    private getParsedTableInfo(tableName: string): ConfigTableInfo | null {
        const info = this.getTableInfo(tableName);
        if (!info) return null;

        if (!info.isParsed) {
            this.parseTable(info);
        }

        return info;
    }

    private getTableInfo(tableName: string): ConfigTableInfo | null {
        const info = this._tableCache.get(tableName);
        if (!info) {
            console.warn(`[ConfigMgr] Table not found: ${tableName}`);
            return null;
        }
        return info;
    }

    private parseTable(info: ConfigTableInfo): void {
        if (info.isParsed) return;

        const idKey = this.findIdKey(info.data);
        if (!idKey) {
            throw new Error(`[ConfigMgr] No ID field found in table: ${info.name}`);
        }

        const map = new Map<ConfigId, any>();
        for (const row of info.data) {
            const id = row[idKey];
            if (id === undefined || id === null) {
                throw new Error(`[ConfigMgr] Missing ID in table: ${info.name}`);
            }
            if (map.has(id)) {
                throw new Error(`[ConfigMgr] Duplicate ID in table: ${info.name}.${id}`);
            }
            map.set(id, row);
        }

        info.idKey = idKey;
        info.map = map;
        info.isParsed = true;
    }

    private buildFieldIndex(info: ConfigTableInfo, fieldName: string): Map<any, any[]> {
        const index = new Map<any, any[]>();

        for (const row of info.data) {
            if (!(fieldName in row)) {
                continue;
            }

            const value = row[fieldName];
            let list = index.get(value);
            if (!list) {
                list = [];
                index.set(value, list);
            }
            list.push(row);
        }

        return index;
    }

    private findIdKey(data: any[]): string | null {
        if (!data || data.length === 0) return null;
        const keys = Object.keys(data[0]);
        return keys.find(key => key.toLowerCase() === "id") || null;
    }

    private getTableMeta(tableName: string): ConfigTableMeta | null {
        return this._tableMetas.find(meta => meta.name === tableName) || null;
    }

    private async loadManifest(): Promise<void> {
        const manifestPath = `${this._configPath}${this._manifestFile}`;
        Laya.loader.clearRes(manifestPath);

        try {
            await Laya.loader.load(manifestPath);
            const res = Laya.loader.getRes(manifestPath);
            
            // LayaAir 3.x: JSON 数据存储在 data 属性中
            const manifest = res?.data as ConfigManifest | null;

            if (!manifest || !Array.isArray(manifest.tables)) {
                throw new Error(`invalid manifest format: ${manifestPath}`);
            }

            this._tableMetas.length = 0;
            for (const table of manifest.tables) {
                if (!table.name || !table.file) {
                    console.warn("[ConfigMgr] Invalid table meta in manifest:", table);
                    continue;
                }

                this._tableMetas.push({
                    name: table.name,
                    file: table.file,
                    path: table.path || `${this._configPath}${table.file}`,
                    rows: table.rows,
                });
            }
        } catch (error) {
            console.error(`[ConfigMgr] Failed to load manifest: ${manifestPath}`, error);
            throw error;
        }
    }

    private resolvePath(meta: ConfigTableMeta): string {
        return `${this._configPath}${meta.file}`;
    }
}
