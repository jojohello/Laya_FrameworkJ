import { WechatStreamingMusicChannel } from "./WechatStreamingMusicChannel";

/**
 * MusicMgr - 音频播放统一入口（Start 层）
 *
 * 背景音乐与特效音效使用两套独立接口、独立音量与独立静音。背景音乐在微信
 * 小游戏走原生远程 URL 流式通道，其他平台走 Laya 长音频通道；音效走短促通道。
 * 所有音量/静音状态在本地持久化。
 *
 * 微信小游戏后端每次 SoundManager.playSound 都会新建并最终销毁一个
 * InnerAudioContext，iOS 密集音效会因此卡顿。本封装层通过"全局同时播放
 * 上限 + 每 URL 限频 + 单音效音量钳制"限制 InnerAudioContext 并发实例数，
 * 作为当前主缓解手段；真正的实例复用池需要侵入微信音频后端，留待 iOS 真机
 * 验证阶段决定，代码以配置常量预留扩展点。
 */
export interface SoundPlayOptions {
    /** 循环次数，0 表示无限循环；默认 1。 */
    loops?: number;
    /** 单音效音量 0..1；默认 1，会叠加 soundVolume 并钳制到 0..1。 */
    volume?: number;
}

export type BgmMode = "direct" | "gameplay" | "battle";

export class MusicMgr {
    private static _instance: MusicMgr;

    static get instance(): MusicMgr {
        if (!this._instance) this._instance = new MusicMgr();
        return this._instance;
    }

    /** 全局同时播放的特效通道上限，直接限制 InnerAudioContext 并发实例数。 */
    private static readonly MAX_CONCURRENT_SOUNDS = 12;
    /** 同一音效 URL 每秒最大触发次数，防止单条高频循环反复创建实例。 */
    private static readonly MAX_SOUNDS_PER_URL_PER_SECOND = 8;

    /** 进入游戏后的普通背景音乐列表。 */
    private static readonly NORMAL_BGM_URLS: readonly string[] = [
        "music/bg_1.mp3",
        "music/bg_2.mp3",
    ];
    private static readonly BGM_GAP_MIN_MS = 5000;
    private static readonly BGM_GAP_MAX_MS = 10000;
    /** 流式音频元数据尚未就绪时，重新读取 duration 的间隔。 */
    private static readonly DURATION_RETRY_MS = 200;
    /** 到达预计结束点后的最小复核间隔，避免零时长循环占满主线程。 */
    private static readonly DURATION_END_CHECK_MIN_MS = 100;

    private static readonly KEY_MUSIC_VOLUME = "music.musicVolume";
    private static readonly KEY_SOUND_VOLUME = "music.soundVolume";
    private static readonly KEY_MUSIC_MUTED = "music.musicMuted";
    private static readonly KEY_SOUND_MUTED = "music.soundMuted";
    private static readonly KEY_MASTER_MUTED = "music.masterMuted";

    private _musicChannel: Laya.SoundChannel | null = null;
    private _musicUrl = "";
    private _musicPosition = 0;
    private _musicVolume = 1;
    private _soundVolume = 1;
    private _musicMuted = false;
    private _soundMuted = false;
    private _masterMuted = false;
    private _wasPlayingBeforeBackground = false;
    private _musicDurationTimer: ReturnType<typeof setTimeout> | null = null;
    private _musicDurationSession = 0;
    private _musicDurationCallback: (() => void) | null = null;

    private _bgmMode: BgmMode = "direct";
    private _lastNormalBgmIndex = -1;
    private _bgmGapTimer: ReturnType<typeof setTimeout> | null = null;

    /** 当前活跃特效通道计数，用于并发上限。 */
    private _activeSoundCount = 0;
    /** 每 URL 活跃通道计数，用于每 URL 限频与结束清理。 */
    private readonly _activeByUrl = new Map<string, number>();
    /** 每 URL 每秒触发窗口，用于限频。 */
    private readonly _urlCallWindows = new Map<string, number[]>();

    private _initialized = false;

    private constructor() {}

    init(): void {
        if (this._initialized) return;
        this._initialized = true;

        // Web/其他平台继续走 Laya 长音频通道；微信 BGM 由项目通道直接把经过
        // Laya 资源版本映射的 URL 交给 InnerAudioContext，绕过整文件 downloadFile。
        Laya.SoundManager.useAudioMusic = true;
        this.readPersistedState();
        this.applyVolumes();

        // 统一在舞台可见性变化时暂停/恢复背景音乐。微信小游戏若未派发该事件，
        // 真机验证阶段再补充 wx.onHide/onShow 平台适配。
        Laya.stage.on(Laya.Event.VISIBILITY_CHANGE, this, this.onVisibilityChanged);
    }

