/**
 * 场景时间管理
 * 提供游戏场景的时间追踪功能
 */
export class SceneTime {
    /** 开始时间戳 */
    private _startTime: number = 0;

    /** 是否正在运行 */
    private _isRunning: boolean = false;

    /**
     * 启动时间追踪
     */
    start(): void {
        this._startTime = Date.now();
        this._isRunning = true;
    }

    /**
     * 停止时间追踪
     */
    stop(): void {
        this._isRunning = false;
    }

    /**
     * 获取当前时间（相对于启动时）
     * @returns 秒数
     */
    curTime(): number {
        if (!this._isRunning) return 0;
        return (Date.now() - this._startTime) / 1000;
    }

    /**
     * 获取是否正在运行
     */
    get isRunning(): boolean {
        return this._isRunning;
    }

    /**
     * 重置时间
     */
    reset(): void {
        this._startTime = Date.now();
    }
}
