import { BaseScene } from "../scene/BaseScene";
import { SceneLayerType } from "../scene/SceneLayerType";
import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import { UITextStyle } from "../ui/UITextStyle";

export type CombatFeedbackKind = "damage" | "heal" | "status" | "immune";

interface CombatFeedbackRequest {
    kind: CombatFeedbackKind;
    targetId: number;
    x: number;
    y: number;
    text: string;
    scheduledTime: number;
    order: number;
}

class CombatFeedbackView {
    private readonly _text: Laya.Text = new Laya.Text();
    private _baseX = 0;
    private _baseY = 0;
    private _startTime = 0;
    private _driftX = 0;
    private _driftY = 0;

    constructor() {
        this._text.mouseEnabled = false;
        this._text.mouseThrough = true;
    }

    show(request: CombatFeedbackRequest, startTime: number): void {
        this._baseX = request.x;
        this._baseY = request.y - 58;
        this._startTime = startTime;
        // 90° is straight up; choose one of 17 fixed angles: 10°, 20°, ... 170°.
        const driftAngleDeg = 10 + Math.floor(Math.random() * 17) * 10;
        const driftAngleRad = driftAngleDeg * Math.PI / 180;
        this._driftX = Math.cos(driftAngleRad) * CombatFeedbackMgr.RISE_DISTANCE;
        this._driftY = -Math.sin(driftAngleRad) * CombatFeedbackMgr.RISE_DISTANCE;
        this._text.text = request.text;
        UITextStyle.apply(this._text, CombatFeedbackMgr.getStyleKey(request.kind));
        this._text.zOrder = CombatFeedbackMgr.FLOATING_TEXT_Z_ORDER + request.order;
        this._text.alpha = 1;
        this._text.scale(0.7, 0.7);
        this._text.pos(this._baseX, this._baseY);
        this._text.pivot(this._text.width * 0.5, this._text.height * 0.5);
        this._text.visible = true;
    }

    update(curTime: number): boolean {
        const elapsed = Math.max(0, curTime - this._startTime);
        if (elapsed >= CombatFeedbackMgr.ANIMATION_DURATION) {
            return false;
        }

        const popProgress = Math.min(1, elapsed / CombatFeedbackMgr.POP_DURATION);
        const scale = popProgress < 1
            ? 0.7 + 0.5 * popProgress
            : 1.2 - 0.2 * Math.min(1, (elapsed - CombatFeedbackMgr.POP_DURATION) /
                CombatFeedbackMgr.SETTLE_DURATION);
        const fadeProgress = Math.max(0, (elapsed - CombatFeedbackMgr.FADE_START) /
            (CombatFeedbackMgr.ANIMATION_DURATION - CombatFeedbackMgr.FADE_START));
        this._text.scale(scale, scale);
        const riseProgress = elapsed / CombatFeedbackMgr.ANIMATION_DURATION;
        this._text.x = this._baseX + this._driftX * riseProgress;
        this._text.y = this._baseY + this._driftY * riseProgress;
        this._text.alpha = 1 - fadeProgress;
        return true;
    }

    recycle(): void {
        this._text.visible = false;
        this._text.removeSelf();
    }

    attach(layer: Laya.Sprite): void {
        layer.addChild(this._text);
    }
}

/**
 * Unified world-space combat feedback. Requests only retain value snapshots;
 * they never keep a scene object alive after its hit frame.
 */
export class CombatFeedbackMgr {
    static readonly MIN_TARGET_INTERVAL = 0.1;
    // 0.65 / 1.4: keep the original rhythm while making feedback about 40% faster.
    static readonly ANIMATION_DURATION = 0.46;
    static readonly POP_DURATION = 0.086;
    static readonly SETTLE_DURATION = 0.086;
    static readonly FADE_START = 0.27;
    static readonly RISE_DISTANCE = 42;
    static readonly FLOATING_TEXT_Z_ORDER = 1000;

    private static _instance: CombatFeedbackMgr | null = null;
    static get instance(): CombatFeedbackMgr {
        if (!this._instance) this._instance = new CombatFeedbackMgr();
        return this._instance;
    }

