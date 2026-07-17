/**
 * 场景类型枚举
 * 与 SceneType.json 配置表的 ID 字段绑定
 * 
 * 使用方式：
 * ```typescript
 * import { SceneType } from "./SceneType";
 * 
 * // 进入主场景
 * SceneMgr.instance.switchScene(SceneType.MainScene);
 * ```
 */
export enum SceneType {
    /** 主场景（ID=1） */
    MainScene = 1,

    /** 征战关卡选择场景（ID=2） */
    BattleStageScene = 2,

    /** 第一关实际战斗场景（ID=3） */
    BattleScene = 3,
}
