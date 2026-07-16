# 通用模态弹窗

`DialogMgr` 是项目统一的确认弹窗入口，资源为 `assets/ui/dialog/commonDialog.ls`。

## 使用

```ts
await DialogMgr.instance.show({
    title: "提示",
    message: "是否继续？",
    confirmText: "确定",
    cancelText: "取消",
    onConfirm: () => { /* 确定逻辑 */ },
    onCancel: () => { /* 取消逻辑 */ },
    onClose: () => { /* 关闭逻辑 */ },
});
```

`cancelText` 不传时为“仅确定”样式；传入后为“确定/取消”样式。资源中的 `dialogButtons` Controller 负责两个页面，`cancelButton` 通过 GearDisplay 在第二页显示。标题、正文、确定、取消和关闭按钮均为 `commonDialog.ls` 中的资源节点；管理器只负责填充文本和绑定函数回调。

取消按钮的 `visible` 同时由 Controller 和 `DialogMgr` 同步：Controller 负责编辑器预览和资源状态，管理器显式设置运行时状态，避免不同 LayaAir 版本对 GearDisplay 反序列化差异导致布局失效。

弹窗由 `UIManager` 挂载到 `GRoot`，使用 `UILayer.Pop=300`，资源中的 `modalMask` 阻止底层点击。

`DialogMgr.close()` 可用于业务状态完成、重连或模块重置时关闭当前弹窗，并统一回调 `onClosed(false)`；按钮点击产生的关闭只回调一次。同一时间只允许存在一个活动弹窗。
# 本轮制作经验

- 完整弹窗使用 `.ls`，可复用的按钮或面板才抽成 `.lh`；页面层级、遮罩和 Controller 放在页面资源中，业务文字与回调由 `DialogMgr` 注入。
- `GButton` 的文字不是按钮本身的可靠接口，按钮内部需要有明确命名的文本节点；运行时通过节点名填充文字并绑定回调。
- Controller 的页面值使用页面索引，`GearDisplay.pages` 使用数字数组；两者不要混用，否则编辑器能预览、运行时却可能不切页。
- 仅给 `GBox` 设置透明度不一定会产生可见的填充遮罩；弹窗管理器补充原生绘制的半透明层，同时拦截鼠标输入，保证弹窗打开后底层不可点击。
- 图片四周的透明空边会让按钮或关闭图标看起来偏小。先检查 alpha 边界并裁剪，再调整节点尺寸；不要一开始就放大整个弹窗布局。
- 取消按钮是可点击的次要操作时使用青色等 active 资源；灰色应保留给 disabled 状态。
- 反馈迭代时保留用户在 IDE 中增加的 relation 和 Controller 编辑结果，只修改明确负责的节点，避免用大范围 JSON 替换覆盖布局。
