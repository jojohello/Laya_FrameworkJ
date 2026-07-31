export enum SceneCameraMode {
    Fixed = "fixed",
    Drag = "drag",
    Follow = "follow",
}

export interface SceneCameraBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface SceneCameraDragUpdate {
    x: number;
    y: number;
}

export interface SceneCameraBackendPositions {
    cameraX: number;
    cameraY: number;
    rootX: number;
    rootY: number;
}

/**
 * Selects exactly one viewport displacement backend. Applying both native
 * Camera2D movement and root translation would double the visible offset once
 * the scene is connected to a native Camera2D area.
 */
export function resolveSceneCameraBackendPositions(
    viewportX: number,
    viewportY: number,
    useRootFallback: boolean
): SceneCameraBackendPositions {
    return useRootFallback
        ? {
            cameraX: 0,
            cameraY: 0,
            rootX: -viewportX,
            rootY: -viewportY,
        }
        : {
            cameraX: viewportX,
            cameraY: viewportY,
            rootX: 0,
            rootY: 0,
        };
}

/**
 * Separates a click from a drag without depending on Laya pointer objects.
 * Once the threshold is crossed, movement uses the full delta from pointer-down
 * so the viewport does not accumulate discontinuities across the ownership switch.
 */
export class SceneCameraDragTracker {
    private _startStageX = 0;
    private _startStageY = 0;
    private _startCameraX = 0;
    private _startCameraY = 0;
    private _pointerDown = false;
    private _dragging = false;

    constructor(private readonly _threshold: number) {}

    begin(stageX: number, stageY: number, cameraX: number, cameraY: number): void {
        this._startStageX = stageX;
        this._startStageY = stageY;
        this._startCameraX = cameraX;
        this._startCameraY = cameraY;
        this._pointerDown = true;
        this._dragging = false;
    }

    update(
        stageX: number,
        stageY: number,
        allowHorizontal: boolean,
        allowVertical: boolean
    ): SceneCameraDragUpdate | null {
        if (!this._pointerDown) return null;

        const rawDx = this._startStageX - stageX;
        const rawDy = this._startStageY - stageY;
        if (!this._dragging &&
            rawDx * rawDx + rawDy * rawDy < this._threshold * this._threshold) {
            return null;
        }
        this._dragging = true;
        return {
            x: this._startCameraX + (allowHorizontal ? rawDx : 0),
            y: this._startCameraY + (allowVertical ? rawDy : 0),
        };
    }

    end(): boolean {
        const didDrag = this._dragging;
        this.reset();
        return didDrag;
    }

    reset(): void {
        this._pointerDown = false;
        this._dragging = false;
    }
}

/**
 * Laya-independent camera state.
 *
 * Camera x/y is always the viewport's world-space top-left. World targets must
 * be converted through lookAt/updateTarget; using a target position directly
 * as x/y would incorrectly place that target at the screen corner.
 */
export class SceneCameraState {
    private _mode: SceneCameraMode = SceneCameraMode.Fixed;
    private _targetUid = 0;
    private _targetOffsetX = 0;
    private _targetOffsetY = 0;
    private _x = 0;
    private _y = 0;
    private _bounds: SceneCameraBounds | null = null;

    setBounds(left: number, right: number, top: number, bottom: number): void {
        this._bounds = {
            left: Math.min(left, right),
            right: Math.max(left, right),
            top: Math.min(top, bottom),
            bottom: Math.max(top, bottom),
        };
        this.clampPosition();
    }

    clearBounds(): void {
        this._bounds = null;
    }

    setFixed(): void {
        this._mode = SceneCameraMode.Fixed;
        this.clearTargetData();
    }

    enableDrag(): void {
        this._mode = SceneCameraMode.Drag;
        this.clearTargetData();
    }

    lookAt(worldX: number, worldY: number, viewportWidth: number, viewportHeight: number): void {
        this.setFixed();
        this.moveCentered(worldX, worldY, viewportWidth, viewportHeight);
    }

    setTarget(uid: number, offsetX: number = 0, offsetY: number = 0): void {
        if (!Number.isFinite(uid) || uid <= 0) {
            this.setFixed();
            return;
        }
        this._mode = SceneCameraMode.Follow;
        this._targetUid = uid;
        this._targetOffsetX = offsetX;
        this._targetOffsetY = offsetY;
    }

    clearTarget(): void {
        this.setFixed();
    }

    updateTarget(worldX: number, worldY: number, viewportWidth: number, viewportHeight: number): void {
        if (this._mode !== SceneCameraMode.Follow) return;
        this.moveCentered(
            worldX + this._targetOffsetX,
            worldY + this._targetOffsetY,
            viewportWidth,
            viewportHeight
        );
    }

    moveViewportTo(x: number, y: number): void {
        this._x = Number.isFinite(x) ? x : 0;
        this._y = Number.isFinite(y) ? y : 0;
        this.clampPosition();
    }

    moveBy(dx: number, dy: number): void {
        this.moveViewportTo(this._x + dx, this._y + dy);
    }

    get mode(): SceneCameraMode { return this._mode; }
    get targetUid(): number { return this._targetUid; }
    get x(): number { return this._x; }
    get y(): number { return this._y; }

    private moveCentered(
        worldX: number,
        worldY: number,
        viewportWidth: number,
        viewportHeight: number
    ): void {
        this.moveViewportTo(
            worldX - Math.max(0, viewportWidth) * 0.5,
            worldY - Math.max(0, viewportHeight) * 0.5
        );
    }

    private clearTargetData(): void {
        this._targetUid = 0;
        this._targetOffsetX = 0;
        this._targetOffsetY = 0;
    }

    private clampPosition(): void {
        if (!this._bounds) return;
        this._x = Math.max(this._bounds.left, Math.min(this._bounds.right, this._x));
        this._y = Math.max(this._bounds.top, Math.min(this._bounds.bottom, this._y));
    }
}
