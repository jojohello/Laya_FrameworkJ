# 音乐播放系统设计

本文件作用于 `src/start/sound/`，继承 `src/start/README.md`、`src/DESIGN.md` 与根目录 `DESIGN.md`。

## 为什么放在 Start 层

音频是平台级基础设施，底层直接对接微信小游戏的 `InnerAudioContext` / 平台 Audio 标签。它必须在 Logic 分包加载前就可用：

- 登录界面、Loading 界面（首包阶段）就需要背景音乐与点击音效。
- start 已有 `sdk/` 平台适配层，音频天然属于平台能力，不属于某个玩法模块。
- start 的跨包服务通过 `window` 暴露，Logic 用 `App` 桥接访问（`networkManager`、`loadingMgr` 同模式）。

因此 `MusicMgr` 放在 `src/start/sound/`，由 StartMain 早期初始化并通过 `window.musicMgr` 暴露，Logic 通过 `App.musicMgr` 桥接。

## 目标

以封装层统一背景音乐与特效音效的播放、音量与生命周期管理，屏蔽平台差异，并对高频音效叠加、后台/前台切换提供统一约束。全局背景音乐只有一个通道和一套调度状态，因此普通场景随机曲目、曲间间隔与战斗曲目切换也由 `MusicMgr` 统一持有，避免另一个 Manager 与底层通道分别维护状态。

## 对外入口

`MusicMgr` 是唯一公开入口。它不通过 Logic 的 `ManagerHub` 注册（start 层不使用 ManagerHub），而是由 StartMain 手动 `init()`，与 `NetworkManager`/`LoginMgr` 一致。调用方只依赖 `MusicMgr` 的公开方法，不直接调用 `Laya.SoundManager`。

背景音乐与特效音效使用两套独立接口与独立音量：

- 背景音乐底层：`playMusic(url, loops?)`、`stopMusic()`、`getMusicDuration()`、`getMusicVolume()`、`setMusicVolume(v)`。
- 背景音乐场景语义：`playGameplay()`、`playBattle(url)`。
- 特效音效：`playSound(url, options?)`、`stopSound(url?)`、`stopAllSounds()`、`getSoundVolume()`、`setSoundVolume(v)`。

## 分层与音频后端机制（关键）

- `MusicMgr`：公开入口、普通/战斗 BGM 调度、音量/静音、后台/前台、缓存上限与叠加限制。持有唯一背景音乐状态与音效通道计数。
- 底层 `Laya.SoundManager`：提供通道注册、唯一 BGM、音量与静音语义；非微信平台继续负责实际长音频后端。
- `WechatStreamingMusicChannel`：只负责微信 BGM，把 Laya 解析后的最终远程 URL 直接交给 `InnerAudioContext`，同时继承 `SoundChannel` 以保留 SoundManager 的通道语义。
- 微信小游戏后端（`laya.wxmini`）：`SoundManager._soundClass = Sound`，每次 `playSound` 都通过 `createSoundChannel(url, false)` → `new Sound(url)` → `wx.createInnerAudioContext()`。

**已从项目内 Laya 3.3 压缩源码确认的机制：**

1. `SoundManager.playSound(url)` 每次调用都新建一个 `SoundChannel`，底层新建一个微信 `InnerAudioContext` 实例，**没有同一 URL 的播放实例复用池**。
2. 微信背景音乐虽然走 `longAudioClass`，但 LayaAir 3.3 的 `MgInnerAudioChannel.onPlay` 会先调用 `Laya.loader.fetch(url, "filePath")`；远程 URL 随后由 `MgDownloader.downloadFile` 完整下载为临时文件，不能视为网络流式播放。
3. 非循环音效停止时，`SoundChannel.stop()` 会 `dispose()` 并销毁对应 `InnerAudioContext`。
4. `_channels` 只是当前活动通道集合（用于 `stopAll`/音量），不是复用池。

## 背景音乐：流播放

