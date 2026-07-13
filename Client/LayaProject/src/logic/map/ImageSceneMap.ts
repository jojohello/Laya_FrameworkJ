import { BaseSceneMap } from "./BaseSceneMap";
import { SceneMapConfig } from "./SceneMapTypes";
import { ResourceMgr } from "../resource/ResourceMgr";
import { ResImage } from "../resource/ResImage";

export class ImageSceneMap extends BaseSceneMap {
    private _resImage: ResImage | null = null;

    constructor(config: SceneMapConfig) {
        super(config);
    }

    async load(container: Laya.Sprite): Promise<void> {
        this._container = container;

        this._resImage = await ResourceMgr.instance.load(this._config.path, ResImage);

        const loadedRes = Laya.loader.getRes(this._config.path) as any;
        const texture = loadedRes?.texture || loadedRes;

        const textureWidth = typeof texture?.width === "number" ? texture.width : 0;
        const textureHeight = typeof texture?.height === "number" ? texture.height : 0;
        this._width = this._config.width || textureWidth || Laya.stage.width;
        this._height = this._config.height || textureHeight || Laya.stage.height;
        this._tileWidth = this._config.tileWidth || this._width;
        this._tileHeight = this._config.tileHeight || this._height;

        const sprite = this._resImage.sprite;
        if (!sprite) {
            throw new Error(`[ImageSceneMap] ResImage sprite is null: ${this._config.path}`);
        }

        sprite.name = "ImageSceneMap";
        sprite.pos(0, 0);
        sprite.visible = true;
        sprite.zOrder = 0;
        sprite.width = this._width;
        sprite.height = this._height;
        container.addChild(sprite);

    }

    release(): void {
        if (this._resImage) {
            ResourceMgr.instance.recoverRes(this._resImage);
            this._resImage = null;
        }
        this._container = null;
    }
}
