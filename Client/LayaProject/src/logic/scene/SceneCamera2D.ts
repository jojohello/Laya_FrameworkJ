import { BaseSceneObj } from "../sceneObj/BaseSceneObj";
import {
    SceneCameraBounds,
    SceneCameraDragTracker,
    SceneCameraMode,
    SceneCameraState,
    resolveSceneCameraBackendPositions,
} from "./SceneCameraState";

export { SceneCameraBounds, SceneCameraMode } from "./SceneCameraState";

export interface SceneCameraTargetResolver {
    getLiveObject(uid: number): BaseSceneObj | null;
}

export interface SceneCameraDragOptions {
    horizontal?: boolean;
    vertical?: boolean;
}

export interface SceneCameraTargetOptions {
    offsetX?: number;
    offsetY?: number;
}

/**
 * Small wrapper around Laya.Camera2D.
 *
 * The root fallback keeps camera movement usable in projects where Camera2D needs
 * additional Area2D setup. The public API stays stable when that setup is enabled.
 */
export class SceneCamera2D {
    readonly camera2D: Laya.Camera2D;

    private static readonly DRAG_THRESHOLD = 12;
    private readonly _state = new SceneCameraState();
    private readonly _dragTracker = new SceneCameraDragTracker(SceneCamera2D.DRAG_THRESHOLD);
    private readonly _root: Laya.Sprite;
    private _rootFallbackEnabled = true;
    private _active = false;
    private _allowHorizontalDrag = true;
    private _allowVerticalDrag = false;

    constructor(root: Laya.Sprite) {
        this._root = root;
        this.camera2D = new Laya.Camera2D();
        this.camera2D.name = "SceneCamera2D";
        this.camera2D.isMain = true;
        this.camera2D.ignoreRotation = true;
        this.camera2D.positionSmooth = false;
        this.camera2D.dragHorizontalEnable = true;
        this.camera2D.dragVerticalEnable = false;
        Laya.stage.addChild(this.camera2D);
    }

    setRootFallbackEnabled(enabled: boolean): void {
        this._rootFallbackEnabled = enabled;
        this.applyCameraPos();
    }

    setActive(active: boolean): void {
        this._active = active;
        this.camera2D.visible = active;
        if (active) {
            this.refreshDragListeners();
        } else {
            this.detachDragListeners();
        }
    }

    setBounds(left: number, right: number, top: number, bottom: number): void {
        this._state.setBounds(left, right, top, bottom);
        this.camera2D.limit_Left = left;
        this.camera2D.limit_Right = right;
        this.camera2D.limit_Top = top;
        this.camera2D.limit_Bottom = bottom;
        this.applyCameraPos();
    }

    clearBounds(): void {
        this._state.clearBounds();
    }

    setFixed(): void {
        this._state.setFixed();
        this.detachDragListeners();
    }

    lookAt(worldX: number, worldY: number): void {
        this._state.lookAt(worldX, worldY, Laya.stage.width, Laya.stage.height);
        this.detachDragListeners();
        this.applyCameraPos();
    }

    setTarget(targetUid: number, options: SceneCameraTargetOptions = {}): void {
        this._state.setTarget(targetUid, options.offsetX || 0, options.offsetY || 0);
        this.detachDragListeners();
    }

    clearTarget(): void {
        this._state.clearTarget();
        this.detachDragListeners();
    }

    enableDrag(
        horizontalOrOptions: boolean | SceneCameraDragOptions = true,
        vertical: boolean = false
    ): void {
        const horizontal = typeof horizontalOrOptions === "boolean"
            ? horizontalOrOptions
            : horizontalOrOptions.horizontal !== false;
        const allowVertical = typeof horizontalOrOptions === "boolean"
            ? vertical
            : horizontalOrOptions.vertical === true;
        this._allowHorizontalDrag = horizontal;
        this._allowVerticalDrag = allowVertical;
        this.camera2D.dragHorizontalEnable = horizontal;
        this.camera2D.dragVerticalEnable = allowVertical;
        this._state.enableDrag();
        this.refreshDragListeners();
    }

    disableDrag(): void {
        this.setFixed();
    }

    /** Compatibility alias. Prefer setTarget() for explicit follow-mode ownership. */
    follow(targetId: number, offsetX: number = 0, offsetY: number = 0): void {
        this.setTarget(targetId, { offsetX, offsetY });
    }

    clearFollow(): void {
        this.clearTarget();
    }

    /** Sets the viewport's world-space top-left, not a world point to center. */
    moveViewportTo(x: number, y: number): void {
        this._state.moveViewportTo(x, y);
        this.applyCameraPos();
    }

    /** Compatibility alias. Prefer moveViewportTo() to make coordinate semantics explicit. */
    moveTo(x: number, y: number): void {
        this.moveViewportTo(x, y);
    }

    moveBy(dx: number, dy: number): void {
        this._state.moveBy(dx, dy);
        this.applyCameraPos();
    }

    update(resolver: SceneCameraTargetResolver): void {
        if (this._state.mode !== SceneCameraMode.Follow) return;
        const target = resolver.getLiveObject(this._state.targetUid);
        if (!target || target.isDead) {
            this.clearTarget();
            return;
        }
        this._state.updateTarget(target.x, target.y, Laya.stage.width, Laya.stage.height);
        this.applyCameraPos();
    }

    release(): void {
        this.setActive(false);
        this._state.setFixed();
        this.camera2D.removeSelf();
        this.camera2D.destroy();
        this._root.pos(0, 0);
    }

    get mode(): SceneCameraMode { return this._state.mode; }
    get x(): number { return this._state.x; }
    get y(): number { return this._state.y; }

    private onDragStart(event?: Laya.Event): void {
        if (!this.canStartSceneDrag(event)) return;
        this._dragTracker.begin(
            Laya.stage.mouseX,
            Laya.stage.mouseY,
            this._state.x,
            this._state.y
        );
        Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    }

    private onDragMove(): void {
        const update = this._dragTracker.update(
            Laya.stage.mouseX,
            Laya.stage.mouseY,
            this._allowHorizontalDrag,
            this._allowVerticalDrag
        );
        if (update) this.moveViewportTo(update.x, update.y);
    }

    private onDragEnd(): void {
        this._dragTracker.end();
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    }

    private refreshDragListeners(): void {
        this.detachDragListeners();
        if (!this._active || this._state.mode !== SceneCameraMode.Drag) return;
        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
        Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onDragEnd);
        Laya.stage.on(Laya.Event.MOUSE_OUT, this, this.onDragEnd);
    }

    private detachDragListeners(): void {
        this._dragTracker.reset();
        Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
        Laya.stage.off(Laya.Event.MOUSE_OUT, this, this.onDragEnd);
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    }

    private canStartSceneDrag(event?: Laya.Event): boolean {
        const target = event?.target as Laya.Node | null;
        if (!target || target === Laya.stage) return true;

        // Scene drag owns only the Scene2D subtree. UI and modal nodes live in
        // separate LayerMgr roots and must retain exclusive pointer ownership.
        let current: Laya.Node | null = target;
        while (current) {
            if (current === this._root) return true;
            current = current.parent;
        }
        return false;
    }

    private applyCameraPos(): void {
        const positions = resolveSceneCameraBackendPositions(
            this._state.x,
            this._state.y,
            this._rootFallbackEnabled
        );
        this.camera2D.pos(positions.cameraX, positions.cameraY);
        this._root.pos(positions.rootX, positions.rootY);
    }
}
