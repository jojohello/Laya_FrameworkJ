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

常用调试与配置入口：`getRefInfo()`、`getCacheCount()`、`setCacheTime()`、`setPoolLimit()`。默认缓存时间为 30 秒，每个 URL 最多缓存 3 个包装实例。

新增可池化资源类型时继承 `ResBase`，实现 `buildRes()`、`onRecycle()` 和 `onDispose()`；特殊加载或卸载方式通过 `ResBaseProxy` 扩展。

内部生命周期和并发规则见 [DESIGN.md](DESIGN.md)。

