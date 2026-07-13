// Loading 界面 - 显示分包加载进度
// 2025-12-11 创建
// 2025-06-30 重构：使用 IDE 绑定的 GProgressBar 组件

import { LoadingViewBase } from "./LoadingView.generated";

const { regClass } = Laya;

/**
 * Loading 界面
 *
 * 职责：
 * - 显示 Logic 分包加载进度
 * - 通过 process-bar（GProgressBar）和 context（进度文本）显示进度
 * - 加载完成后自动关闭
 *
 * UI 组件（IDE 绑定）：
 * - process-bar: Laya.GProgressBar - 进度条组件
 * - context: Laya.GTextField - 进度百分比文本
 */
@regClass()
export class LoadingView extends LoadingViewBase {
    private _tipText: string = "";

    constructor() {
        super();
    }

    /**
     * 组件被激活后执行，此时所有节点和组件均已创建完毕
     */
    onAwake(): void {
        // 初始化进度为 0
        this.updateProgress(0);
    }

    /**
     * 更新加载进度
     * @param progress 进度值（0-1）
     * @param tipText 提示文本
     */
    public updateProgress(progress: number, tipText?: string): void {
        // 限制进度范围
        progress = Math.max(0, Math.min(1, progress));
        if (tipText !== undefined) {
            this._tipText = tipText;
        }

        const progressBar = this["process-bar"] as any;
        if (progressBar) {
            const min = typeof progressBar.min === "number" ? progressBar.min : 0;
            const max = typeof progressBar.max === "number" ? progressBar.max : 100;
            progressBar.value = min + (max - min) * progress;
        }

        // 更新进度文本
        if (this.context) {
            const percentage = Math.floor(progress * 100);
            this.context.text = this._tipText ? `${this._tipText} ${percentage}%` : `${percentage}%`;
        }

    }

    /**
     * 更新提示文本
     * @param tip 提示文本
     */
    public updateTip(tip: string): void {
        this._tipText = tip || "";
        this.updateProgress(this.getProgressValue());
    }

    private getProgressValue(): number {
        const progressBar = this["process-bar"] as any;
        if (!progressBar) return 0;

        const min = typeof progressBar.min === "number" ? progressBar.min : 0;
        const max = typeof progressBar.max === "number" ? progressBar.max : 100;
        if (max === min) return 0;
        return (progressBar.value - min) / (max - min);
    }

    /**
     * 加载完成，关闭 Loading 界面
     */
    public onLoadComplete(): Promise<void> {
        // 确保进度显示 100%
        this.updateProgress(1);

        return new Promise<void>((resolve) => {
            // 渐隐动画
            Laya.Tween.to(this, { alpha: 0 }, 300, Laya.Ease.linearNone, Laya.Handler.create(this, () => {
                this.close();
                this.destroy();
                resolve();
            }));
        });
    }

    /**
     * 显示错误信息
     * @param errorMessage 错误信息
     */
    public showError(errorMessage: string): void {
        console.error("[LoadingView] 加载失败:", errorMessage);

        // 更新文本显示错误
        if (this.context) {
            this.context.text = errorMessage;
            // 如果有颜色属性，设置为红色
            // this.context.color = "#ff5252";
        }
    }

    /**
     * 组件销毁时清理资源
     */
    onDestroy(): void {
        // 清理补间动画
        Laya.Tween.clearAll(this);
    }
}
