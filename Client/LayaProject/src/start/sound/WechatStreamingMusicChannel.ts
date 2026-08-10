interface WechatAudioError {
    errCode?: number;
    errMsg?: string;
}

interface WechatInnerAudioContextLike {
    src: string;
    loop: boolean;
    volume: number;
    playbackRate: number;
    obeyMuteSwitch?: boolean;
    readonly currentTime: number;
    readonly duration: number;
    play(): void;
    pause(): void;
    seek(position: number): void;
    destroy(): void;
    onCanplay(callback: () => void): void;
    offCanplay(callback: () => void): void;
    onPlay(callback: () => void): void;
    onEnded(callback: () => void): void;
    onError(callback: (error: WechatAudioError) => void): void;
}

interface WechatAudioApi {
    createInnerAudioContext(): WechatInnerAudioContextLike;
}

/**
 * 微信小游戏背景音乐通道。
 *
 * LayaAir 3.3 的 MgInnerAudioChannel 会先 fetch(url, "filePath")，即通过
 * wx.downloadFile 下载完整文件后再播放。本通道只对 BGM 使用，把经过 Laya
 * 版本映射的远程 URL 直接交给 InnerAudioContext，使长音乐由平台按需缓冲。
 */
export class WechatStreamingMusicChannel extends Laya.SoundChannel {
    private _context: WechatInnerAudioContextLike | null = null;
    private _resolvedUrl = "";
    private _hasLoggedStart = false;

    constructor(url: string) {
        super(url);
        // SoundChannel.play() 会把通道注册回 SoundManager；必须标记为音乐，才能
        // 继续继承其唯一 BGM、musicVolume 与 musicMuted 语义。
        (this as any)._isMusic = true;
    }

    get position(): number {
        const position = this._context?.currentTime ?? 0;
        return Number.isFinite(position) && position >= 0 ? position : 0;
    }

    get duration(): number {
        const duration = this._context?.duration ?? 0;
        return Number.isFinite(duration) && duration > 0 ? duration : 0;
    }

    protected onPlay(url: string): void {
        const wx = this.getWechatApi();
        if (!wx) {
            console.error("[MusicMgr] 微信流式音乐初始化失败：createInnerAudioContext 不可用");
            this.stop();
            return;
        }

        // 必须复用 Laya Loader 的格式化顺序。loadPackage 已把 fileconfig 的 hash
        // 写入 URL.version，并把包目录写入 URL.basePaths；这里不能自行拼接版本名。
        const resolvedUrl = Laya.URL.postFormatURL(Laya.URL.formatURL(url));
        this._resolvedUrl = resolvedUrl;

        const context = wx.createInnerAudioContext();
        this._context = context;
        this._loaded = true;

        const playWhenReady = () => {
            context.offCanplay(playWhenReady);
            if (this._context !== context || !this._started || this._paused || this._muted) return;
            if (this.startTime > 0) context.seek(this.startTime);
            // 个别小游戏实现会在 src 生效时重置播放属性，播放前再次提交实际音量。
            context.volume = this._volume;
            context.play();
        };

        context.onCanplay(playWhenReady);
        context.onPlay(() => {
            if (this._context !== context || this._hasLoggedStart) return;
            this._hasLoggedStart = true;
            console.info("[MusicMgr] 微信流式音乐已开始播放", {
                url: this._resolvedUrl,
                volume: context.volume,
            });
        });
        context.onEnded(() => {
            if (this._context === context) this.onPlayEnd();
        });
        context.onError((error) => {
            if (this._context !== context) return;
            console.error(
                `[MusicMgr] 微信流式音乐播放失败: ${this._resolvedUrl}`,
                error?.errCode ?? "",
                error?.errMsg ?? "",
            );
            this.stop();
        });

        // iOS 默认尊重设备静音键；项目内音乐开关仍由 SoundManager.musicMuted 控制。
        context.obeyMuteSwitch = true;
        context.playbackRate = this.playbackRate;
        context.loop = this.loops === 0;
        context.volume = this._muted ? 0 : this._volume;
        context.src = resolvedUrl;
    }

    protected onPlayAgain(): void {
        if (!this._context) return;
        if (this.startTime > 0) this._context.seek(this.startTime);
        this._context.play();
    }

    protected onStop(): void {
        this._context?.destroy();
        this._context = null;
        this._resolvedUrl = "";
        this._hasLoggedStart = false;
    }

    protected onPause(): void {
        this._context?.pause();
    }

    protected onResume(): void {
        if (!this._muted) this._context?.play();
    }

    protected onVolumeChanged(): void {
        if (this._context) this._context.volume = this._muted ? 0 : this._volume;
    }

    protected onMuted(): void {
        if (!this._context) return;
        if (this._muted) this._context.pause();
        else if (!this._paused && Laya.stage.isVisibility) this._context.play();
    }

    private getWechatApi(): WechatAudioApi | null {
        const runtime = Laya.Browser.window as any;
        const wx = runtime?.wx;
        return wx && typeof wx.createInnerAudioContext === "function" ? wx as WechatAudioApi : null;
    }

}
