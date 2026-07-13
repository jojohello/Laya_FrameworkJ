import { BaseSceneMap } from "./BaseSceneMap";
import { SceneMapConfig } from "./SceneMapTypes";

export class TileSceneMap extends BaseSceneMap {
    private _tiledMap: Laya.TiledMap | null = null;
    private _viewRect: Laya.Rectangle | null = null;

    constructor(config: SceneMapConfig) {
        super(config);
    }

    load(container: Laya.Sprite): Promise<void> {
        this._container = container;
        this._tiledMap = new Laya.TiledMap();
        this._viewRect = new Laya.Rectangle(0, 0, Laya.stage.width, Laya.stage.height);

        return new Promise<void>((resolve) => {
            this._tiledMap!.createMap(
                this._config.path,
                this._viewRect!,
                Laya.Handler.create(this, () => {
                    this.afterMapCreated(container);
                    resolve();
                }),
                undefined,
                undefined,
                this._config.enableLinear,
                this._config.limitRange
            );
        });
    }

    updateViewPort(x: number, y: number, width: number, height: number): void {
        if (!this._tiledMap || !this._viewRect) return;

        this._viewRect.x = x;
        this._viewRect.y = y;
        this._viewRect.width = width;
        this._viewRect.height = height;
        this._tiledMap.changeViewPort(x, y, width, height);
    }

    getLayerObject(layerName: string, objectName: string): any {
        return this._tiledMap ? this._tiledMap.getLayerObject(layerName, objectName) : null;
    }

    get tiledMap(): Laya.TiledMap | null {
        return this._tiledMap;
    }

    release(): void {
        if (this._tiledMap) {
            const mapSprite = (this._tiledMap as any)._mapSprite as Laya.Sprite | undefined;
            if (mapSprite) {
                mapSprite.removeSelf();
            }
            this._tiledMap.destroy();
            this._tiledMap = null;
        }
        this._viewRect = null;
        this._container = null;
    }

    private afterMapCreated(container: Laya.Sprite): void {
        if (!this._tiledMap) return;

        const mapSprite = (this._tiledMap as any)._mapSprite as Laya.Sprite | undefined;
        if (mapSprite && mapSprite.parent !== container) {
            container.addChild(mapSprite);
        }

        const tileWidth = this._tiledMap.tileWidth || this._config.tileWidth || 0;
        const tileHeight = this._tiledMap.tileHeight || this._config.tileHeight || 0;
        const columnCount = this._tiledMap.numColumnsTile || 0;
        const rowCount = this._tiledMap.numRowsTile || 0;

        this._tileWidth = this._config.tileWidth || tileWidth;
        this._tileHeight = this._config.tileHeight || tileHeight;
        this._width = this._config.width || (columnCount > 0 && tileWidth > 0 ? columnCount * tileWidth : this._tiledMap.width);
        this._height = this._config.height || (rowCount > 0 && tileHeight > 0 ? rowCount * tileHeight : this._tiledMap.height);
        this.updateViewPort(0, 0, Laya.stage.width, Laya.stage.height);
    }
}
