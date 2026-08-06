/**
 * 主界面脚本类
 * 用于验证 UIManager 功能：单例、缓存、资源管理
 */
import { MainSceneViewBase } from "./MainSceneView.generated";
import { PlayerMgr } from "../player/PlayerMgr";
import { FunctionOpenMgr } from "../functionOpen/FunctionOpenMgr";
import { SceneMgr } from "../scene/SceneMgr";
import { SceneType } from "../scene/SceneType";
import { WalletMgr } from "../wallet/WalletMgr";
import { ExactIntegerInput, exactModuloRatio, formatCompactInteger } from "../common/ExactInteger";
import { TopPrefab } from "./TopPrefab";
import { ConfigMgr } from "../config/ConfigMgr";
import { MainNavRouteRegistry } from "./MainNavRouteRegistry";
import { UITextStyle } from "../ui/UITextStyle";

const { regClass } = Laya;

interface MainNavConfig {
    ID: number;
    functionId: number;
    label: string;
    icon: string;
    routeKey: string;
    /** JSON array string exported from MainNav.csv. */
    routeArgs: string;
    closedDisplay: "hidden" | "disabled" | "enabled";
    closedClick: "ignore" | "tip" | "route";
    order: number;
}

enum MainShellMode {
    Main = "MainScene",
    BattleStage = "BattleStageScene",
}

@regClass()
export class MainSceneView extends MainSceneViewBase {
    private static readonly BATTLE_FUNCTION_ID = 1001;
    private static readonly DEFAULT_SELECTED_INDEX = 2;
    private static readonly GOLD_CURRENCY_ITEM_ID = 1001;
    private static readonly CRYSTAL_CURRENCY_ITEM_ID = 1004;
    private static readonly EXP_BAR_WIDTH = 106;
    private static readonly DISPLAY_EXP_PER_LEVEL = 100;

    private _selectedButtonIndex: number = -1;
    private _playerProfile: TopPrefab | null = null;
    private _avatarMask: Laya.Sprite | null = null;
    private _shellMode: MainShellMode = MainShellMode.Main;
    private _navConfigs: readonly MainNavConfig[] = [];

    constructor() {
        super();
    }

    // ========== IUIView 约定方法（UIManager 调用） ==========

    /**
     * UI 打开时调用
     * @param param 打开参数
     */
    onOpened(param?: any): void {
        // MainUI is cached across scene switches. Always restore canonical root
        // geometry so an interrupted or legacy exit tween cannot shrink the shell.
        Laya.Tween.clearAll(this);
        this.scale(1, 1);
        this.clearButtonListEvents();
        PlayerMgr.instance.removeListener(this.onPlayerChanged);
        WalletMgr.instance.removeListener(this.onWalletChanged);
        FunctionOpenMgr.instance.removeListener(this.onFunctionOpened);
        this.initButtonList();
        this.initSystemButtonStates();
        this.applyShellMode(param?.fromScene);
        const requestedIndex = Number.isInteger(param?.mainNavIndex) ? param.mainNavIndex : -1;
        this.selectSystemButton(
            requestedIndex >= 0
                ? requestedIndex
                : this._shellMode === MainShellMode.BattleStage
                    ? 0
                    : MainSceneView.DEFAULT_SELECTED_INDEX
        );
        this._playerProfile = this.playerProfile as TopPrefab;
        this.refreshPlayerProfile();
        PlayerMgr.instance.addListener(this.onPlayerChanged);
        WalletMgr.instance.addListener(this.onWalletChanged);
        FunctionOpenMgr.instance.addListener(this.onFunctionOpened);
        this.refreshSystemButtonStates();
    }

    /**
     * UI 关闭时调用
     */
    onClosed(): void {
        Laya.timer.clear(this, this.syncSystemButtonSelectedStates);
        this.clearButtonListEvents();
        PlayerMgr.instance.removeListener(this.onPlayerChanged);
        WalletMgr.instance.removeListener(this.onWalletChanged);
        FunctionOpenMgr.instance.removeListener(this.onFunctionOpened);
        this._playerProfile = null;
        this._avatarMask?.destroy();
        this._avatarMask = null;
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
        console.log(`[MainSceneView] 导航 selection 变化: selectedIndex=${this.btn_list.selectedIndex}`);
        this.selectSystemButton(this.btn_list.selectedIndex);
    }

