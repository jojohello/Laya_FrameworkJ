/**
 * 主界面脚本类
 * 用于验证 UIManager 功能：单例、缓存、资源管理
 */
import { MainSceneViewBase } from "./MainSceneView.generated";

const { regClass } = Laya;

@regClass()
export class MainSceneView extends MainSceneViewBase {
    private static readonly DEFAULT_SELECTED_INDEX = 2;

    private _selectedButtonIndex: number = -1;

    constructor() {
        super();
    }

    // ========== IUIView 约定方法（UIManager 调用） ==========

    /**
     * UI 打开时调用
     * @param param 打开参数
     */
    onOpened(param?: any): void {
        this.initButtonList();
        this.initSystemButtonStates();
        this.selectSystemButton(MainSceneView.DEFAULT_SELECTED_INDEX);
    }

    /**
     * UI 关闭时调用
     */
    onClosed(): void {
        this.clearButtonListEvents();
    }

    /**
     * 播放进入动画（缩放弹出效果）
     * @param complete 动画完成回调
     */
    playEnterAnimation(complete?: Function): void {
        this.scale(0.8, 0.8);
        Laya.Tween.to(
            this,
            { scaleX: 1, scaleY: 1 },
            300,
            Laya.Ease.backOut,
            Laya.Handler.create(this, () => {
                if (complete) complete();
            })
        );
    }

    /**
     * 播放退出动画（缩放收起效果）
     * @param complete 动画完成回调
     */
    playExitAnimation(complete?: Function): void {
        Laya.Tween.to(
            this,
            { scaleX: 0.8, scaleY: 0.8 },
            200,
            Laya.Ease.linearNone,
            Laya.Handler.create(this, () => {
                if (complete) complete();
            })
        );
    }

    /**
     * 获取按钮列表
     */
    getBtnList(): Laya.GList | null {
        return this.btn_list || null;
    }

    private initButtonList(): void {
        if (!this.btn_list) return;

        this.clearButtonListEvents();
        this.btn_list.selection.mode = Laya.SelectionMode.Single;
        this.btn_list.on(Laya.UIEvent.ClickItem, this, this.onButtonListClickItem);
        this.btn_list.on(Laya.Event.CHANGE, this, this.onButtonListSelectChanged);
    }

    private clearButtonListEvents(): void {
        if (!this.btn_list) return;

        this.btn_list.off(Laya.UIEvent.ClickItem, this, this.onButtonListClickItem);
        this.btn_list.off(Laya.Event.CHANGE, this, this.onButtonListSelectChanged);
    }

    private onButtonListSelectChanged(): void {
        this.selectSystemButton(this.btn_list.selectedIndex);
    }

    private onButtonListClickItem(item?: Laya.GWidget): void {
        const clickItem = item || this.btn_list.touchItem;
        if (!clickItem) return;

        const childIndex = this.btn_list.getChildIndex(clickItem);
        const itemIndex = this.btn_list.childIndexToItemIndex(childIndex);
        this.selectSystemButton(itemIndex);
    }

    private initSystemButtonStates(): void {
        if (!this.btn_list) return;

        for (let i = 0; i < this.btn_list.numChildren; i++) {
            const button = this.getSystemButtonAt(i);
            if (!button) continue;

            button.enabled = true;
            button.grayed = false;
            button.selected = false;
        }
    }

    private selectSystemButton(index: number): void {
        if (!this.btn_list || index < 0 || index >= this.btn_list.numChildren) return;

        const targetButton = this.getSystemButtonAt(index);
        if (!targetButton || !targetButton.enabled) {
            this.restoreSelectedIndex();
            return;
        }

        this._selectedButtonIndex = index;
        if (this.btn_list.selection.index !== index) {
            this.btn_list.selection.add(index);
        }
        this.syncSystemButtonSelectedStates();
    }

    private restoreSelectedIndex(): void {
        if (!this.btn_list || this._selectedButtonIndex < 0) return;

        if (this.btn_list.selection.index !== this._selectedButtonIndex) {
            this.btn_list.selection.add(this._selectedButtonIndex);
        }
        this.syncSystemButtonSelectedStates();
    }

    private syncSystemButtonSelectedStates(): void {
        if (!this.btn_list) return;

        for (let i = 0; i < this.btn_list.numChildren; i++) {
            const button = this.getSystemButtonAt(i);
            if (!button) continue;

            button.selected = i === this._selectedButtonIndex;
        }
    }

    private getSystemButtonAt(index: number): Laya.GButton | null {
        const item = this.btn_list.getChildAt(index);
        return item instanceof Laya.GButton ? item : null;
    }
}
