/**
 * Scene logic-time scheduling mode.
 *
 * The mode is consumed only by BaseScene/SceneTime. Gameplay modules receive
 * the resulting logicDt, curTime and tick and must not branch on this value.
 */
export enum SceneTimeMode {
    Realtime = "Realtime",
    FixedTick = "FixedTick",
}

/**
 * Scene-local logic clock and frame scheduler.
 *
 * Runtime values use seconds. The outer driver supplies unscaled foreground
 * delta once per Laya frame and, when relevant, measured background elapsed
 * time. This class turns them into authoritative logic steps.
 */
export class SceneTime {
    static readonly DEFAULT_FIXED_TICK_RATE = 30;
    static readonly MAX_FIXED_UPDATES_PER_FRAME = 5;
    static readonly SKIP_RENDER_UPDATE_THRESHOLD = 3;

    private _mode: SceneTimeMode = SceneTimeMode.Realtime;
    private _isRunning = false;
    private _isPaused = false;
    private _timeScale = 1;
    private _curTime = 0;
    private _tick = 0;
    private _deltaTime = 0;
    private _fixedTickRate = SceneTime.DEFAULT_FIXED_TICK_RATE;
    private _fixedStep = 1 / SceneTime.DEFAULT_FIXED_TICK_RATE;
    private _fixedAccumulator = 0;
    private _realtimeStep = 0;
    private _frameLogicUpdateCount = 0;
    private _pendingRenderDelta = 0;

    start(): void {
        this._isRunning = true;
        this._isPaused = false;
        this._timeScale = 1;
        this._curTime = 0;
        this._tick = 0;
        this._deltaTime = 0;
        this._fixedAccumulator = 0;
        this._realtimeStep = 0;
        this._frameLogicUpdateCount = 0;
        this._pendingRenderDelta = 0;
    }

    stop(): void {
        this._isRunning = false;
        this._isPaused = false;
        this._deltaTime = 0;
        this._fixedAccumulator = 0;
        this._realtimeStep = 0;
        this._frameLogicUpdateCount = 0;
        this._pendingRenderDelta = 0;
    }

    /**
     * Starts scheduling one Laya frame.
     *
     * Background elapsed time advances Realtime scenes to the latest state.
     * FixedTick scenes intentionally ignore it and resume from their old tick.
     */
    beginFrame(unscaledDelta: number, backgroundElapsed: number = 0): void {
        this._deltaTime = 0;
        this._realtimeStep = 0;
        this._frameLogicUpdateCount = 0;
        if (!this._isRunning || this._isPaused) return;

        const foregroundDelta = this.sanitizeDelta(unscaledDelta);
        const hiddenDelta = this.sanitizeDelta(backgroundElapsed);
        if (this._mode === SceneTimeMode.Realtime) {
            this._realtimeStep = (foregroundDelta + hiddenDelta) * this._timeScale;
            return;
        }

        // Background time is a pause for deterministic fixed-tick scenes.
        this._fixedAccumulator += foregroundDelta * this._timeScale;
    }

    hasLogicUpdate(): boolean {
        if (!this._isRunning || this._isPaused) return false;
        if (this._mode === SceneTimeMode.Realtime) {
            return this._frameLogicUpdateCount === 0 && this._realtimeStep > 0;
        }

        return this._frameLogicUpdateCount < SceneTime.MAX_FIXED_UPDATES_PER_FRAME
            && this._fixedAccumulator + Number.EPSILON >= this._fixedStep;
    }

    /**
     * Consumes and commits the next authoritative logic step.
     * Call only while hasLogicUpdate() is true.
     */
    consumeLogicUpdate(): number {
        let logicDelta = 0;
        if (this._mode === SceneTimeMode.Realtime) {
            logicDelta = this._realtimeStep;
            this._realtimeStep = 0;
        } else {
            logicDelta = this._fixedStep;
            this._fixedAccumulator = Math.max(0, this._fixedAccumulator - this._fixedStep);
        }

        this._frameLogicUpdateCount++;
        this._deltaTime = logicDelta;
        this._curTime += logicDelta;
        this._tick++;
        this._pendingRenderDelta += logicDelta;
        return logicDelta;
    }

    shouldRenderUpdate(): boolean {
        return this._frameLogicUpdateCount <= SceneTime.SKIP_RENDER_UPDATE_THRESHOLD;
    }

    /**
     * Returns all logical time not yet presented by project-level rendering.
     */
    consumeRenderDelta(): number {
        const renderDelta = this._pendingRenderDelta;
        this._pendingRenderDelta = 0;
        return renderDelta;
    }

    get interpolationAlpha(): number {
        if (this._mode !== SceneTimeMode.FixedTick || this._fixedStep <= 0) return 1;
        return Math.max(0, Math.min(1, this._fixedAccumulator / this._fixedStep));
    }

    pause(): void {
        if (!this._isRunning || this._isPaused) return;
        this._isPaused = true;
        this._deltaTime = 0;
        this._realtimeStep = 0;
    }

    resume(): void {
        if (!this._isPaused) return;
        this._isPaused = false;
    }

    setMode(value: SceneTimeMode): void {
        if (this._mode === value) return;
        this._mode = value;
        this._deltaTime = 0;
        this._fixedAccumulator = 0;
        this._realtimeStep = 0;
        this._frameLogicUpdateCount = 0;
        this._pendingRenderDelta = 0;
    }

    setFixedTickRate(value: number): void {
        if (!Number.isFinite(value) || value <= 0) {
            throw new Error(`[SceneTime] Invalid fixed tick rate: ${value}`);
        }
        this._fixedTickRate = value;
        this._fixedStep = 1 / value;
        this._fixedAccumulator = 0;
    }

    setTimeScale(value: number): void {
        if (!Number.isFinite(value) || value < 0) {
            throw new Error(`[SceneTime] Invalid time scale: ${value}`);
        }
        this._timeScale = value;
    }

    get mode(): SceneTimeMode {
        return this._mode;
    }

    get isRunning(): boolean {
        return this._isRunning;
    }

    get isPaused(): boolean {
        return this._isPaused;
    }

    get timeScale(): number {
        return this._timeScale;
    }

    get curTime(): number {
        return this._curTime;
    }

    get tick(): number {
        return this._tick;
    }

    get deltaTime(): number {
        return this._deltaTime;
    }

    get fixedTickRate(): number {
        return this._fixedTickRate;
    }

    get frameLogicUpdateCount(): number {
        return this._frameLogicUpdateCount;
    }

    reset(): void {
        this._curTime = 0;
        this._tick = 0;
        this._deltaTime = 0;
        this._timeScale = 1;
        this._isPaused = false;
        this._fixedAccumulator = 0;
        this._realtimeStep = 0;
        this._frameLogicUpdateCount = 0;
        this._pendingRenderDelta = 0;
    }

    private sanitizeDelta(value: number): number {
        return Number.isFinite(value) ? Math.max(0, value) : 0;
    }
}
