import { UILayer } from "../core/LayerDef";

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
        singleton: true,
        autoDestroy: false,
    },

    "BagUI": {
        path: "ui/bag/bagUI.ls",
        layerName: "UIWindow",
        zOrder: UILayer.UIWindow,
        singleton: true,
        autoDestroy: false,
        mutex: ["ShopUI", "SkillUI"],
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

    "LoadingUI": {
        path: "ui/loading/loadingUI.ls",
        layerName: "Top",
        zOrder: UILayer.Top,
        singleton: true,
        autoDestroy: true,
    },
};
