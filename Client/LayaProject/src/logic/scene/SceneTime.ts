/**
 * 场景时间管理
 * 提供游戏场景的时间追踪功能
 */
export class SceneTime {
    /** 是否正在运行 */
    private _isRunning: boolean = false;
    private _isPaused: boolean = false;
    private _timeScale: number = 1;
    private _curTime: number = 0;
    private _deltaTime: number = 0;

    /** 防止切后台或卡顿恢复后一次推进过长的游戏时间。 */
    private static readonly MAX_DELTA_TIME = 0.1;

    /**
     * 启动时间追踪
     */
    start(): void {
        this._isRunning = true;
        this._isPaused = false;
        this._timeScale = 1;
        this._curTime = 0;
        this._deltaTime = 0;
    }

    /**
     * 停止时间追踪
     */
    stop(): void {
        this._isRunning = false;
        this._isPaused = false;
        this._deltaTime = 0;
    }

    /**
     * 用真实帧间隔推进场景游戏时间。
     * @param unscaledDelta 不含场景暂停和倍速的时间间隔，单位秒
     */
    update(unscaledDelta: number): void {
        if (!this._isRunning || this._isPaused) {
            this._deltaTime = 0;
            return;
        }

        const safeDelta = Number.isFinite(unscaledDelta)
            ? Math.max(0, Math.min(unscaledDelta, SceneTime.MAX_DELTA_TIME))
            : 0;
        this._deltaTime = safeDelta * this._timeScale;
        this._curTime += this._deltaTime;
    }

    /** 获取当前场景游戏时间，单位秒。 */
    curTime(): number {
        return this._curTime;
    }

    pause(): void {
        if (!this._isRunning || this._isPaused) return;
        this._isPaused = true;
        this._deltaTime = 0;
    }

    resume(): void {
        if (!this._isPaused) return;
        this._isPaused = false;
    }

    /** 设置场景游戏速度。0 表示时间不推进，但不替代暂停语义。 */
    setTimeScale(value: number): void {
        if (!Number.isFinite(value) || value < 0) {
            throw new Error(`[SceneTime] Invalid time scale: ${value}`);
        }
        this._timeScale = value;
    }

    /**
     * 获取是否正在运行
     */
    get isRunning(): boolean {
        return this._isRunning;
    }

    get isPaused(): boolean {
        return this._isPaused;
    }

    get timeScale(): number {
        return this._timeScale;
    }

    get deltaTime(): number {
        return this._deltaTime;
    }

    /**
     * 重置时间
     */
    reset(): void {
        this._curTime = 0;
        this._deltaTime = 0;
        this._timeScale = 1;
        this._isPaused = false;
    }
}