    release(): void {
        if (!this._initialized) return;
        this._initialized = false;
        Laya.stage.off(Laya.Event.VISIBILITY_CHANGE, this, this.onVisibilityChanged);
        this.clearBgmGapTimer();
        this.stopMusic();
        this._bgmMode = "direct";
        this._lastNormalBgmIndex = -1;
        this.stopAllSounds();
    }

    // ============ 背景音乐 ============

    /** 播放背景音乐，同时只允许一个；loops=0 表示无限循环。 */
    playMusic(url: string, loops = 0, startTime = 0, onDurationElapsed?: () => void): void {
        if (!url || this._musicMuted || this._masterMuted) return;

        this.stopMusic();
        this._musicUrl = url;
        this._musicPosition = startTime;
        this._musicChannel = this.createMusicChannel(url, loops, startTime);
        if (this._musicChannel) {
            // SoundChannel 已标记为 music，实际音量由 SoundManager.musicVolume 统一叠加。
            this._musicChannel.volume = 1;
            if (loops === 1 && onDurationElapsed) {
                this._musicDurationCallback = onDurationElapsed;
                this.scheduleMusicDurationCheck(this._musicDurationSession, url);
            }
        }
    }

    stopMusic(): void {
        const channel = this._musicChannel;
        // 先使本次播放会话失效，再停止底层通道，防止旧计时任务作用于下一首音乐。
        this._musicDurationSession++;
        this.clearMusicDurationTimer();
        this._musicDurationCallback = null;
        this._musicChannel = null;
        this._musicUrl = "";
        this._musicPosition = 0;
        channel?.stop();
    }

    getMusicUrl(): string {
        return this._musicUrl;
    }

    /** 当前背景音乐总时长（秒）；流式音频元数据尚未就绪时返回 0。 */
    getMusicDuration(): number {
        const duration = this._musicChannel?.duration ?? 0;
        return Number.isFinite(duration) && duration > 0 ? duration : 0;
    }

    /** 进入主场景/征战：普通 BGM 单次播放，按实际时长结束后停 5-10 秒。 */
    playGameplay(): void {
        // 主场景与征战场景属于同一个播放域，互相切换时不能重启尚未播完的曲目。
        if (this._bgmMode === "gameplay" &&
            (this._musicDurationCallback !== null || this._bgmGapTimer !== null)) return;
        this._bgmMode = "gameplay";
        this.clearBgmGapTimer();
        this.playNextNormalBgm();
    }

    /** 进入战斗：循环播放配置指定的战斗 BGM，不插入曲间间隔。 */
    playBattle(battleUrl: string): void {
        if (!battleUrl) return;
        this._bgmMode = "battle";
        this.clearBgmGapTimer();
        this.playMusic(battleUrl, 0);
    }

    // ============ 特效音效 ============

    /** 播放特效音效；受限频与并发上限约束，超出时丢弃并返回 null。 */
    playSound(url: string, options: SoundPlayOptions = {}): Laya.SoundChannel | null {
        if (!url || this._soundMuted || this._masterMuted) return null;
        if (this.isUrlRateLimited(url)) return null;

        // 超出全局并发上限时丢弃新请求，避免 iOS 上 InnerAudioContext 实例过多。
        if (this._activeSoundCount >= MusicMgr.MAX_CONCURRENT_SOUNDS) return null;

        const loops = options.loops ?? 1;
        const volume = Math.max(0, Math.min(1, options.volume ?? 1));
        const channel = Laya.SoundManager.playSound(
            url,
            loops,
            () => this.onSoundEnded(url),
            0,
        );
        if (channel) {
            channel.volume = volume * this._soundVolume;
            this._activeSoundCount++;
            this._activeByUrl.set(url, (this._activeByUrl.get(url) ?? 0) + 1);
        }
        return channel;
    }

    stopSound(url: string): void {
        Laya.SoundManager.stopSound(url);
    }

    stopAllSounds(): void {
        Laya.SoundManager.stopAllSound();
        this._activeSoundCount = 0;
        this._activeByUrl.clear();
    }

    // ============ 音量与静音 ============

    getMusicVolume(): number {
        return this._musicVolume;
    }

