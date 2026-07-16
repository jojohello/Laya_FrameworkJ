# Guide 系统设计

本文件作用于 `src/logic/guide/`，继承 `src/DESIGN.md` 和根目录 `DESIGN.md`。

## 权威与职责

- 服务器判断激活条件；首次满足后持久化为 `queued`，并下发服务器权威队列。
- 客户端只负责场景、UI、遮罩、弹窗和交互等表现条件。
- Guide 不授予奖励、不修改等级、不直接开启玩法；真实业务变化必须调用白名单命令并走对应服务器协议。
- 同时只执行一条引导。队列按激活顺序 FIFO；只有队首能够进入 `inProgress`，队首限制条件未满足时不能跳过执行后项。

## 条件边界

Guide 索引表的激发条件与流程步骤的等待条件必须分开：

- `triggerType/triggerArgs` 是激活条件的双端共享语义，服务器拥有最终判断权；条件首次满足即入队，之后不因条件变化撤销。
- `waitFor` 是已入队引导的限制条件，可以引用场景和 UI；它只决定队首动作何时开始，不能激活、撤销或重排引导。
- 条件按 `type` 注册多态 evaluator；未知条件必须安全返回 false，不能默认通过。

第一版条件列表隐式使用 AND，不支持 OR 或嵌套表达式。复杂条件组合属于后续扩展。

## 动作边界

现有 `src/logic/action/` 是战斗 Action，依赖 scene/caster/target 且同步执行。Guide 使用独立的异步 `GuideActionRunner`，只复用“注册表/工厂 + 上下文 + 顺序执行”的设计，不继承战斗 `BaseAction`。

流程文件必须包含 `schemaVersion`、`flowId` 和稳定递增的 `stepId`。每个动作返回 Promise；需要服务器状态的步骤必须等待同步结果后才能完成。

## 生命周期与恢复

- GuideMgr 在配置、PlayerMgr、SceneMgr、UIManager 和 DialogMgr 均初始化后注册。
- 登录和重连的统一初始化 `guide` section 全量替换本地 FIFO 队列与进度。
- 服务器激活时先写入 `queued`；客户端确认队首限制条件满足后写入 `inProgress`，每步进度单调增加，最后写入 `completed`。
- 重连后已进行中的引导从服务器 `currentStepId` 继续；脚本版本不匹配时服务器拒绝进度更新。
- reset/release 必须取消当前异步流程，禁止旧账号或旧场景继续执行。

## 可观测性

- 服务端必须记录 Guide 首次激活、持久化入队和每次初始化下发的 FIFO 队列快照，日志至少包含 `playerId`、`guideId` 与状态。
- 客户端必须记录 `guide` section 是否应用、当前队列、队首限制条件等待、流程开始与流程完成。
- “服务端已激活”与“客户端已收到并执行”是三个不同检查点。排查不弹窗时按“数据库/队列 → GAME_INIT 最终 JSON → Gateway 转发 → 客户端 applyInit → waitFor → Dialog”顺序逐段确认，不能直接修改弹窗代码。
- 初始化 envelope 中任一其他 section 的序列化错误都可能使 Guide 整包丢失，因此验证必须针对真正写入 WebSocket 的最终字符串，而不是只验证某个 section 或中间对象。
