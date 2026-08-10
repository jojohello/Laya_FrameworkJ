# Sound 音乐播放

`sound` 是客户端音频播放封装模块（Start 层），负责背景音乐与特效音效的播放、音量/静音持久化和后台/前台生命周期。

## 入口

- `MusicMgr`：唯一公开入口，由 `StartMain` 早期 `init()`，通过 `window.musicMgr` 暴露，Logic 经 `App.musicMgr` 桥接。

`MusicMgr` 已在 StartMain 初始化并通过 `window.musicMgr` 暴露，`App.musicMgr` 提供 Logic 侧桥接。

## 使用

背景音乐：

```ts
MusicMgr.instance.playMusic("audio/bgm/main.mp3", 0); // 0 表示无限循环
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
MusicMgr.instance.playSound("audio/sfx/explode.mp3");
MusicMgr.instance.stopAllSounds();
MusicMgr.instance.setSoundVolume(0.9);
```

音量与静音设置自动从本地缓存读取并在变更时保存。

Logic 侧经桥接访问（避免静态导入 Start 实现）：

```ts
App.musicMgr.playMusic("audio/bgm/main.mp3", 0);
App.musicMgr.playSound("audio/sfx/explode.mp3");
```

`MusicMgr.playMusic(url, loops, startTime, onDurationElapsed?)` 的单次播放计时不使用
Laya 播放完成回调：流式音频元数据就绪后读取 `SoundChannel.duration`，结合
`position` 计算剩余时间。计时到点会复核真实播放位置，加载或调度延迟不会提前
切歌；进入后台时取消计时，回到前台后按剩余播放位置重建。`getMusicDuration()`
可读取当前已就绪的音乐总时长（秒），元数据尚未就绪时返回 0。

普通场景随机 BGM 与战斗 BGM 状态已合入 `MusicMgr`，Logic 场景经 `App.musicMgr`
调用 `playGameplay()` / `playBattle(url)`，不再维护独立的 `BgmMgr`。

v1 已实现：背景音乐/音效分流、独立音量/静音与持久化、叠加上限、每 URL 限频、音量钳制、后台/前台暂停恢复。iOS 音频实例复用池仍按 DESIGN 留待真机验证阶段。

稳定设计、音频后端机制与 iOS 音效卡顿待验证项见 [DESIGN.md](DESIGN.md)。
