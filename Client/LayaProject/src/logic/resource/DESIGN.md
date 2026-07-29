# Resource 模块设计

本文件作用于 `src/logic/resource/`，继承外层 DESIGN。

## 职责边界

- `ResourceMgr` 是模块唯一服务入口，负责引用计数、包装实例池、加载队列和延迟卸载。
- `ResBase` 表示一次可复用的运行时实例；它不是底层 Laya 资源本身。
- `ResBaseProxy` 隔离不同资源类型的底层加载和清理方式。
- `ResourceInfo` 保存 URL 级引用和加载状态；业务模块不得直接修改。

## 双层生命周期

资源分为两层，回收时不能混为一谈：

1. `ResBase` 实例层：`recoverRes()` 调用 `onRecycle()` 后进入对象池；超过池上限时调用 `onDispose()`。
2. Laya 底层资源层：URL 引用为 0、实例池清空且超过缓存期后，才由对应 Proxy 或 `Laya.loader.clearRes()` 卸载。

`load()/recoverRes()` 与 `loadContent()/releaseRef()` 必须分别成对。引用降到 0 才开始缓存计时，不能出现负引用；新增调用路径时应验证异常和提前返回也会释放。

## 并发与扩展

- 同一 URL 首次加载时标记为 `LOADING`，后续包装实例加入等待队列，避免重复触发底层加载。
- 加载失败必须恢复为 `UNLOAD` 并清理等待队列，不能留下永久等待状态。
- 特殊类型通过 Proxy 扩展，不在 `ResourceMgr` 中堆叠类型判断。
- `onRecycle()` 只清理运行状态、事件和父节点，保留可复用对象；`onDispose()` 才彻底销毁。

## 高频错误防范

- 不要缓存已回收的 `ResBase` 引用并继续使用。
- 不要只调用 `Laya.loader.clearRes()` 而遗漏池中实例，也不要只清实例而永久保留底层资源。
- 运行时 URL 不带 `assets/` 前缀。
- LayaAir 3.3 标准帧动画资源使用“一张 PNG + `.atlas`”；传给 `Laya.Animation.images` 的是 atlas 已缓存的子纹理 URL，不是未描述的大图网格坐标。
- atlas 的帧键与运行时子纹理 URL 必须带 `.png` 等受支持后缀。`Loader.cacheRes()` 依赖后缀确定类型；无后缀帧不会进入缓存，并会连续触发 `unsupported suffix` 与 `DrawTextureCmd sourceWidth` 空引用。
- 修改清理逻辑时验证：并发加载、池复用、超上限销毁、缓存到期卸载、Manager reset/release。

## 帧动画动作信息

- `ResFrameAnimation` 的实例动作表只管理动作名、包含首尾的逻辑帧范围和一次播放时长。`CharacterAnimation.durationMs` 在配置适配边界转换为秒；运行时不得再根据帧数或独立 interval 推导技能时长。
- 基础帧与 mask 帧共用同一套逻辑帧索引。动作播放时只截取 `[startFrameIndex, endFrameIndex]`；角色队伍色动画的两张纹理必须在每个逻辑索引上成对存在，普通无染色特效可以省略 mask 帧。
- `play(actionName, ...)` 成功时返回对应动作的运行时时长，动作不存在或资源未就绪时必须返回可明确区分的失败结果。Gameplay 只使用返回时长和统一逻辑 `curTime` 计算结束时间，不监听动画播放完成回调。
- Realtime 大步长补处理延迟动作时，动画进度与结束时间以原计划触发时间为起点，不得以补处理发生的当前帧时间重新开始；渲染可以直接显示该逻辑时间对应的最新帧。
