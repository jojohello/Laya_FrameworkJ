import { SceneMapConfig } from "./SceneMapTypes";

export abstract class BaseSceneMap {
    protected _config: SceneMapConfig;
    protected _container: Laya.Sprite | null = null;
    protected _width: number = 0;
    protected _height: number = 0;
    protected _tileWidth: number = 0;
    protected _tileHeight: number = 0;

    constructor(config: SceneMapConfig) {
        this._config = config;
    }

    abstract load(container: Laya.Sprite): Promise<void>;
    abstract release(): void;

    updateViewPort(_x: number, _y: number, _width: number, _height: number): void {
    }

    getLayerObject(_layerName: string, _objectName: string): any {
        return null;
    }

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    get tileWidth(): number {
        return this._tileWidth;
    }

    get tileHeight(): number {
        return this._tileHeight;
    }

    get path(): string {
        return this._config.path;
    }
}
