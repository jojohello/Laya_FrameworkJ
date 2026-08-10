/**
 * jojohello 2025-06-27
 * App类，装载代码切分后，写在其他代码块中的模块
 */

// 使用 type-only import，避免将 Start 模块代码打包到 Logic 分包
import type { NetworkContext } from "../start/network/NetworkContext";
import type { LayerMgr } from "../start/utils/LayerMgr";
import type { MyGameConfigSnapshot } from "../start/MyGameConfig";
import type { ScreenAdapter } from "../start/screen/ScreenAdapter";
import * as MessageIds from "./common/MessageIds";
import { ItemMgr } from "./item/ItemMgr";
import { BagMgr } from "./item/BagMgr";
import { LoadingService, SceneMgr } from "./scene/SceneMgr";
import { SkillMgr } from "./skill/SkillMgr";

export class App {
    // ========== 基础服务 ==========
    // 事件发射器
    static eventDispatcher: Laya.EventDispatcher;

    // Layer 管理器
    static layerMgr: LayerMgr;

    // 网络上下文（从 window 获取）
    static network: NetworkContext;

    // ========== Manager 访问 ==========
    // NetworkManager（从 window 获取）
    static networkManager: any;

    // LoginMgr（从 window 获取）
    static loginMgr: any;

    static systemProtocol: any;
    static loadingMgr: LoadingService;
    static musicMgr: any;
    static gameConfig: Readonly<MyGameConfigSnapshot>;
    static screenAdapter: ScreenAdapter;

    // SceneMgr（Logic 分包，直接导入）
    static sceneMgr: SceneMgr;

    // SkillMgr（Logic 分包，直接导入）
    static skillMgr: SkillMgr;

    // ItemMgr（Logic 分包，直接导入）
    static itemMgr: ItemMgr;

    static bagMgr: BagMgr;

    // ========== MessageIds 访问 ==========
    /**
     * 消息ID（直接从 Logic 包导入）
     *
     * 使用方式：
     * ```typescript
     * import { App } from "./App";
     *
     * const msgId = App.MessageIds.LOGIN_SUCCESS;
     * ```
     */
    static MessageIds: typeof MessageIds;

    static init() {
        // 获取基础服务
        this.eventDispatcher = (Laya.Browser.window as any).eventDispatcher;
        this.layerMgr = (Laya.Browser.window as any).LayerMgr;
        this.network = (Laya.Browser.window as any).network;

        // 获取 Manager 实例
        this.networkManager = (Laya.Browser.window as any).networkManager;
        this.loginMgr = (Laya.Browser.window as any).loginMgr;
        this.systemProtocol = (Laya.Browser.window as any).systemProtocol;
        this.loadingMgr = (Laya.Browser.window as any).loadingMgr as LoadingService;
        this.musicMgr = (Laya.Browser.window as any).musicMgr;
        this.gameConfig = (Laya.Browser.window as any).myGameConfig as Readonly<MyGameConfigSnapshot>;
        if (!this.gameConfig) throw new Error("MyGameConfig 尚未由 Start 发布");
        this.screenAdapter = (Laya.Browser.window as any).screenAdapter as ScreenAdapter;
        if (!this.screenAdapter) throw new Error("ScreenAdapter 尚未由 Start 发布");

        // Logic 分包的 Manager（直接导入单例）
        this.sceneMgr = SceneMgr.instance;
        this.skillMgr = SkillMgr.instance;
        this.itemMgr = ItemMgr.instance;
        this.bagMgr = BagMgr.instance;

        // 直接使用 Logic 包的 MessageIds（不从 window 获取）
        this.MessageIds = MessageIds;
    }
}
