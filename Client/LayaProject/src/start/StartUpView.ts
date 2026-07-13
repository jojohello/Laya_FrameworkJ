import { StartMain } from "./StartMain";
import { StartUpViewBase } from "./StartUpView.generated";

const { regClass, property } = Laya;

@regClass()
export class StartUpView extends StartUpViewBase {
    //declare owner : Laya.Sprite3D;
    //declare owner : Laya.Sprite;

    @property(String)
    public text: string = "";

    // 文字动画相关
    private _animationTimer: any = 0;
    private _dotCount: number = 0;
    private _baseText: string = "正在初始化中";
    private _animationInterval: number = 500; // 动画间隔（毫秒）

    public async onOpened(): Promise<void> {
        // 开始文字动画
        this.startTextAnimation();

        // 创建 StartMain 实例
        const startMain = new StartMain();

        // 挂载到 window（供 LoginView 调用）
        (Laya.Browser.window as any).startMain = startMain;

        // 启动主包流程
        await startMain.start();
    }

    // 开始文字动画
    private startTextAnimation(): void {
        if (this.animText) {
            this._animationTimer = Laya.timer.loop(this._animationInterval, this, this.updateTextAnimation);
        } else {
            console.warn("animText组件未找到，无法播放文字动画");
        }
    }

    // 更新文字动画
    private updateTextAnimation(): void {
        if (this.animText) {
            this._dotCount = (this._dotCount + 1) % 4; // 0,1,2,3 循环
            const dots = ".".repeat(this._dotCount);
            this.animText.text = this._baseText + dots;
        }
    }

    // 停止文字动画
    private stopTextAnimation(): void {
        if (this._animationTimer) {
            Laya.timer.clear(this, this.updateTextAnimation);
            this._animationTimer = 0;
        }
    }

    // 组件销毁时清理
    onDestroy(): void {
        this.stopTextAnimation();
    }
}