- 背景音乐是"大体量、长时间"的声音，使用流式播放降低内存占用，避免一次性解码整段音频到内存。
- 非微信平台通过 `SoundManager.useAudioMusic`（默认 `true`）让背景音乐走 Audio/平台长音频通道。
- 微信小游戏由 `WechatStreamingMusicChannel` 绕过 Laya 3.3 的 `fetch(..., "filePath")`。它必须先让 `loadPackage` 注册 `fileconfig.json`，再严格按 Loader 相同顺序调用 `Laya.URL.formatURL` 与 `postFormatURL`，把逻辑路径解析为包含远程基址和版本哈希的最终 URL；不得自行拼接 `name-hash.mp3`。
- 最终 HTTP(S) URL 直接赋给 `wx.createInnerAudioContext().src`，不调用 `Laya.loader.load`、`Laya.loader.fetch` 或 `wx.downloadFile` 预下载完整 MP3。
- 微信通道继承 `Laya.SoundChannel` 并标记为 music，以继续参加 `SoundManager` 的唯一背景音乐、`musicVolume`、`musicMuted` 与通道清理流程。
- 微信实际输出音量必须最终写入 `InnerAudioContext.volume`。项目仍由 `MusicMgr` 持有业务音量，再经 `SoundManager.musicVolume` 与音乐通道的有效音量同步到原生 context；设置 `src` 后、调用 `play()` 前需再次提交音量，兼容平台实现重置播放属性的情况。
- `playMusic(url, loops)`：同时只允许一个背景音乐，`loops=0` 无限循环；背景音乐不进入音效缓存池。
- 普通 BGM 不依赖 `SoundManager.playMusic` 的完成回调。流式通道元数据就绪后读取 `SoundChannel.duration`，结合 `position` 换算剩余毫秒；预计结束点到达时再次核对播放位置，尚未真正到达末尾则按剩余时长继续延后。
- `InnerAudioContext.onEnded` 只用于底层通道结束、循环计数和资源释放，不得用于普通 BGM 的下一首调度；下一首仍只由 `duration/currentTime` 计时结果触发。
- 普通 BGM 到达实际时长后再等待随机 5-10 秒播放下一首。进入战斗会清除普通曲目的时长计时与间隔计时，再无限循环战斗 BGM。

## 微信背景音乐排查顺序

微信 BGM 无声时必须按以下边界逐层确认，不能因为“没有报错”就直接判断初始化未执行，也不能因为收到 `onPlay` 就判断扬声器已有声音：

1. **导出边界**：`music` 必须同时存在于 `BuildSettings.alwaysIncluded`、远程 `subpackages` 和 `MyGameConfig.remoteResourcePackages`；构建后检查 `wxgame-remote/music/fileconfig.json` 非空，且其中每个逻辑文件都存在对应的 `name-hash.mp3`。
2. **版本映射边界**：必须先完成 `loadPackage("music", remoteBaseUrl)`，再播放逻辑 URL。最终地址只能由 `Laya.URL.formatURL`/`postFormatURL` 生成；禁止直接请求未加哈希的 `music/bg_1.mp3`，也禁止业务代码自行拼接 hash。
3. **流式后端边界**：微信 BGM 必须确认进入 `WechatStreamingMusicChannel`，并把最终 HTTP(S) URL 直接赋给 `InnerAudioContext.src`。若调用链出现 `fetch(..., "filePath")` 或 `wx.downloadFile`，说明又退回 Laya 3.3 的整文件下载方案。
4. **播放状态边界**：`onPlay` 只证明平台接受了播放命令。无声时继续检查原生 `volume`、`paused`、`currentTime` 和 `duration`：`currentTime` 增长且 `volume > 0` 才能把代码播放链判定为正常；之后才检查开发者工具静音、Windows 音量合成器、输出设备和 iOS 静音键。
5. **音量数据边界**：若 `muted=false` 但原生 `volume=0`，优先沿 `MusicMgr` 持久化值 → `SoundManager.musicVolume` → `SoundChannel` 有效音量 → `InnerAudioContext.volume` 追踪，不要更换播放 API。微信缺失存储键可能返回空字符串，必须在数值转换前按“无值”处理，避免 `Number("") === 0` 把首次启动误判为零音量。
6. **诊断环境边界**：微信开发者工具 Console 不保证暴露 bundle 内部的 `Laya`、普通 `window` 或 `Laya.Browser.window`。运行态证据应由代码使用统一 `[DBG-<ISSUE_KEY>]` 日志输出，或显式暴露到确认可用的平台调试对象；不要把 Console 中 `Laya is not defined` 误判为游戏未初始化。
7. **生命周期边界**：进入后台时记录“此前是否真的在播放”并暂停；回到前台只恢复系统触发的暂停。玩家主动暂停、音乐静音或总静音状态不得被前台事件覆盖，后台停留时间也不得计入下一首 BGM 的剩余时长。

