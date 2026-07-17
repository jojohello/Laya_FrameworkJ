/**
 * 场景配置表
 * 定义场景与 UI 的绑定关系
 * 
 * 注意：场景配置已迁移到 SceneType.json 配置表，通过 ConfigMgr 读取。
 * 此文件仅保留 SceneConfig 接口定义。
 */

/**
 * 场景配置结构
 * 
 * 对应 SceneType.json 配置表字段：
 * - sceneClass: 场景类名（需要通过 @regClass 注册）
 * - map: 地图资源路径（为空则不加载地图）
 * - mapType: 地图类型（image/tilemap，可选，不填时按路径后缀推断）
 * - uiName: UI 名称（对应 UIConfigTable 中的名称）
 * - cache: 是否缓存场景（1=缓存，0=不缓存）
 * - desc: 场景描述
 */
export interface SceneConfig {
    /** 场景类名（需要通过 @regClass 注册） */
    sceneClass: string;

    /** 地图资源路径（不要带 assets/ 前缀） */
    map?: string;

    /** 地图类型：image / tilemap */
    mapType?: string;
    /** 关卡选择场景使用的完整大关 prefab（底图与节点） */
    stagePrefab?: string;

    /** 单图地图宽度或 TileMap 逻辑宽度（像素） */
    mapWidth?: number;

    /** 单图地图高度或 TileMap 逻辑高度（像素） */
    mapHeight?: number;

    /** Tile 宽度 */
    tileWidth?: number;

    /** Tile 高度 */
    tileHeight?: number;

    /** TileMap 是否启用线性采样 */
    enableLinear?: boolean | number;

    /** TileMap 是否限制显示范围 */
    limitRange?: boolean | number;

    /** 关联的 UI 名称（在 UIConfigTable 中注册的） */
    uiName?: string;

    /** 是否缓存场景（关闭后不销毁） */
    cache?: boolean;

    /** 场景描述 */
    desc?: string;
}

/**
 * SceneConfigTable 常量已弃用
 * 
 * 场景配置已迁移到 SceneType.json 配置表，通过 ConfigMgr 读取。
 * 使用方式：
 * ```typescript
 * const allConfigs = ConfigMgr.instance.getAll("SceneType");
 * const config = allConfigs.find(c => c.name === "MainScene");
 * ```
 * 
 * 保留此注释仅供参考，如需恢复代码定义的配置表，可取消下方注释。
 */

// ========== 弃用的代码定义配置表（已迁移到 SceneType.json）==========
// export const SceneConfigTable: { [name: string]: SceneConfig } = {
//     "LoginScene": { sceneClass: "LoginScene", uiName: "LoginView", cache: false, desc: "登录场景" },
//     "MainScene": { sceneClass: "MainScene", uiName: "MainUI", cache: true, desc: "游戏主场景" },
//     "BattleScene": { sceneClass: "BattleScene", uiName: "BattleUI", cache: false, desc: "战斗场景" }
// };
