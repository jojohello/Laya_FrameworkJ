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

## 特效音效：缓存、叠加与音量

短促高频音效重点在避免重复创建实例、避免大量叠加造成音量过载，尤其是 iOS：

- 音效走 `SoundManager.playSound`，但必须由 `MusicMgr` 层做**实例/通道复用池**，避免每次播放都新建 `InnerAudioContext`。
- 叠加限制：维护每帧/每 URL 播放次数上限与全局同时播放通道上限（配置化常量）。超限时丢弃最不重要或最旧的请求。
- 音量上限：对单音效实际播放音量做钳制，避免多音效叠加造成整体音量过载。

## 统一音量接口与本地持久化

- `musicVolume` 与 `soundVolume` 分开存储、分开设置，取值 `[0, 1]`。
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

## 已知问题：iOS 微信小游戏音效卡顿（待验证）

**现象**：技能音效（爆炸、受击等）在 iOS 微信小游戏平台造成严重卡顿；Android 与 Web 未见。

**已确认的机制根因方向**（基于项目内 Laya 3.3 源码）：

- iOS 上每次 `playSound` 都新建并随后销毁一个 `InnerAudioContext`，高频音效（技能连发、多目标受击）会短时间内反复创建/销毁原生音频上下文并触发解码，产生明显开销。
- iOS 的 `InnerAudioContext` 是重量级原生资源，实例数量与并发存在平台限制，叠加过多实例会卡顿甚至失声。
- `SoundManager` 本身不做实例复用池，因此默认方案在 iOS 高频音效下开销不可控。

**待验证项（无法在本机静态确认，需真机/开发者工具验证）**：

1. 确认 iOS 卡顿是否与"音效叠加数量"相关：关闭音效 / 限制同时播放通道数后，卡顿是否消失。
2. 确认是否与"每次新建 InnerAudioContext"相关：改用实例/通道复用池后，卡顿是否显著缓解。
3. 确认是否与解码格式/大小相关：将长或高采样率音效（wav/大体积）改为 mp3 或低采样短音效后是否缓解。
4. 确认是否与其它因素耦合：暂停所有音效但保留技能特效渲染，观察卡顿是否仍存在。

**结论**：机制层面 iOS 卡顿高度疑似源于"InnerAudioContext 每次新建/销毁 + 高频叠加"，但具体权重需真机验证后才能定论。修复方向为"音效实例/通道复用池 + 叠加上限 + 格式优化"，这些已纳入 `MusicMgr` 设计要求，后续真机验证通过后回填结论。

### iOS 卡顿的补充评估（根据实测反馈细化）

用户确认卡顿**发生在音效密集时刻**（技能连发、多目标受击、爆炸叠加），单次播放无感。这一现象进一步强化"实例创建/销毁压力 + 同时叠加通道过多"是主因，而非单条解码瓶颈：

- 密集时刻每次 `playSound` 都新建 `InnerAudioContext`，瞬时出现大量原生音频上下文创建与销毁，iOS 上开销集中爆发。
- 多音效同时播放时，即使不销毁，叠加通道数也会触及 iOS 平台并发上限并导致丢音/卡顿。
- 因此修复必须同时处理"复用"与"叠加上限"两条腿，缺一不可。

当前 iOS 卡顿问题仍未真机定论，按待验证项记录，不阻塞 `MusicMgr` 主实现。

## 音效资源标准（供制作与静态检查）

音效是短促高频资源，规格直接影响 iOS 解码与叠加开销。以下为推荐标准，制作资源时应遵循，并作为静态检查的依据：

| 维度 | 推荐标准 | 说明 |
| --- | --- | --- |
| 格式 | `mp3`（默认）；可接受 `m4a`；避免 `wav`/未压缩 PCM | `wav` 体积大、解码开销高，禁止用于高频战斗音效 |
| 时长 | 单条音效 ≤ 1 秒；最长不超过 2 秒 | 长音效走背景音乐/流式通道，不进音效池 |
| 采样率 | 44.1kHz 或 22.05kHz；短音效可降采样到 22.05kHz | 高采样率解码成本高，短音效不必 48kHz |
| 码率 | mp3 128kbps 以内；短音效可用 64kbps | 控制体积与解码成本 |
| 声道 | 单声道（mono）优先 | 战斗音效无需立体声，降低解码与内存 |
| 响度 | 峰值/目标响度统一（如 -14 LUFS 左右），避免单音过响 | 配合音量钳制，防止叠加爆音 |
| 文件大小 | 单条 ≤ 200KB；高频音效建议 ≤ 100KB | 限制解码与缓存压力 |
| 命名 | `audio/sfx/` 下 `kebab-case`，如 `explode-a.mp3` | 路径稳定，便于配置表引用与检查 |

### 目录约定

```
assets/audio/
  bgm/     背景音乐（流式播放）
  sfx/     特效音效（短促，走音效池）
```

背景音乐与特效音效严格分目录，与 `MusicMgr` 两套接口一一对应，防止混用。

### 静态检查工具

新增 `tools/audio/validate-audio-assets.ps1`（或对应 Node 脚本），扫描 `assets/audio/`：

- 校验格式白名单（`mp3`/`m4a`，`wav` 报错并提示原因）。
- 校验时长与文件大小上限（`mp3` 时长可通过解码器或预生成元数据读取；文件大小直接读文件系统）。
- 校验 `bgm/` 与 `sfx/` 目录边界：sfx 内不允许出现长音频（超阈值报错）。
- 输出资源清单，供 `MusicMgr` 预加载与配置表引用核对。

工具纳入根级验证链，防止不合规音频资源进入正式包。音频元数据读取若需额外依赖，优先使用 Node 标准库或项目已有工具链，不引入重型运行时依赖。

## 真机 A/B 验证方案（依赖设置系统，串行）

iOS 卡顿的 A/B 需要能独立开关音效，因此**必须在设置系统完成后执行**，形成串行依赖：

1. 先完成设置系统，提供"音效开关"与"音量"独立控件，并接入 `MusicMgr` 音量/静音接口。
2. 在真机 iOS 上做四组对比：
   - A：音效全开（现状），记录密集技能战斗的卡顿与掉帧。
   - B：关闭音效、保留技能特效渲染，确认卡顿是否消失（排除渲染因素）。
   - C：音效开启但限制同时播放通道数（`MusicMgr` 叠加上限），观察缓解程度。
   - D：音效开启且使用实例/通道复用池 + 叠加上限，观察是否基本无卡顿。
3. 结论回填到本文件，确认主因权重；若 C/D 无法消除，再回到资源格式/采样率维度优化。

该验证项已记录在 `PlanAndStatus.md`，作为设置系统完成后的后续工作。

## 实现顺序

当前进度：

- [x] 封装 `MusicMgr` 基础接口与背景音乐/音效分流，接入 StartMain 初始化。
- [x] 加入音量/静音本地持久化与 App 桥接。
- [x] 加入叠加上限、每 URL 限频与音量钳制（限制 InnerAudioContext 并发实例数，iOS 卡顿主缓解手段）。
- [x] 加入后台/前台暂停恢复（舞台可见性事件；微信平台适配留待真机验证）。
- [ ] 音效实例/通道复用池：需侵入微信音频后端，留待 iOS 真机验证确认后再决定是否实施。
- [ ] 在 LayaAir IDE 与微信小游戏真机验证，补充回归用例并回填 iOS 验证结论。