开发者工具验收至少需要同时看到：带版本哈希的远程 URL、原生音量大于 0、音乐实际可听。正式发布还必须在目标 Android/iOS 真机使用 HTTPS 合法域名验证；CDN 建议支持 Range/206，以改善长音频缓冲、seek 与断点读取。

## 特效音效：微信 voice 管理

短促高频音效重点在避免重复创建原生实例、控制同时可听的 voice 数量，并在超限时保留更重要的声音。这里的“voice”表示一个正在播放的音效实例，不等同于音频资源文件。

### 依据与结论

- 微信小游戏音频指导明确建议相同音效复用已有 `InnerAudioContext`，不再使用的实例及时 `destroy()`；Android 同时最多播放 10 个音频，超过后平台会做有损处理。因此项目不能把大于 10 的数值当成微信安全并发预算。
- LayaAir 3.3 的 `SoundManager.playSound()` 每次创建新通道；它只提供全局/分类音量、静音和活动通道集合，没有总 voice 上限、同类实例上限、优先级、抢占、虚拟 voice 或实例池。
- Wwise、FMOD、Unity 等成熟音频系统的共同做法是“平台总 voice 预算 + 同类实例上限 + 优先级 + 超限淘汰/虚拟化”，而不是只按每秒调用次数丢弃新请求。
- 微信 `InnerAudioContext` 没有项目可控的混音总线、动态压缩器或限制器。第一版不按并发数量动态修改所有活动音效的音量，以免产生明显的音量抽动；密集叠加优先通过同类上限、短窗口合并和优先级处理。

参考资料：