    private onButtonListClickItem(item?: Laya.GWidget): void {
        const clickItem = item || this.btn_list.touchItem;
        if (!clickItem) return;

        const childIndex = this.btn_list.getChildIndex(clickItem);
        const itemIndex = this.btn_list.childIndexToItemIndex(childIndex);
        const navConfig = this._navConfigs[itemIndex];
        console.log(`[MainSceneView] 点击导航: index=${itemIndex}, route=${navConfig?.routeKey || "missing"}, shell=${this._shellMode}`);
        if (itemIndex === 0) {
            if (!FunctionOpenMgr.instance.isOpen(MainSceneView.BATTLE_FUNCTION_ID) && (PlayerMgr.instance.data?.level || 0) < 2) {
                console.warn(`[MainSceneView] 战斗入口未开放: functionId=${MainSceneView.BATTLE_FUNCTION_ID}, level=${PlayerMgr.instance.data?.level || 0}`);
                return;
            }
            this.selectSystemButton(itemIndex);
            MainNavRouteRegistry.closeMainContent();
            void SceneMgr.instance.switchScene(SceneType.BattleStageScene).then(scene => {
                console.log(`[MainSceneView] 战斗场景切换结果: success=${!!scene}, current=${SceneMgr.instance.curSceneName || "none"}`);
            });
            return;
        }
        this.selectSystemButton(itemIndex);
        const routeArgs = this.parseRouteArgs(navConfig?.routeArgs);
        if (this._shellMode === MainShellMode.BattleStage) {
            void SceneMgr.instance
                .switchScene(SceneType.MainScene, { mainNavIndex: itemIndex })
                .then(() => MainNavRouteRegistry.open(navConfig?.routeKey || "", routeArgs));
            return;
        }
        if (navConfig) {
            void MainNavRouteRegistry.open(navConfig.routeKey, routeArgs);
        }
    }

    /**
     * 主界面资源是跨场景复用的 UI 壳层。Controller 只适合表现状态，
     * 场景模式仍由代码确定，避免编辑器状态成为业务真相。
     */
    private applyShellMode(fromScene?: string): void {
        // MainUI 是跨场景壳层，根节点的空白区域不能拦截场景对象点击；
        // GList、按钮等子控件仍会按照自身命中区域接收点击。
        (this as any).mouseThrough = true;
        if (Laya.GRoot.inst) {
            (Laya.GRoot.inst as any).mouseThrough = true;
        }
        this._shellMode = fromScene === MainShellMode.BattleStage
            ? MainShellMode.BattleStage
            : MainShellMode.Main;

        this.setNamedGroupVisible("playerProfile", true);
        this.setNamedGroupVisible("buttom", true);
        const showMainActivities = this._shellMode === MainShellMode.Main;
        this.setNamedGroupVisible("leftActivities", showMainActivities);
        this.setNamedGroupVisible("rightActivities", showMainActivities);
    }

    private setNamedGroupVisible(name: string, visible: boolean): void {
        const child = this.getChildByName(name) as Laya.Node | null;
        if (child) child.active = visible;
    }

    private initSystemButtonStates(): void {
        if (!this.btn_list) return;

        this._navConfigs = this.loadNavConfigs();
        this.btn_list.itemRenderer = this.renderSystemButton;
        this.btn_list.numItems = this._navConfigs.length;

        for (let i = 0; i < this.btn_list.numChildren; i++) {
            const itemIndex = this.btn_list.childIndexToItemIndex(i);
            this.renderSystemButton(itemIndex, this.btn_list.getChildAt(i));
        }
        this.refreshSystemButtonStates();
    }

    private renderSystemButton = (index: number, item: Laya.GWidget): void => {
        if (!(item instanceof Laya.GButton)) return;

        const config = this._navConfigs[index];
        const name = item.getChild("name_1") as Laya.GTextField;
        const loader = item.getChild("loader_1") as Laya.GLoader;
        if (name) {
            name.text = config?.label || `系统${index + 1}`;
            UITextStyle.apply(name, "nav.normal");
        }
        if (loader) loader.src = config?.icon || "";
        item.selected = false;
    };

    private refreshSystemButtonStates(): void {
        if (!this.btn_list) return;
        for (let i = 0; i < this.btn_list.numChildren; i++) {
            const button = this.getSystemButtonAt(i);
            const itemIndex = this.btn_list.childIndexToItemIndex(i);
            const config = this._navConfigs[itemIndex];
            if (!button || !config) continue;

            const open = config.functionId <= 0
                || FunctionOpenMgr.instance.isOpen(config.functionId)
                || (config.functionId === MainSceneView.BATTLE_FUNCTION_ID && (PlayerMgr.instance.data?.level || 0) >= 2);
            const shouldHide = !open && config.closedDisplay === "hidden";
            button.active = !shouldHide;
            button.enabled = open || config.closedDisplay !== "disabled";
            button.grayed = !open && config.closedDisplay === "disabled";
        }
    }

