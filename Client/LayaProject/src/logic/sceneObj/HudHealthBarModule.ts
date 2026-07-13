import { SceneLayerType } from "../scene/SceneLayerType";
import { BaseSceneObj } from "./BaseSceneObj";
import { HealthBarView, HealthBarViewOptions } from "./HealthBarView";
import { ISceneObjModule } from "./ISceneObjModule";

export interface HudHealthBarOptions extends HealthBarViewOptions {
    offsetY?: number;
}

const TEAM_BAR_URLS: Record<number, string> = {
    1: "ui/common/imgs/blood-blue.png",
    2: "ui/common/imgs/blood-red.png",
};

/**
 * HUD health bar module bound to a SceneObj owner.
 */
export class HudHealthBarModule implements ISceneObjModule {
    private _owner: BaseSceneObj | null = null;
    private _view: HealthBarView | null = null;
    private _visible: boolean = false;
    private _offsetY: number = -70;
    private _options: HudHealthBarOptions = {};

    onAttach(owner: BaseSceneObj): void {
        this._owner = owner;
    }

    onDetach(owner: BaseSceneObj): void {
        if (this._owner === owner) {
            this._owner = null;
        }
    }

    reset(): void {
        this.hide();
        this._offsetY = -70;
        this._options = {};
    }

    show(options: HudHealthBarOptions = {}): void {
        this._visible = true;
        this._options = { ...this._options, ...options };
        this._offsetY = options.offsetY ?? this._offsetY;
        this.ensureView();
        this.attachToHudLayer();
        this.applyStyle();
        this.refresh();
        this.updatePosition();
    }

    hide(): void {
        this._visible = false;
        if (!this._view) return;
        this._view.visible = false;
        this._view.removeSelf();
    }

    refresh(): void {
        if (!this._visible || !this._view || !this._owner) return;
        const owner = this._owner as any;
        const hp = Number(owner.hp);
        const maxHp = Number(owner.maxHp);
        this._view.setProgress(maxHp > 0 ? hp / maxHp : 0);
    }

    onOwnerInit(owner: BaseSceneObj): void {
        this._owner = owner;
        if (this._visible) {
            this.show(this._options);
        }
    }

    onOwnerConfirmPos(owner: BaseSceneObj): void {
        this._owner = owner;
        this.updatePosition();
    }

    onRecycle(): void {
        this.hide();
    }

    onDispose(): void {
        if (this._view) {
            this._view.removeSelf();
            this._view.destroy();
            this._view = null;
        }
        this._owner = null;
        this._visible = false;
    }

    private ensureView(): void {
        if (!this._view) {
            this._view = new HealthBarView();
        }
        this._view.visible = true;
    }

    private attachToHudLayer(): void {
        if (!this._view || !this._owner?.scene) return;
        const layer = this._owner.scene.getSafeLayer(SceneLayerType.Hud);
        if (layer && this._view.parent !== layer) {
            layer.addChild(this._view);
        }
    }

    private applyStyle(): void {
        if (!this._view || !this._owner) return;

        const teamBarUrl = TEAM_BAR_URLS[this._owner.team] || "ui/common/imgs/blood-red.png";
        this._view.setStyle({
            bgUrl: "ui/common/imgs/blood-bg.png",
            barUrl: teamBarUrl,
            ...this._options,
        });
    }

    private updatePosition(): void {
        if (!this._visible || !this._view || !this._owner) return;
        this.attachToHudLayer();
        this._view.pos(this._owner.x, this._owner.y + this._owner.zOffset + this._offsetY);
    }
}
