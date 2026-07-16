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
import { TopPrefab } from "./TopPrefab";

const { regClass } = Laya;

@regClass()
export class MainSceneView extends MainSceneViewBase {
    private static readonly BATTLE_FUNCTION_ID = 1001;
    private static readonly SYSTEM_NAMES = ["战斗地图", "背包", "任务", "商店", "设置"];
    private static readonly SYSTEM_ICONS = ["ui/mainscene/imgs/icon-battle.png", "ui/mainscene/imgs/icon-box.png", "ui/mainscene/imgs/icon-flag.png", "ui/mainscene/imgs/icon-cup.png", "ui/mainscene/imgs/icon-world.png"];
    private static readonly DEFAULT_SELECTED_INDEX = 2;
    private static readonly GOLD_CURRENCY_ITEM_ID = 1001;
    private static readonly EXP_BAR_WIDTH = 106;
    private static readonly DISPLAY_EXP_PER_LEVEL = 100;

    private _selectedButtonIndex: number = -1;
    private _playerProfile: TopPrefab | null = null;
    private _avatarMask: Laya.Sprite | null = null;

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
        this.selectSystemButton(this.btn_list.selectedIndex);
    }

    private onButtonListClickItem(item?: Laya.GWidget): void {
        const clickItem = item || this.btn_list.touchItem;
        if (!clickItem) return;

        const childIndex = this.btn_list.getChildIndex(clickItem);
        const itemIndex = this.btn_list.childIndexToItemIndex(childIndex);
        if (itemIndex === 0) {
            if (!FunctionOpenMgr.instance.isOpen(MainSceneView.BATTLE_FUNCTION_ID) && (PlayerMgr.instance.data?.level || 0) < 2) {
                return;
            }
            SceneMgr.instance.switchScene(SceneType.BattleScene);
            return;
        }
        this.selectSystemButton(itemIndex);
    }

    private initSystemButtonStates(): void {
        if (!this.btn_list) return;

        for (let i = 0; i < this.btn_list.numChildren; i++) {
            const button = this.getSystemButtonAt(i);
            if (!button) continue;

            const name = button.getChild("name_1") as Laya.GTextField;
            const loader = button.getChild("loader_1") as Laya.GLoader;
            if (name) name.text = MainSceneView.SYSTEM_NAMES[i] || `系统${i + 1}`;
            if (loader) loader.url = MainSceneView.SYSTEM_ICONS[i] || "";
            button.selected = false;
        }
        this.refreshSystemButtonStates();
    }

    private refreshSystemButtonStates(): void {
        if (!this.btn_list) return;
        const battleOpen = FunctionOpenMgr.instance.isOpen(MainSceneView.BATTLE_FUNCTION_ID) || (PlayerMgr.instance.data?.level || 0) >= 2;
        const battle = this.getSystemButtonAt(0);
        if (battle) { battle.enabled = battleOpen; battle.grayed = !battleOpen; }
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
        const profileBg = profile.getChild("profileBg") as Laya.GLoader;
        const avatarFrame = profile.getChild("avatarFrame") as Laya.GLoader;
        const avatar = profile.getChild("playerAvatar") as Laya.GLoader;
        const levelBadge = profile.getChild("levelBadge") as Laya.GLoader;
        const expTrack = profile.getChild("expTrack") as Laya.GLoader;
        const expFill = profile.getChild("expFill") as Laya.GLoader;
        const crystalIcon = profile.getChild("crystalIcon") as Laya.GLoader;
        const crystalAmount = profile.getChild("crystalAmount") as Laya.GTextField;
        const crystalAdd = profile.getChild("crystalAdd") as Laya.GLoader;
        const goldIcon = profile.getChild("goldIcon") as Laya.GLoader;
        const goldAmount = profile.getChild("goldAmount") as Laya.GTextField;
        const goldAdd = profile.getChild("goldAdd") as Laya.GLoader;
        const staminaIcon = profile.getChild("staminaIcon") as Laya.GLoader;
        const staminaAmount = profile.getChild("staminaAmount") as Laya.GTextField;
        const staminaAdd = profile.getChild("staminaAdd") as Laya.GLoader;
        if (profileBg) profileBg.url = "ui/mainscene/imgs/player-profile-bg.png";
        if (avatarFrame) avatarFrame.url = "ui/common/imgs/player-avatar-frame.png";
        if (avatar) avatar.url = "ui/common/imgs/player-avatar-default.png";
        if (levelBadge) levelBadge.url = "ui/mainscene/imgs/player-level-badge.png";
        if (expTrack) expTrack.url = "ui/common/imgs/exp-track.png";
        if (expFill) expFill.url = "ui/common/imgs/exp-fill.png";
        if (crystalIcon) crystalIcon.url = "ui/common/imgs/currency-crystal.png";
        if (goldIcon) goldIcon.url = "ui/common/imgs/currency-gold.png";
        if (staminaIcon) staminaIcon.url = "ui/common/imgs/stamina-potion.png";
        if (crystalAdd) crystalAdd.url = "ui/common/imgs/btn-add.png";
        if (goldAdd) goldAdd.url = "ui/common/imgs/btn-add.png";
        if (staminaAdd) staminaAdd.url = "ui/common/imgs/btn-add.png";
        this.applyAvatarMask(avatar);
        profile.setPlayerIdentity(data?.name, data?.level);
        if (crystalAmount) crystalAmount.text = "0";
        if (goldAmount) goldAmount.text = this.formatCompactAmount(WalletMgr.instance.getBalance(MainSceneView.GOLD_CURRENCY_ITEM_ID));
        if (staminaAmount) staminaAmount.text = this.formatCompactAmount(data?.stamina || 0);
        if (expFill) {
            const exp = Math.max(0, Number(data?.exp) || 0);
            const progress = (exp % MainSceneView.DISPLAY_EXP_PER_LEVEL) / MainSceneView.DISPLAY_EXP_PER_LEVEL;
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

    private formatCompactAmount(value: number): string {
        const amount = Math.max(0, Math.floor(Number(value) || 0));
        if (amount < 1000) return `${amount}`;
        if (amount < 1000000) return `${Math.floor(amount / 100) / 10}K`;
        return `${Math.floor(amount / 100000) / 10}M`;
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