    private _enabled = true;
    private _maxVisible = 24;
    private _maxQueued = 32;
    private _scene: BaseScene | null = null;
    private _queue: CombatFeedbackRequest[] = [];
    private _active: CombatFeedbackView[] = [];
    private _pool: CombatFeedbackView[] = [];
    private _nextTimeByTarget = new Map<number, number>();
    private _order = 0;

    get enabled(): boolean {
        return this._enabled;
    }

    setEnabled(enabled: boolean): void {
        this._enabled = enabled;
        if (!enabled) this.clear();
    }

    setMaxVisible(value: number): void {
        this._maxVisible = Math.max(1, Math.floor(value) || 1);
    }

    setMaxQueued(value: number): void {
        this._maxQueued = Math.max(1, Math.floor(value) || 1);
        if (this._queue.length > this._maxQueued) {
            this._queue.length = this._maxQueued;
        }
    }

    showDamage(target: BaseSceneObj, value: number, curTime: number): void {
        this.showTargetValue("damage", target, value, curTime);
    }

    showHeal(target: BaseSceneObj, value: number, curTime: number): void {
        this.showTargetValue("heal", target, value, curTime);
    }

    showStatus(target: BaseSceneObj, text: string, curTime: number, immune: boolean = false): void {
        this.enqueue(immune ? "immune" : "status", target, text, curTime);
    }

    /** Called by BattleScene using scene time, so pause and speed apply consistently. */
    update(scene: BaseScene, curTime: number): void {
        if (this._scene !== scene) {
            this.clear();
            this._scene = scene;
        }
        if (!this._enabled) return;

        for (let i = this._active.length - 1; i >= 0; i--) {
            const view = this._active[i];
            if (view.update(curTime)) continue;
            view.recycle();
            this._active.splice(i, 1);
            this._pool.push(view);
        }

        // Health bars live in Hud; keep feedback in the same layer with a
        // higher child zOrder so text renders in front of bars.
        const layer = scene.getSafeLayer(SceneLayerType.Hud)
            || scene.getSafeLayer(SceneLayerType.Effect);
        if (!layer) return;
        while (this._active.length < this._maxVisible && this._queue.length > 0) {
            const request = this._queue[0];
            if (request.scheduledTime > curTime) break;
            this._queue.shift();
            const view = this._pool.pop() || new CombatFeedbackView();
            view.show(request, curTime);
            view.attach(layer);
            this._active.push(view);
        }
    }

    clear(scene?: BaseScene): void {
        if (scene && this._scene && this._scene !== scene) return;
        for (const view of this._active) {
            view.recycle();
            this._pool.push(view);
        }
        this._active.length = 0;
        this._queue.length = 0;
        this._nextTimeByTarget.clear();
        this._order = 0;
        if (!scene || this._scene === scene) this._scene = null;
    }

    static getStyleKey(kind: CombatFeedbackKind): string {
        switch (kind) {
            case "heal": return "battle.heal";
            case "immune": return "battle.immune";
            case "status": return "battle.status";
            default: return "battle.damage.normal";
        }
    }

    private showTargetValue(kind: "damage" | "heal", target: BaseSceneObj, value: number, curTime: number): void {
        const amount = Math.max(0, Math.round(Number(value) || 0));
        if (amount <= 0) return;
        this.enqueue(kind, target, `${kind === "damage" ? "-" : "+"}${amount}`, curTime);
    }

    private enqueue(kind: CombatFeedbackKind, target: BaseSceneObj, text: string, curTime: number): void {
        if (!this._enabled) {
            return;
        }
        if (!target) {
            return;
        }
        if (!target.scene) {
            return;
        }
        if (this._scene && this._scene !== target.scene) {
            return;
        }
        if (!text) {
            return;
        }
        this._scene = target.scene;
        if (this._queue.length >= this._maxQueued) {
            return;
        }

        const scheduledTime = Math.max(curTime, this._nextTimeByTarget.get(target.uid) || curTime);
        this._nextTimeByTarget.set(target.uid, scheduledTime + CombatFeedbackMgr.MIN_TARGET_INTERVAL);
        const request: CombatFeedbackRequest = {
            kind,
            targetId: target.uid,
            x: target.x,
            y: target.y,
            text,
            scheduledTime,
            order: ++this._order,
        };
        this._queue.push(request);
    }
}