- [LayaAir 3.3 SoundManager](https://github.com/layabox/LayaAir/blob/LayaAir_3.3/src/layaAir/laya/media/SoundManager.ts)
- [LayaAir 3.3 SoundChannel](https://github.com/layabox/LayaAir/blob/LayaAir_3.3/src/layaAir/laya/media/SoundChannel.ts)
- [微信小游戏音频播放文档镜像](https://m.w3cschool.cn/wxagame/wxagame-9u7b2jrr.html)
- [Wwise Voice Limits](https://www.audiokinetic.com/en/courses/wwise251/?id=Lesson3_Voice_Limits&source=wwise251)
- [FMOD Channel Priority](https://www.fmod.com/docs/2.03/api/core-api-channel.html)
- [Unity AudioSource Priority](https://docs.unity3d.com/ScriptReference/AudioSource-priority.html)

### 公共版本基线与后续边界

- 当前仍由 Laya `SoundManager.playSound` 负责微信短音效，每次播放都会创建并在结束后销毁一个 `InnerAudioContext`。
- `MusicMgr` 在微信使用最多 8 路短音效预算，连同 1 路 BGM 后仍保留 1 路平台安全余量；非微信平台保持原有 12 路项目上限。
- 每 URL 活动数量与全局活动数量共同参与准入；同 URL 每秒 8 次限频只作为临时防抖。
- 当前超限统一丢弃新请求，不能保证新的击中/爆炸反馈优先于旧的普通挥砍音效。
- `SoundChannel.volume` 已在 Laya 内部乘以 `SoundManager.soundVolume`。项目只写单音效音量，设置音量不会被平方应用。
- 所有已知 UI、Action 和业务调用均经过 `MusicMgr`；新增调用也不得直接使用 `Laya.SoundManager.playSound()`。

### 公共版第一阶段约束

公共版先保留 Laya 后端，只修正确定性问题：

1. 微信短音效物理预算改为最多 8 路，另保留 1 路 BGM 与 1 路平台安全余量；非微信平台不因微信限制被统一降级。
2. 单音效音量只设置给 `SoundChannel.volume`，全局设置音量只由 `SoundManager.soundVolume` 乘一次。
3. 所有音效入口统一汇入 `MusicMgr`。
4. 每 URL 活动数量参与准入；现有限频只作为临时防抖，不再被视为完整的 voice 管理。

### 私有版必须实现的微信音效池

私有版新增微信专用 `WechatSoundEffectPool`，其他平台继续使用 Laya 后端：

```text
MusicMgr.playSound
        |
        +-- Web/IDE/其他平台 --> Laya.SoundManager
        |
        +-- 微信小游戏 -------> WechatSoundEffectPool
```

池遵守以下稳定契约：

- 总预算最多 8 个短音效物理实例；BGM 不进入该池。
- 惰性创建，不在启动时一次创建满池。优先复用绑定同一 URL 的空闲实例；同一 URL 需要重叠播放时才增加实例。
- 实例在加载期间不改绑 URL，避免旧 `onCanplay`/`onError` 异步回调作用于新请求。需要回收给另一 URL 时销毁旧 context，再创建新 context，不在原实例上快速切换 `src`。
- 每个高频 URL 最多保留 1 个常驻空闲实例；重叠产生的额外实例在空闲 15-30 秒后销毁。退出战斗/场景、音频模块 `release()` 或发生不可恢复错误时销毁相应实例。
- 进入后台时停止短音效并归还实例；回到前台不恢复已过期的战斗音效。关闭音效或总静音时停止活动音效，解除静音只影响之后的新请求。
- 池内短音效默认只播放一次。无限循环或长环境音不占用战斗短音效池，应由独立的长音频/环境音能力承载。
- 每个 slot 保存 generation、URL、活动状态、开始时间、优先级与单音效音量；所有 `ended`、`error`、停止和抢占路径必须幂等归还，旧 generation 回调不得释放新一代播放。

建议的首版策略值如下；它们是项目调优起点，不是平台固定参数：

| 音效 | 同时实例上限 | 优先级 | 同类达到上限 |
| --- | ---: | ---: | --- |
| UI click | 1 | 100 | 丢弃新请求 |
| knife impact | 3 | 80 | 替换最旧实例 |
| fireball explosion | 3 | 80 | 替换最旧实例 |
| swing | 2 | 50 | 丢弃新请求 |

各同类上限共享 8 路总预算，不是预留固定槽位。全局满载时只允许更高优先级的新声音抢占当前最低优先级中最旧的实例；优先级相同则按该音效策略替换最旧或丢弃最新。普通 `swing` 不得抢占正在播放的击中、爆炸或 UI 反馈。

### 音量与密集触发

- 非微信 Laya 通道：`最终音量 = 单音效 volume × SoundManager.soundVolume`，其中项目只给 `channel.volume` 写单音效 volume。
- 微信池通道：`InnerAudioContext.volume = 单音效 volume × MusicMgr.soundVolume`，只计算一次并钳制到 `[0, 1]`。
- 第一版不使用 `1 / sqrt(n)` 等并发自动归一化，也不在声音数量变化时重写所有活动实例音量。
- 同一音效在约 40-60ms 内大量同时触发时可以合并为一次播放，避免相位叠加和瞬时爆音；具体窗口通过真机听感与统计调优。
- 素材侧继续统一峰值、响度、声道和时长。运行时 voice 管理不能替代素材混音。

### 可观测性与验收

微信池必须提供可关闭的诊断统计：context 创建/销毁次数、当前与峰值活动数、每 URL 活动峰值、请求到 `onPlay` 的延迟、按原因分类的丢弃数、抢占数和错误数。

真机 A/B 至少覆盖 Android 与 iOS 的连续战斗压力场景，并满足：

- 包含 BGM 在内的项目主动音频不超过 9 路，不出现 `Too many InnerAudioContext instance`。
- 高频技能期间重要击中/爆炸反馈不会被普通挥砍长期压制。
- 设置音量在 Laya 与微信池后端使用同一感知曲线；`gain = value²` 只在统一输出边界应用一次，不得在播放入口重复套用而造成额外衰减。
- 相比当前 Laya 微信短音效后端，context 创建次数、播放启动延迟或帧时间抖动至少有一项得到可重复改善，且内存没有持续增长。
- 静音、后台/前台、退出战斗、场景释放和错误回收后活动计数归零，空闲实例按策略销毁。

## 统一音量接口与本地持久化

- `musicVolume` 与 `soundVolume` 分开存储、分开设置，取值 `[0, 1]`。
- 对外音量值和持久化值表示滑杆的感知位置，最终写给引擎的振幅增益统一使用 `gain = value²`。不得在设置页或各播放入口重复套用曲线；这样既保持 0/100% 端点，又让低中音量区具有更均匀的听感调节精度。
- 静音分开：`musicMuted`、`soundMuted`，同时提供整体 `muted` 快捷开关。
- `init()` 时从 `Laya.LocalStorage` 读取，变更立即写入；键名统一带 `music.` 前缀。
- 读取数值时必须同时把 `null` 与空字符串视为“不存在”。微信小游戏存储兼容层可能对缺失 key 返回 `""`，而 JavaScript 的 `Number("")` 等于 `0`；忽略该差异会让首次启动音量被错误静音。

## 后台与前台

- 当前封装层监听 Laya 舞台可见性变化；该路径已覆盖微信开发者工具的前后台暂停恢复。若目标真机没有稳定派发该事件，再补充平台 `onHide`/`onShow`，但两套事件必须汇入同一状态机，避免重复暂停/恢复。
- 进入后台：暂停背景音乐（记录曲目与进度）、取消当前时长计时，按需停止高频音效。
- 回到前台：恢复被暂停的背景音乐与音量/静音状态；单次普通 BGM 按 `duration - position` 重建剩余时间，后台停留时间不得计入曲目播放时长。

## 已知坑点与规避

- 浏览器 Audio 可能要求用户手势；微信原生 `InnerAudioContext` 是否成功应以 `onPlay`、播放位置和真机结果为准。不要在尚未检查 URL、音量和暂停状态前，把所有无声问题归因于“需要点击一次”。
- 不要让背景音乐与音效共用音量/静音：平台与引擎按类别区分。
- 不要频繁 `stopAll()` 或重复 `playMusic`：`playMusic` 自带先停旧再播新语义。
- 不要让封装层持有已释放的 `SoundChannel` 实体引用：通道播放结束或停止后即失效，只记录 URL、循环与状态标志。
- 微信小游戏大段音频必须走项目的 `WechatStreamingMusicChannel`；`longAudioClass` 本身仍会整文件下载，不能作为流式保证。不要把长音频当普通音效或交给 Loader 全量缓存。

## 音效资源标准（供制作与审查）

音效是短促高频资源，规格直接影响 iOS 解码与叠加开销。以下为推荐标准，制作资源时应遵循，并作为静态检查的依据：

| 维度 | 推荐标准 | 说明 |
| --- | --- | --- |
| 格式 | `mp3`（默认）；可接受 `m4a`；避免 `wav`/未压缩 PCM | `wav` 体积大、解码开销高，禁止用于高频战斗音效 |
| 时长 | 单条音效 ≤ 1 秒；最长不超过 2 秒 | 长音效走背景音乐/流式通道，不进短音效通道 |
| 采样率 | 44.1kHz 或 22.05kHz；短音效可降采样到 22.05kHz | 高采样率解码成本高，短音效不必 48kHz |
| 码率 | mp3 128kbps 以内；短音效可用 64kbps | 控制体积与解码成本 |
| 声道 | 单声道（mono）优先 | 战斗音效无需立体声，降低解码与内存 |
| 响度 | 峰值/目标响度统一（如 -14 LUFS 左右），避免单音过响 | 配合音量钳制，防止叠加爆音 |
| 文件大小 | 单条 ≤ 200KB；高频音效建议 ≤ 100KB | 限制解码与缓存压力 |
| 命名 | `sound/` 下使用稳定、可读文件名 | 路径稳定，便于配置表和 Action 引用 |

### 目录约定

```
assets/music/   背景音乐（流式播放）
assets/sound/   特效音效（短促，走受限短音效通道）
```

背景音乐与特效音效严格分目录，与 `MusicMgr` 两套接口一一对应，防止混用。