    setMusicVolume(value: number): void {
        this._musicVolume = Math.max(0, Math.min(1, value));
        this.persist(MusicMgr.KEY_MUSIC_VOLUME, String(this._musicVolume));
        this.applyVolumes();
    }

    getSoundVolume(): number {
        return this._soundVolume;
    }

    setSoundVolume(value: number): void {
        this._soundVolume = Math.max(0, Math.min(1, value));
        this.persist(MusicMgr.KEY_SOUND_VOLUME, String(this._soundVolume));
        this.applyVolumes();
    }

    getMusicMuted(): boolean {
        return this._musicMuted;
    }

    setMusicMuted(muted: boolean): void {
        this._musicMuted = muted;
        this.persist(MusicMgr.KEY_MUSIC_MUTED, String(this._musicMuted));
        this.applyVolumes();
    }

    getSoundMuted(): boolean {
        return this._soundMuted;
    }

    setSoundMuted(muted: boolean): void {
        this._soundMuted = muted;
        this.persist(MusicMgr.KEY_SOUND_MUTED, String(this._soundMuted));
        this.applyVolumes();
    }

    getMasterMuted(): boolean {
        return this._masterMuted;
    }

    setMasterMuted(muted: boolean): void {
        this._masterMuted = muted;
        this.persist(MusicMgr.KEY_MASTER_MUTED, String(this._masterMuted));
        this.applyVolumes();
    }

    // ============ 私有 ============

    private readPersistedState(): void {
        this._musicVolume = this.readNumber(MusicMgr.KEY_MUSIC_VOLUME, 1);
        this._soundVolume = this.readNumber(MusicMgr.KEY_SOUND_VOLUME, 1);
        this._musicMuted = this.readBool(MusicMgr.KEY_MUSIC_MUTED, false);
        this._soundMuted = this.readBool(MusicMgr.KEY_SOUND_MUTED, false);
        this._masterMuted = this.readBool(MusicMgr.KEY_MASTER_MUTED, false);
    }

    private applyVolumes(): void {
        // 直接同步到 SoundManager，使后续新播放的音效也继承当前音量/静音。
        Laya.SoundManager.musicVolume = this._musicMuted || this._masterMuted ? 0 : this._musicVolume;
        Laya.SoundManager.soundVolume = this._soundMuted || this._masterMuted ? 0 : this._soundVolume;
        Laya.SoundManager.musicMuted = this._musicMuted || this._masterMuted;
        Laya.SoundManager.soundMuted = this._soundMuted || this._masterMuted;
        if (this._musicChannel) this._musicChannel.volume = 1;
    }

    /** 微信小游戏绕过 Laya 3.3 的 filePath 整包下载；其他平台保留引擎实现。 */
    private createMusicChannel(url: string, loops: number, startTime: number): Laya.SoundChannel | null {
        if (!Laya.Browser.onMiniGame) {
            return Laya.SoundManager.playMusic(url, loops, undefined, startTime);
        }

        const channel = new WechatStreamingMusicChannel(url);
        channel.loops = loops;
        channel.startTime = startTime;
        channel.playbackRate = Laya.SoundManager.playbackRate;
        channel.volume = 1;
        channel.muted = this._musicMuted || this._masterMuted;
        channel.play();
        return channel;
    }

    /**
     * 流式音频的 duration 可能在 playMusic 返回后才就绪。计时到点时再次比较
     * position，缓冲或调度延迟导致尚未播完时只延后剩余时间，绝不提前切歌。
     */
    private scheduleMusicDurationCheck(session: number, url: string): void {
        if (session !== this._musicDurationSession || this._musicUrl !== url || !this._musicChannel) return;
        this.clearMusicDurationTimer();

        const duration = this.getMusicDuration();
        if (duration <= 0) {
            this._musicDurationTimer = setTimeout(
                () => this.scheduleMusicDurationCheck(session, url),
                MusicMgr.DURATION_RETRY_MS,
            );
            return;
        }

        const remainingMs = Math.max(0, duration - this._musicChannel.position) * 1000;
        this._musicDurationTimer = setTimeout(
            () => this.onMusicDurationTimer(session, url),
            Math.max(MusicMgr.DURATION_END_CHECK_MIN_MS, Math.ceil(remainingMs)),
        );
    }

