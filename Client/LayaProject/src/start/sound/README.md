# Sound 音乐播放

`sound` 是客户端音频播放封装模块（Start 层），负责背景音乐与特效音效的播放、音量/静音持久化和后台/前台生命周期。

## 入口

- `MusicMgr`：唯一公开入口，由 `StartMain` 早期 `init()`，通过 `window.musicMgr` 暴露，Logic 经 `App.musicMgr` 桥接。

`MusicMgr` 已在 StartMain 初始化并通过 `window.musicMgr` 暴露，`App.musicMgr` 提供 Logic 侧桥接。

## 使用

背景音乐：

```ts
MusicMgr.instance.playMusic("music/bg_1.mp3", 0); // 0 表示无限循环
MusicMgr.instance.stopMusic();
MusicMgr.instance.setMusicVolume(0.8);
```

进入游戏后的背景音乐调度也使用同一入口：

```ts
MusicMgr.instance.playGameplay();        // 普通 BGM 随机单次播放，曲间停 5-10 秒
MusicMgr.instance.playBattle(battleUrl); // 战斗 BGM 无限循环
```

登录页固定循环播放普通背景音乐 `music/bg_1.mp3`，由 `StartMain.start()`
打开登录场景后调用 `MusicMgr.instance.playMusic("music/bg_1.mp3", 0)`。
该 URL 属于远端 `music` 子包。`StartMain` 会先注册包清单与远程 URL 映射，但不
通过 Loader 预加载 MP3。微信小游戏由 `WechatStreamingMusicChannel` 调用
`Laya.URL.formatURL`/`postFormatURL`，把逻辑路径转换成带版本哈希的最终远程 URL
后直接赋给 `wx.createInnerAudioContext().src`；其他平台继续使用 Laya 长音频通道。

特效音效：

```ts
MusicMgr.instance.playSound("sound/Fireball_explosion.mp3");
MusicMgr.instance.stopAllSounds();
MusicMgr.instance.setSoundVolume(0.9);
```

登录按钮使用 `MusicMgr.instance.playSound("sound/click.mp3")`。`sound` 是远程资源包，
`StartMain` 会在打开登录场景前先通过 `loadPackage` 注册其 fileconfig/URL 映射；这使
微信小游戏能够把逻辑路径解析为带版本哈希的远程文件，同时让首次播放仍发生在
按钮的用户 `CLICK` 手势内。注册失败只降级为无点击音效，不阻断登录流程。

音量与静音设置自动从本地缓存读取并在变更时保存。公开音量值仍为线性的滑杆位置
`0..1`，`MusicMgr` 在输出到引擎时统一转换为平方增益，使低中音量区的听感变化更均匀；
调用方不需要自行换算。
启动阶段即使缓存状态为音乐静音，`MusicMgr` 也会保留当前场景请求的音乐 URL、循环
方式和单次播放回调；解除音乐静音或总静音后，如果当时没有音乐通道，会立即启动该
场景原本应播放的音乐。已有静音通道则只恢复输出，不重复创建。

Logic 侧经桥接访问（避免静态导入 Start 实现）：

```ts
App.musicMgr.playMusic("music/bg_1.mp3", 0);
App.musicMgr.playSound("sound/Fireball_explosion.mp3");
```

`MusicMgr.playMusic(url, loops, startTime, onDurationElapsed?)` 的单次播放计时不使用
Laya 播放完成回调：流式音频元数据就绪后读取 `SoundChannel.duration`，结合
`position` 计算剩余时间。计时到点会复核真实播放位置，加载或调度延迟不会提前
切歌；进入后台时取消计时，回到前台后按剩余播放位置重建。`getMusicDuration()`
可读取当前已就绪的音乐总时长（秒），元数据尚未就绪时返回 0。

普通场景随机 BGM 与战斗 BGM 状态已合入 `MusicMgr`，Logic 场景经 `App.musicMgr`
调用 `playGameplay()` / `playBattle(url)`，不再维护独立的 `BgmMgr`。

当前公共版本已完成并验收：背景音乐/音效分流、独立音量/静音与持久化、感知音量平方曲线、音乐静音后恢复播放、音效静音时停止活动短音效、微信 8 路短音效预算（非微信保持 12 路）、每 URL 活动准入与限频、单音效音量钳制、停止时幂等计数释放、后台/前台暂停恢复，以及登录、通用按钮、主场景、战斗和技能 Action 的统一音频接入。

稳定设计、音频后端机制和当前版本的高频音效约束见 [DESIGN.md](DESIGN.md)。
