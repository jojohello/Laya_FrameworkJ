import { BaseSceneObj } from "../sceneObj/BaseSceneObj";

export interface SceneCameraBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface SceneCameraTargetResolver {
    getLiveObject(uid: number): BaseSceneObj | null;
}

/**
 * Small wrapper around Laya.Camera2D.
 *
 * The root fallback keeps camera movement usable in projects where Camera2D needs
 * additional Area2D setup. The public API stays stable when that setup is enabled.
 */
export class SceneCamera2D {
    readonly camera2D: Laya.Camera2D;

    private _root: Laya.Sprite;
    private _followTargetId: number = 0;
    private _followOffsetX: number = 0;
    private _followOffsetY: number = 0;
    private _x: number = 0;
    private _y: number = 0;
    private _bounds: SceneCameraBounds | null = null;
    private _rootFallbackEnabled: boolean = true;
    private _dragEnabled: boolean = false;
    private _dragStartStageX: number = 0;
    private _dragStartStageY: number = 0;
    private _dragStartCameraX: number = 0;
    private _dragStartCameraY: number = 0;
    private _allowHorizontalDrag: boolean = true;
    private _allowVerticalDrag: boolean = false;

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
        this.camera2D.visible = active;
        if (active) {
            if (this._dragEnabled) {
                Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
                Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
                Laya.stage.off(Laya.Event.MOUSE_OUT, this, this.onDragEnd);
                Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
                Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onDragEnd);
                Laya.stage.on(Laya.Event.MOUSE_OUT, this, this.onDragEnd);
            }
        } else {
            Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
            Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
            Laya.stage.off(Laya.Event.MOUSE_OUT, this, this.onDragEnd);
            Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
        }
    }

    setBounds(left: number, right: number, top: number, bottom: number): void {
        this._bounds = { left, right, top, bottom };
        this.camera2D.limit_Left = left;
        this.camera2D.limit_Right = right;
        this.camera2D.limit_Top = top;
        this.camera2D.limit_Bottom = bottom;
        this.moveTo(this._x, this._y);
    }

    clearBounds(): void {
        this._bounds = null;
    }

    enableDrag(horizontal: boolean = true, vertical: boolean = false): void {
        this._allowHorizontalDrag = horizontal;
        this._allowVerticalDrag = vertical;
        this.camera2D.dragHorizontalEnable = horizontal;
        this.camera2D.dragVerticalEnable = vertical;

        if (this._dragEnabled) return;
        this._dragEnabled = true;
        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
        Laya.stage.on(Laya.Event.MOUSE_UP, this, this.onDragEnd);
        Laya.stage.on(Laya.Event.MOUSE_OUT, this, this.onDragEnd);
    }

    disableDrag(): void {
        this._dragEnabled = false;
        Laya.stage.off(Laya.Event.MOUSE_DOWN, this, this.onDragStart);
        Laya.stage.off(Laya.Event.MOUSE_UP, this, this.onDragEnd);
        Laya.stage.off(Laya.Event.MOUSE_OUT, this, this.onDragEnd);
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    }

    follow(targetId: number, offsetX: number = 0, offsetY: number = 0): void {
        this._followTargetId = targetId;
        this._followOffsetX = offsetX;
        this._followOffsetY = offsetY;
    }

    clearFollow(): void {
        this._followTargetId = 0;
    }

    moveTo(x: number, y: number): void {
        this._x = x;
        this._y = y;
        this.clampPos();
        this.applyCameraPos();
    }

    moveBy(dx: number, dy: number): void {
        this.moveTo(this._x + dx, this._y + dy);
    }

    update(resolver: SceneCameraTargetResolver): void {
        if (this._followTargetId <= 0) return;
        const target = resolver.getLiveObject(this._followTargetId);
        if (!target) {
            this.clearFollow();
            return;
        }
        this.moveTo(target.x + this._followOffsetX, target.y + this._followOffsetY);
    }

    release(): void {
        this.disableDrag();
        this._followTargetId = 0;
        this.camera2D.removeSelf();
        this.camera2D.destroy();
        this._root.pos(0, 0);
    }

    get x(): number { return this._x; }
    get y(): number { return this._y; }

    private onDragStart(): void {
        this._dragStartStageX = Laya.stage.mouseX;
        this._dragStartStageY = Laya.stage.mouseY;
        this._dragStartCameraX = this._x;
        this._dragStartCameraY = this._y;
        Laya.stage.on(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    }

    private onDragMove(): void {
        const dx = this._allowHorizontalDrag ? this._dragStartStageX - Laya.stage.mouseX : 0;
        const dy = this._allowVerticalDrag ? this._dragStartStageY - Laya.stage.mouseY : 0;
        this.moveTo(this._dragStartCameraX + dx, this._dragStartCameraY + dy);
    }

    private onDragEnd(): void {
        Laya.stage.off(Laya.Event.MOUSE_MOVE, this, this.onDragMove);
    }

    private clampPos(): void {
        if (!this._bounds) return;
        if (this._x < this._bounds.left) this._x = this._bounds.left;
        if (this._x > this._bounds.right) this._x = this._bounds.right;
        if (this._y < this._bounds.top) this._y = this._bounds.top;
        if (this._y > this._bounds.bottom) this._y = this._bounds.bottom;
    }

    private applyCameraPos(): void {
        this.camera2D.pos(this._x, this._y);
        if (this._rootFallbackEnabled) {
            this._root.pos(-this._x, -this._y);
        }
    }
}
