# Resource 资源模块

`ResourceMgr` 是模块入口，统一管理 Laya 资源引用、`ResBase` 实例池和延迟卸载。它在 `LogicMain.ts` 中注册到 `ManagerHub`。

## 使用

加载可池化的资源包装对象：

```typescript
const image = await ResourceMgr.instance.load(url, ResImage);
image.setParent(parent);

// 不再使用时必须成对回收
ResourceMgr.instance.recoverRes(image);
```

加载 UI、Scene 等不使用 `ResBase` 包装的内容：

```typescript
const content = await ResourceMgr.instance.loadContent(url);
ResourceMgr.instance.releaseRef(url);
```

常用调试与配置入口：`getRefInfo()`、`getCacheCount()`、`setCacheDurationMs()`、`setPoolLimit()`。默认缓存时间为 30 秒，每个 URL 最多缓存 3 个包装实例。

新增可池化资源类型时继承 `ResBase`，实现 `buildRes()`、`onRecycle()` 和 `onDispose()`；特殊加载或卸载方式通过 `ResBaseProxy` 扩展。

`ResFrameAnimation` 用于 LayaAir 标准图集帧动画。正式资源是单张 PNG 加同名 `.atlas`；动作只保存名称、包含首尾的逻辑帧范围和总播放时长。角色的基础帧与 mask 帧通过同一逻辑索引映射；不需要队伍染色的受击、恢复等表现可省略 mask 帧。该包装类负责播放、按统一场景逻辑时间定位帧、帧纹理通知和对象池复用，底层 atlas 仍由默认 Proxy 加载。`play(actionName, startTime, curTime, ...)` 成功时返回一轮动作时长（秒），失败返回 `-1`；Gameplay 不监听动画完成回调。

内部生命周期和并发规则见 [DESIGN.md](DESIGN.md)。
