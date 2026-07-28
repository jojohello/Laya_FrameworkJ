import { SceneLayerType } from "../scene/SceneLayerType";
import { BaseSceneObj } from "./BaseSceneObj";
import { HealthBarView, HealthBarViewOptions } from "./HealthBarView";
import { ISceneObjModule } from "./ISceneObjModule";

export interface HudHealthBarOptions extends HealthBarViewOptions {
    offsetY?: number;
}

/**
 * HUD health bar module. The owner is supplied per call and is never cached.
 */
export class HudHealthBarModule implements ISceneObjModule {
    private _view: HealthBarView | null = null;
    private _visible = false;
    private _offsetY = -70;
    private _options: HudHealthBarOptions = {};

    reset(_owner: BaseSceneObj, _curTime: number): void {
        this.hide();
        this._offsetY = -70;
        this._options = {};
    }

    show(owner: BaseSceneObj, options: HudHealthBarOptions = {}): void {
        this._visible = true;
        this._options = { ...this._options, ...options };
        this._offsetY = options.offsetY ?? this._offsetY;
        this.ensureView();
        this.attachToHudLayer(owner);
        this.applyStyle();
        this.refresh(owner);
        this.updatePosition(owner);
    }

    hide(): void {
        this._visible = false;
        if (!this._view) return;
        this._view.visible = false;
        this._view.removeSelf();
    }

    refresh(owner: BaseSceneObj): void {
        if (!this._visible || !this._view) return;
        const creature = owner as any;
        const hp = Number(creature.hp);
        const maxHp = Number(creature.maxHp);
        const progress = maxHp > 0 ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
        this._view.setProgress(progress);
        this._view.visible = hp > 0 && progress < 1;
    }

    onOwnerInit(owner: BaseSceneObj): void {
        if (this._visible) {
            this.show(owner, this._options);
        }
    }

    onOwnerConfirmPos(owner: BaseSceneObj): void {
        this.updatePosition(owner);
    }

    onRecycle(_owner: BaseSceneObj, _curTime: number): void {
        this.hide();
    }

    onDispose(_owner: BaseSceneObj, _curTime: number): void {
        if (this._view) {
            this._view.removeSelf();
            this._view.destroy();
            this._view = null;
        }
        this._visible = false;
    }

    private ensureView(): void {
        if (!this._view) {
            this._view = new HealthBarView();
        }
        this._view.visible = true;
    }

    private attachToHudLayer(owner: BaseSceneObj): void {
        if (!this._view || !owner.scene) return;
        const layer = owner.scene.getSafeLayer(SceneLayerType.Hud);
        if (layer && this._view.parent !== layer) {
            layer.addChild(this._view);
        }
    }

    private applyStyle(): void {
        if (!this._view) return;

        this._view.setStyle({
            bgUrl: "ui/common/imgs/blood-bg.png",
            barUrl: "ui/common/imgs/blood-red.png",
            ...this._options,
        });
    }

    private updatePosition(owner: BaseSceneObj): void {
        if (!this._visible || !this._view) return;
        this.attachToHudLayer(owner);
        this._view.pos(owner.x, owner.y + owner.zOffset + this._offsetY);
    }
}
