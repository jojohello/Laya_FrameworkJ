// jojohello 2025-10-30
// 游戏逻辑主入口
// 2025-12-10 重构：使用 ManagerHub 新架构
// 2025-12-11 修复：Logic 模块不直接 import Start 模块的类
// 2025-01-21 新增：ResourceTestScene 测试入口

import { App } from "./App";
import { ManagerHub } from "./core/ManagerHub";
import { ResourceMgr } from "./resource/ResourceMgr";
import { UIManager } from "./ui/UIManager";
import { SceneMgr } from "./scene/SceneMgr";
import { SkillMgr } from "./skill/SkillMgr";
import { ItemMgr } from "./item/ItemMgr";
import { BagMgr } from "./item/BagMgr";
import { ConfigMgr } from "./config/ConfigMgr";
import { FunctionOpenMgr } from "./functionOpen/FunctionOpenMgr";
import { PlayerMgr } from "./player/PlayerMgr";
import { WalletMgr } from "./wallet/WalletMgr";
import { DialogMgr } from "./ui/dialog/DialogMgr";
import { GuideMgr } from "./guide/GuideMgr";
import { GuideCommandRegistry } from "./guide/GuideCommandRegistry";

// 导入场景类并注册到 window（供 SceneMgr 动态创建）
import { MainScene } from "./mainScene/MainScene";
import { BattleScene, BattleStageScene } from "./battleScene/BattleScene";
import { CharacterSceneObj } from "./sceneObj/CharacterSceneObj";



/**
 * 游戏逻辑主类
 *
 * 负责初始化和启动游戏逻辑模块
 *
 * 架构说明：
 * - NetworkManager 和 LoginMgr 应该在 Start 模块中注册到 ManagerHub
 * - Logic 模块不直接 import Start 模块的类，避免分包依赖问题
 * - Logic 模块通过 ManagerHub.getManager() 访问这些 Manager
 */
export class LogicMain {
    constructor() {
        // 空构造
    }

    /**
     * 初始化游戏逻辑
     */
    async init(): Promise<void> {
        // 1. 初始化App（获取window上的共享对象）
        App.init();

        // 1.5 注册场景类到 window（供 SceneMgr 动态创建）
        (Laya.Browser.window as any).MainScene = MainScene;
        (Laya.Browser.window as any).BattleStageScene = BattleStageScene;
        (Laya.Browser.window as any).BattleScene = BattleScene;
        // SceneObj is created by the stable short name stored in battle code/config.
        // @regClass binds the editor resource identity, so register the runtime lookup key explicitly.
        Laya.ClassUtils.regClass("CharacterSceneObj", CharacterSceneObj);

        // 2. 初始化配置管理器（必须在其他 Manager 之前完成）
        await ConfigMgr.instance.init();

        // 3. 注册 Logic 模块的 Manager
        ManagerHub.instance.register(ResourceMgr.instance);
        ManagerHub.instance.register(SkillMgr.instance);
        ManagerHub.instance.register(ItemMgr.instance);
        ManagerHub.instance.register(BagMgr.instance);
        ManagerHub.instance.register(FunctionOpenMgr.instance);
        ManagerHub.instance.register(PlayerMgr.instance);
        ManagerHub.instance.register(WalletMgr.instance);
        ManagerHub.instance.register(SceneMgr.instance);  // 场景管理器
        ManagerHub.instance.register(UIManager.instance);
        ManagerHub.instance.register(DialogMgr.instance);
        GuideCommandRegistry.instance.register("player.levelUp", () => PlayerMgr.instance.levelUp());
        ManagerHub.instance.register(GuideMgr.instance);


        // 4. 初始化所有 Manager
        await ManagerHub.instance.init();

        // 6. 将 SceneMgr 注入到 window，让 Start 分包可以访问
        (Laya.Browser.window as any).sceneMgr = SceneMgr.instance;

        // 6. 启动 ManagerHub 的 update 循环
        Laya.timer.clear(this, this.updateManagers);
        Laya.timer.frameLoop(1, this, this.updateManagers);
    }

    /**
     * 启动核心流程：连接Gateway → 登录
     */
    async startCoreFlow(): Promise<void> {
        try {
            // 1. 连接Gateway
            const gatewayUrl = App.network.gatewayWsUrl || "ws://localhost:8082/ws/native";

            // ✅ 通过 App 访问 NetworkManager
            await App.networkManager.connect({
                url: gatewayUrl,
                connectTimeout: 10000,
                heartbeat: {
                    interval: 5000,
                    autoStart: true
                },
                reconnect: {
                    autoReconnect: true,
                    maxRetries: 5,
                    initialDelay: 2000,
                    maxDelay: 30000
                }
            });

            // 2. 登录到 Game Server
            const userId = App.network.userId || "guest_" + Date.now();
            App.loginMgr.onGameLoginSuccess = () => {
                FunctionOpenMgr.instance.requestFullState();
            };
            if (App.networkManager.reconnectManager) {
                App.networkManager.reconnectManager.onReconnected = () => {
                    void this.authenticateAndLogin(userId).catch((error: unknown) => {
                        console.error("[LogicMain] Reconnect authentication/login failed:", error);
                    });
                };
            }

            // Gateway 鉴权成功后才允许发送 Game Server 登录。
            await this.authenticateAndLogin(userId);

        } catch (error: any) {
            console.error("[LogicMain] ❌ 核心流程失败:", error);
            throw error;
        }
    }

    private async authenticateAndLogin(userId: string): Promise<void> {
        await App.systemProtocol.authenticate(userId, App.network.loginTimestamp, App.network.token);
        await App.loginMgr.loginToGame(userId);
    }

    /**
     * 释放资源
     */
    release() {
        // 停止 update 循环
        Laya.timer.clear(this, this.updateManagers);

        // 释放所有 Manager
        ManagerHub.instance.release();
    }

    private updateManagers(): void {
        const dt = Laya.timer.delta / 1000;
        ManagerHub.instance.update(dt);
    }
}
