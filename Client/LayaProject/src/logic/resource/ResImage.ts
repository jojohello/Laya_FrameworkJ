import { ResBase } from "./ResBase";

/**
 * 图片资源
 * 用于加载和管理单张图片
 */
export class ResImage extends ResBase {
    private _sprite: Laya.Sprite | null = null;

    async buildRes(): Promise<void> {
        // 获取已加载的纹理
        let texture = Laya.loader.getRes(this._url) as Laya.Texture;

        if (!texture) {
            console.error(`[ResImage] 纹理未加载: ${this._url}`);
            return;
        }

        // 创建 Sprite 并使用 graphics.drawTexture 绘制
        if (!this._sprite) {
            this._sprite = new Laya.Sprite();
        }

        // Laya3.x 推荐使用 graphics.drawTexture
        this._sprite.graphics.clear();
        this._sprite.graphics.drawTexture(texture, 0, 0);
        this._sprite.visible = true;
        this._node = this._sprite;

        this.initTransform();
    }

    onRecycle(): void {
        if (this._sprite) {
            this._sprite.visible = false;
            this._sprite.removeSelf();
        }
    }

    onDispose(): void {
        if (this._sprite) {
            this._sprite.destroy();
            this._sprite = null;
            this._node = null;
        }
    }

    /**
     * 获取 Sprite 实例
     */
    get sprite(): Laya.Sprite | null {
        return this._sprite;
    }
}
