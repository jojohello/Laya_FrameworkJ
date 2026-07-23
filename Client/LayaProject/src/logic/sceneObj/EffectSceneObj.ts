import { BaseScene } from "../scene/BaseScene";
import { SceneLayerType } from "../scene/SceneLayerType";
import { DisplaySceneObj } from "./DisplaySceneObj";
import { SceneObjType } from "./SceneObjType";

/**
 * Lightweight effect object. It does not enter collision space by default.
 */
export class EffectSceneObj extends DisplaySceneObj {
    protected _displayLayerType: SceneLayerType = SceneLayerType.Effect;
    protected _startTime: number = 0;
    protected _duration: number = 0;

    getObjType(): number {
        return SceneObjType.Effect;
    }

    protected onInit(uid: number, cfgId: number, scene: BaseScene, team: number, x: number, y: number, angle: number): void {
        this._startTime = 0;
        this._duration = 0;
        this.setCollisionBoxEnabled(false);
    }

    setDuration(durationMs: number): void {
        this._duration = Math.max(0, durationMs) / 1000;
    }

    protected onLogicUpdate(_logicDt: number, curTime: number, _tick: number): void {
        if (this._duration <= 0) return;
        if (this._startTime <= 0) {
            this._startTime = curTime;
            return;
        }
        if (curTime - this._startTime >= this._duration) {
            this.release();
        }
    }
}
