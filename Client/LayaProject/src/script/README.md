# Script 目录使用说明

## 概述

`src/script/` 目录用于存放可挂载到 Laya Sprite 节点上的脚本组件。这些脚本继承自 `Laya.Script`，可以在 Laya 编辑器中直接挂载到节点上，实现各种功能。

## 现有脚本组件

### LockRatio.ts - 图片等比缩放脚本

**功能**: 自动检测屏幕尺寸变化，让 Image 组件的宽度适配屏幕宽度，高度按原始尺寸比例自动调整。

**使用方法**:

1. **在代码中使用**:
```typescript
// 创建Image节点并设置原始尺寸
let image = new Laya.Image();
image.width = 400;
image.height = 600;
image.skin = "图片路径";

// 添加脚本组件
let script = image.addComponent(LockRatio);

// 手动刷新尺寸
script._refreshSize();

// 重新设置原始尺寸
script._setOriginalSize(500, 750);

// 获取原始尺寸
let size = script._getOriginalSize();
console.log(`原始尺寸: ${size.width}x${size.height}`);
```

2. **在Laya编辑器中使用**:
   - 选择Image节点（必须是Image类型）
   - 确保已设置初始宽高或加载纹理
   - 添加"LockRatio"组件
   - 脚本自动生效

**特性**:
- ✅ **扁平化设计**: 简化的代码结构，易于维护
- ✅ **集中化处理**: 统一的尺寸管理逻辑
- ✅ **自动适配**: 监听屏幕变化，实时缩放
- ✅ **智能缓存**: 优先使用设置尺寸，备选纹理尺寸
- ✅ **严格检查**: 确保挂载在正确节点类型
- ✅ **简洁接口**: 提供必要的公共方法

**公共接口**:
- `_refreshSize()` - 手动刷新尺寸
- `_setOriginalSize(width, height)` - 重新设置原始尺寸
- `_getOriginalSize()` - 获取原始尺寸信息

**工作流程**:
1. `onAwake` → 验证节点类型 → 缓存原始尺寸
2. `onEnable` → 监听屏幕变化 → 执行初始缩放
3. 屏幕变化 → 计算缩放比例 → 应用新尺寸

**代码规范**:
- 所有成员变量和方法使用 `_` 前缀（符合项目规范）
- 扁平化方法结构，减少嵌套
- 集中化的尺寸处理逻辑
- 简化的错误处理和日志输出

**注意事项**:
- 仅支持直接挂载在 `Laya.Image` 节点上
- 确保Image有有效的初始尺寸
- 支持纹理异步加载场景

## 如何创建新的脚本组件

1. **创建脚本文件**:
```typescript
const { regClass, property } = Laya;

@regClass()
export class YourScriptName extends Laya.Script {
    declare owner: Laya.Sprite; // 声明挂载的节点类型
    
    @property(String)
    public yourProperty: string = "";
    
    onAwake(): void {
        // 组件初始化
    }
    
    onEnable(): void {
        // 组件启用时
    }
    
    onDisable(): void {
        // 组件禁用时
    }
    
    onDestroy(): void {
        // 组件销毁时
    }
}
```

2. **注册脚本** (如果需要):
在 Main.ts 或其他入口文件中导入脚本，确保被正确注册。

3. **使用脚本**:
通过代码 `addComponent()` 或在编辑器中添加组件。

## 脚本开发最佳实践

1. **命名规范**: 使用 PascalCase，以功能描述命名
2. **资源管理**: 在 onDestroy 中清理资源和事件监听
3. **错误处理**: 添加适当的错误检查和警告日志
4. **性能考虑**: 避免在 onUpdate 中执行重计算
5. **类型声明**: 正确声明 owner 的类型
6. **属性暴露**: 使用 @property 装饰器暴露可配置属性

## 调试技巧

- 使用 `console.log()` 输出调试信息
- 在关键生命周期方法中添加日志
- 检查组件是否正确挂载和初始化
- 验证事件监听是否正常添加和移除
