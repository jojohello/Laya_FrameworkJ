/**
 * 按钮点击反馈脚本
 * 1. 点击时缩放动画
 * 2. 播放音效（可选）
 * 3. 保护期内不响应多次点击
 */
const { regClass, property } = Laya;

@regClass()
export class btnClickLayaScript extends Laya.Script {
    /** 保护时间（秒），可在编辑器设置 */
    @property({ type: Number })
    protectTime: number = 0.3;

    /** 点击音效路径，可在编辑器设置，留空则不播放 */
    @property({ type: String })
    sound: string = "";

    private _canClick: boolean = true;
    private _oriScaleX: number = 1;
    private _oriScaleY: number = 1;

    onAwake() {
        // 记录原始缩放
        const owner = this.owner as Laya.Sprite;
        this._oriScaleX = owner.scaleX;
        this._oriScaleY = owner.scaleY;
        // 监听点击
        owner.on(Laya.Event.CLICK, this, this.onBtnClick);
    }

    onDestroy() {
        (this.owner as Laya.Sprite).off(Laya.Event.CLICK, this, this.onBtnClick);
    }

    private onBtnClick() {
        if (!this._canClick) return;
        this._canClick = false;
        // 播放音效（如果有设置）
        if (this.sound) {
            Laya.SoundManager.playSound(this.sound);
        }
        // 缩放动画（缩小再恢复）
        const owner = this.owner as Laya.Sprite;
        Laya.Tween.to(owner, { scaleX: this._oriScaleX * 0.9, scaleY: this._oriScaleY * 0.9 }, 60, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
            Laya.Tween.to(owner, { scaleX: this._oriScaleX, scaleY: this._oriScaleY }, 60, Laya.Ease.linearNone);
        }));
        // 保护期
        Laya.timer.once(this.protectTime * 1000, this, () => {
            this._canClick = true;
        });
    }
}
