import { UILayer } from "../core/LayerDef";
import { BattleMainViewController } from "../battleScene/BattleMainViewController";
import { BattleVictoryViewController } from "../battleScene/BattleVictoryViewController";
import { BattleDefeatViewController } from "../battleScene/BattleDefeatViewController";
import { BagViewController } from "../item/BagViewController";
import { SettingsViewController } from "../settings/SettingsViewController";

/**
 * UI 配置表。
 * layerName 保留语义，zOrder 作为实际显示层级。
 */
export const UIConfigTable: { [name: string]: any } = {
    "LoginView": {
        path: "startupUI/login/loginView.ls",
        layerName: "Login",
        zOrder: UILayer.Login,
        singleton: true,
        autoDestroy: true,
        mutex: ["RegisterView"],
    },

    "MainUI": {
        path: "ui/mainscene/MainSceneView.ls",
        layerName: "MainUI",
        zOrder: UILayer.MainUI,
        // MainUI 是跨场景壳层。根节点空白区域必须让点击穿透到场景，
        // 但其内部的 GList、按钮等子组件仍然可以正常响应。
        mouseThrough: true,
        singleton: true,
        autoDestroy: false,
    },

    "BattleUI": {
        path: "ui/battlescene/BattleMainView.ls",
        layerName: "MainUI",
        zOrder: UILayer.MainUI,
        mouseThrough: true,
        singleton: true,
        autoDestroy: true,
        controllerClass: BattleMainViewController,
    },

    "BattleVictoryUI": {
        path: "ui/battlescene/BattleVictoryView.ls",
        layerName: "Pop",
        zOrder: UILayer.Pop,
        singleton: true,
        autoDestroy: true,
        controllerClass: BattleVictoryViewController,
    },

    "BattleDefeatUI": {
        path: "ui/battlescene/BattleDefeatView.ls",
        layerName: "Pop",
        zOrder: UILayer.Pop,
        singleton: true,
        autoDestroy: true,
        controllerClass: BattleDefeatViewController,
    },

    "BagUI": {
        path: "ui/bag/bagUI.ls",
        // 背包是主界面内页，不是覆盖 HUD/底部导航的弹窗。
        layerName: "MainContent",
        zOrder: UILayer.MainContent,
        singleton: true,
        autoDestroy: false,
        mutex: ["ShopUI", "SkillUI"],
        controllerClass: BagViewController,
    },

    "SettingsUI": {
        path: "ui/settings/SettingsUI.ls",
        layerName: "MainContent",
        zOrder: UILayer.MainContent,
        singleton: true,
        autoDestroy: false,
        mutex: ["BagUI", "ShopUI", "SkillUI"],
        controllerClass: SettingsViewController,
    },

    "ShopUI": {
        path: "ui/shop/shopUI.ls",
        layerName: "UIWindow",
        zOrder: UILayer.UIWindow,
        singleton: true,
        autoDestroy: false,
        mutex: ["BagUI", "SkillUI"],
    },

    "CommonDialog": {
        path: "ui/dialog/commonDialog.ls",
        layerName: "TipWindow",
        zOrder: UILayer.Pop,
        singleton: true,
        autoDestroy: true,
        enterAnim: true,
    },

    "RewardTips": {
        path: "ui/tips/rewardTips.ls",
        layerName: "UpTipWindow",
        zOrder: UILayer.UpTipWindow,
        singleton: false,
        autoDestroy: true,
        enterAnim: true,
    },

};