    private loadNavConfigs(): readonly MainNavConfig[] {
        const configs = [...ConfigMgr.instance.getAll<MainNavConfig>("MainNav")];
        configs.sort((a, b) => a.order - b.order);
        return configs;
    }

    private onPlayerChanged = (data: { level: number }): void => {
        this.refreshPlayerProfile();
        this.refreshSystemButtonStates();
    };

    private onFunctionOpened = (): void => this.refreshSystemButtonStates();

    private onWalletChanged = (): void => this.refreshPlayerProfile();

    private refreshPlayerProfile(): void {
        const profile = this._playerProfile;
        if (!profile) return;

        const data = PlayerMgr.instance.data;
        const avatar = profile.getChild("playerAvatar") as Laya.GLoader;
        const expFill = profile.getChild("expFill") as Laya.GImage;
        const crystalAmount = profile.getChild("crystalAmount") as Laya.GTextField;
        const goldAmount = profile.getChild("goldAmount") as Laya.GTextField;
        const staminaAmount = profile.getChild("staminaAmount") as Laya.GTextField;
        if (avatar) avatar.src = "ui/common/imgs/player-avatar-default.png";
        this.applyAvatarMask(avatar);
        profile.setPlayerIdentity(data?.name, data?.level);
        if (crystalAmount) crystalAmount.text = this.formatCompactAmount(WalletMgr.instance.getBalance(MainSceneView.CRYSTAL_CURRENCY_ITEM_ID));
        if (goldAmount) goldAmount.text = this.formatCompactAmount(WalletMgr.instance.getBalance(MainSceneView.GOLD_CURRENCY_ITEM_ID));
        if (staminaAmount) staminaAmount.text = this.formatCompactAmount(data?.stamina || 0);
        if (expFill) {
            const progress = exactModuloRatio(data?.exp, MainSceneView.DISPLAY_EXP_PER_LEVEL);
            expFill.width = MainSceneView.EXP_BAR_WIDTH * progress;
            expFill.visible = progress > 0;
        }
    }

    private applyAvatarMask(avatar: Laya.GLoader | null): void {
        if (!avatar) return;
        const displayObject = (avatar as any).displayObject as Laya.Sprite | undefined;
        if (!displayObject) return;

        if (!this._avatarMask) {
            this._avatarMask = new Laya.Sprite();
            this._avatarMask.graphics.drawCircle(36, 36, 34, "#ffffff");
        }
        displayObject.mask = this._avatarMask;
    }

    private formatCompactAmount(value: ExactIntegerInput): string {
        return formatCompactInteger(value);
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
        // GList/GButton update their controller state during the same pointer event.
        // Re-apply once after that event so the selected gear cannot be overwritten.
        Laya.timer.callLater(this, this.syncSystemButtonSelectedStates);
    }

    private restoreSelectedIndex(): void {
        if (!this.btn_list || this._selectedButtonIndex < 0) return;

        if (this.btn_list.selection.index !== this._selectedButtonIndex) {
            this.btn_list.selection.add(this._selectedButtonIndex);
        }
        this.syncSystemButtonSelectedStates();
        Laya.timer.callLater(this, this.syncSystemButtonSelectedStates);
    }

    private syncSystemButtonSelectedStates(): void {
        if (!this.btn_list) return;

        for (let i = 0; i < this.btn_list.numChildren; i++) {
            const button = this.getSystemButtonAt(i);
            if (!button) continue;

            const itemIndex = this.btn_list.childIndexToItemIndex(i);
            const selected = itemIndex === this._selectedButtonIndex;
            const name = button.getChild("name_1") as Laya.GTextField;
            button.selected = selected;
            if (name) {
                UITextStyle.apply(name, selected ? "nav.selected" : "nav.normal");
            }
        }
        console.log(`[MainSceneView] 导航选中态已同步: index=${this._selectedButtonIndex}, selection=${this.btn_list.selection.index}`);
    }

    private parseRouteArgs(raw?: string): readonly any[] {
        if (!raw) return [];
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.warn(`[MainSceneView] routeArgs 不是合法 JSON 数组: ${raw}`, error);
            return [];
        }
    }

    private getSystemButtonAt(index: number): Laya.GButton | null {
        const item = this.btn_list.getChildAt(index);
        return item instanceof Laya.GButton ? item : null;
    }
}
