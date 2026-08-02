/**
 * 全局层级定义
 * 统一管理 Scene 层级和 UI 层级，确保渲染顺序正确
 * 
 * 层级架构（从下到上，zOrder 从小到大）：
 * ┌────────────────────────────────────────────────────────────────┐
 * │ Loading (700) - Loading/断线重连/过场动画                        │ ← 最高
 * │ UpTip (600) - 系统提示/强制公告                                   │
 * │ Login (500) - 登录界面/启动界面                                   │
 * │ === UI 层级区域 ===                                             │
 * │ Tips (400) - 飘字/Toast/奖励提示                                 │
 * │ Pop (300) - 模态弹窗/确认框                                       │
 * │ Window (200) - 弹出的界面窗口                                     │
 * │ MainUI (100) - 主界面 HUD、底部导航等跨页面壳层                  │
 * │ MainContent (90) - 主界面内页内容（背包、征战等）                │
 * │ === Scene 层级区域 ===                                           │
 * │ AboveScene (30) - 场景上层/血条/调试显示                          │
 * │ Scene (10) - 主场景层/地表/物件/角色/子弹/特效                     │
 * │ BelowScene (1) - 场景下层/背景/天空盒                              │ ← 最底层
 * └────────────────────────────────────────────────────────────────┘
 */

/**
 * 全局层级枚举
 * 值越大越在顶层
 */
export enum GlobalLayer {
    // === Scene 层级区域 ===
    BelowScene = 1,     // 背景层（天空盒、远景）
    Scene = 10,         // 主场景层（地表、物件、角色、子弹、特效）
    AboveScene = 30,    // 场景上层（血条、调试显示）

    // === UI 层级区域 ===
    MainContent = 90,   // 主界面内页内容；必须让 MainUI 壳层保持可见且可点
    MainUI = 100,       // 主界面 HUD 与底部导航等跨页面壳层
    UIWindow = 200,     // 弹出的界面窗口（背包、商店）
    TipWindow = 400,    // 非模态提示（飘字、Toast）

    // === 系统/启动层 ===
    Login = 500,        // 登录界面
    UpTipWindow = 600,  // 系统提示（强制公告）
    Top = 700,          // Loading/断线重连（最高）
}

/**
 * UI 层级（供 UIManager 使用）
 * 映射到 GlobalLayer 的 UI 区域
 */
export enum UILayer {
    Pop = 300,
    MainContent = GlobalLayer.MainContent,
    MainUI = GlobalLayer.MainUI,          // 100
    UIWindow = GlobalLayer.UIWindow,      // 200
    TipWindow = GlobalLayer.TipWindow,    // 400
    Login = GlobalLayer.Login,            // 500
    UpTipWindow = GlobalLayer.UpTipWindow,// 600
    Top = GlobalLayer.Top,                // 700
}

/**
 * Scene 层级（供 SceneMgr 使用）
 * 映射到 GlobalLayer 的 Scene 区域
 */
export enum SceneLayer {
    BelowScene = GlobalLayer.BelowScene, // 1
    Scene = GlobalLayer.Scene,           // 10
    AboveScene = GlobalLayer.AboveScene, // 30
}

/**
 * 层级名称映射（用于调试和日志）
 */
export const LayerNames: { [key: number]: string } = {
    [GlobalLayer.BelowScene]: "BelowScene",
    [GlobalLayer.Scene]: "Scene",
    [GlobalLayer.AboveScene]: "AboveScene",
    [GlobalLayer.MainContent]: "MainContent",
    [GlobalLayer.MainUI]: "MainUI",
    [UILayer.Pop]: "Pop",
    [GlobalLayer.UIWindow]: "UIWindow",
    [GlobalLayer.TipWindow]: "TipWindow",
    [GlobalLayer.Login]: "Login",
    [GlobalLayer.UpTipWindow]: "UpTipWindow",
    [GlobalLayer.Top]: "Top",
};

/**
 * 获取层级名称
 */
export function getLayerName(zOrder: number): string {
    return LayerNames[zOrder] || `UnknownLayer(${zOrder})`;
}