    private onMusicDurationTimer(session: number, url: string): void {
        this._musicDurationTimer = null;
        if (session !== this._musicDurationSession || this._musicUrl !== url || !this._musicChannel) return;

        const duration = this.getMusicDuration();
        const position = this._musicChannel.position;
        if (duration <= 0 || (!this._musicChannel.isStopped && position < duration)) {
            this.scheduleMusicDurationCheck(session, url);
            return;
        }

        const callback = this._musicDurationCallback;
        this._musicDurationCallback = null;
        this._musicChannel = null;
        this._musicUrl = "";
        this._musicPosition = 0;
        callback?.();
    }

    private clearMusicDurationTimer(): void {
        if (this._musicDurationTimer !== null) {
            clearTimeout(this._musicDurationTimer);
            this._musicDurationTimer = null;
        }
    }

    private playNextNormalBgm(): void {
        if (this._bgmMode !== "gameplay") return;

        const count = MusicMgr.NORMAL_BGM_URLS.length;
        let index = Math.floor(Math.random() * count);
        if (count > 1 && index === this._lastNormalBgmIndex) index = (index + 1) % count;
        this._lastNormalBgmIndex = index;
        this.playMusic(
            MusicMgr.NORMAL_BGM_URLS[index],
            1,
            0,
            () => this.scheduleNextNormalBgm(),
        );
    }

    private scheduleNextNormalBgm(): void {
        if (this._bgmMode !== "gameplay") return;
        this.clearBgmGapTimer();
        const gapMs = MusicMgr.BGM_GAP_MIN_MS + Math.floor(
            Math.random() * (MusicMgr.BGM_GAP_MAX_MS - MusicMgr.BGM_GAP_MIN_MS + 1),
        );
        this._bgmGapTimer = setTimeout(() => {
            this._bgmGapTimer = null;
            this.playNextNormalBgm();
        }, gapMs);
    }

    private clearBgmGapTimer(): void {
        if (this._bgmGapTimer !== null) {
            clearTimeout(this._bgmGapTimer);
            this._bgmGapTimer = null;
        }
    }

    private onSoundEnded(url: string): void {
        this._activeSoundCount = Math.max(0, this._activeSoundCount - 1);
        const count = this._activeByUrl.get(url) ?? 0;
        if (count <= 1) this._activeByUrl.delete(url);
        else this._activeByUrl.set(url, count - 1);
    }

    /** 判断某 URL 是否超过每秒限频；通过则记录本次调用。 */
    private isUrlRateLimited(url: string): boolean {
        const now = Date.now();
        const windowMs = 1000;
        const calls = this._urlCallWindows.get(url) ?? [];
        const recent = calls.filter((t) => now - t < windowMs);
        if (recent.length >= MusicMgr.MAX_SOUNDS_PER_URL_PER_SECOND) {
            this._urlCallWindows.set(url, recent);
            return true;
        }
        recent.push(now);
        this._urlCallWindows.set(url, recent);
        return false;
    }

    private onVisibilityChanged(): void {
        const visible = Laya.stage.isVisibility;
        if (visible) {
            // 回到前台：恢复之前正在播放的背景音乐。
            if (this._wasPlayingBeforeBackground && this._musicChannel) {
                this._musicChannel.resume();
                if (this._musicDurationCallback) {
                    this.scheduleMusicDurationCheck(this._musicDurationSession, this._musicUrl);
                }
            }
            this._wasPlayingBeforeBackground = false;
        } else {
            this._wasPlayingBeforeBackground = !!this._musicChannel
                && !this._musicChannel.isStopped
                && !this._musicChannel.paused
                && !this._musicMuted
                && !this._masterMuted;
            if (this._musicChannel) {
                this._musicPosition = this._musicChannel.position;
                // 后台停留时间不能消耗播放倒计时；前台恢复后按 duration-position 重建。
                this.clearMusicDurationTimer();
            }
            this._musicChannel?.pause();
        }
    }

    private readNumber(key: string, fallback: number): number {
        const raw = Laya.LocalStorage.getItem(key);
        // 微信小游戏的 localStorage 兼容层对不存在的 key 返回空字符串；若直接
        // Number("") 会得到 0，使首次启动的默认音量被错误静音。
        if (raw === null || raw.trim() === "") return fallback;
        const value = Number(raw);
        return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
    }

    private readBool(key: string, fallback: boolean): boolean {
        const raw = Laya.LocalStorage.getItem(key);
        if (raw === null) return fallback;
        return raw === "true";
    }

    private persist(key: string, value: string): void {
        try {
            Laya.LocalStorage.setItem(key, value);
        } catch (e) {
            console.warn(`[MusicMgr] 保存设置失败: ${key}`, e);
        }
    }
}
