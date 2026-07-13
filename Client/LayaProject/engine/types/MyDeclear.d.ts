// 全局类型声明文件
// 定义App命名空间，包含自定义全局对象
declare class LayerMgr {
    static readonly BelowScene: number;
    static readonly Scene: number;
    static readonly AboveScene: number;
    static readonly MainUI: number;
    static readonly UIWindow: number;
    static readonly TipWindow: number;
    static readonly Top: number;
    static layers: { [key: string]: Laya.Sprite };
    static scene: Laya.Scene;
    static init(): void;
    static setLayer(child: Laya.Sprite, layerName: string): void;
}

// MessageIds 类型声明
declare namespace MessageIds {
    // 认证类 (1xxx)
    export const AUTH: 1001;
    export const AUTH_SUCCESS: 1002;
    export const AUTH_FAILED: 1003;

    // 心跳类 (2xxx)
    export const HEARTBEAT: 2001;
    export const HEARTBEAT_RESPONSE: 2002;

    // 游戏逻辑类 (3xxx)
    export const LOGIN: 3001;
    export const LOGIN_SUCCESS: 3002;
    export const LOGIN_FAILED: 3003;
    export const GET_PLAYER_INFO: 3010;
    export const PLAYER_INFO: 3011;

    // 系统类 (9xxx)
    export const ERROR: 9001;
    export const NOTIFICATION: 9002;
    export const KICK: 9004;

    // 工具函数
    export function getMessageName(id: number): string;
    export function getMessageId(name: string): number | null;
    export function isValidMessageId(id: number): boolean;
}

// 扩展Laya.Browser.window的类型定义
declare namespace Laya {
    interface Browser {
        window: Window & {
            LayerMgr?: typeof LayerMgr;
            eventDispatcher?: Laya.EventDispatcher;
            network?: any; // NetworkContext 类型（避免循环依赖，使用 any）
            startMain?: any; // StartMain 类型
            logicMain?: any; // LogicMain 类型

            // ========== 新增：Manager 和 MessageIds 类型 ==========
            MessageIds?: typeof MessageIds;
            networkManager?: any; // NetworkManager 类型
            loginMgr?: any; // LoginMgr 类型
        };
    }
}
