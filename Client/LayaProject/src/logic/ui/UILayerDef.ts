/**
 * UI 层级定义
 * 
 * 层级定义已统一到 LayerDef.ts 管理
 * 此文件仅作为导入桥接，便于现有代码迁移
 * 
 * @see src/logic/core/LayerDef.ts - 全局层级定义（Scene + UI 统一管理）
 */

// 重新导出 LayerDef 中的层级定义
export { UILayer, GlobalLayer, SceneLayer, LayerNames, getLayerName } from "../core/LayerDef";
