import { SceneLayerType } from "../scene/SceneLayerType";
import { BaseSceneObj } from "./BaseSceneObj";
import { SceneObjType } from "./SceneObjType";

/**
 * Display-only scene object.
 * Subclasses can replace the model container with image, animation, or spine nodes.
 */
export class DisplaySceneObj extends BaseSceneObj {
    protected _displayLayerType: SceneLayerType = SceneLayerType.Object;

    getObjType(): number {
        return SceneObjType.Item;
    }

    protected loadRes(): void {
        this.createModelContainer();
    }

    protected createModelContainer(): Laya.Sprite {
        const model = this._model || new Laya.Sprite();
        model.name = `${this.getClassName()}_${this.uid}`;
        this.addModelToScene(model, this._displayLayerType);
        return model;
    }

    setSpriteTexture(texture: Laya.Texture): void {
        if (!this._model) {
            this.createModelContainer();
        }

        this._model!.graphics.clear();
        this._model!.graphics.drawTexture(texture, -texture.width * 0.5, -texture.height * 0.5);
        this._transform.forceUpdate();
    }

    playAnim(
        _name: string,
        _startTime: number,
        _loop?: boolean,
        _force: boolean = false,
        _curTime: number = _startTime
    ): number {
        // Reserved for Animation/Spine adapters.
        return -1;
    }
}
