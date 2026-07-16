# Guide 系统设计

本文件作用于 `src/logic/guide/`，继承 `src/DESIGN.md` 和根目录 `DESIGN.md`。

## 权威与职责

- 服务器决定引导是否可开始并持久化 `inProgress/completed` 进度。
- 客户端只负责场景、UI、遮罩、弹窗和交互等表现条件。
- Guide 不授予奖励、不修改等级、不直接开启玩法；真实业务变化必须调用白名单命令并走对应服务器协议。
- 同时只执行一条引导，服务器返回顺序按 `priority` 降序、`ID` 升序。

## 条件边界

Guide 索引表的激发条件与流程步骤的等待条件必须分开：

- `triggerType/triggerArgs` 是双端共享语义，服务器拥有最终判断权。
- `waitFor` 是客户端表现就绪条件，可以引用场景和 UI，但不能成为服务器业务授权条件。
- 条件按 `type` 注册多态 evaluator；未知条件必须安全返回 false，不能默认通过。

第一版条件列表隐式使用 AND，不支持 OR 或嵌套表达式。复杂条件组合属于后续扩展。

## 动作边界

现有 `src/logic/action/` 是战斗 Action，依赖 scene/caster/target 且同步执行。Guide 使用独立的异步 `GuideActionRunner`，只复用“注册表/工厂 + 上下文 + 顺序执行”的设计，不继承战斗 `BaseAction`。

流程文件必须包含 `schemaVersion`、`flowId` 和稳定递增的 `stepId`。每个动作返回 Promise；需要服务器状态的步骤必须等待同步结果后才能完成。

## 生命周期与恢复

- GuideMgr 在配置、PlayerMgr、SceneMgr、UIManager 和 DialogMgr 均初始化后注册。
- 登录和重连的统一初始化 `guide` section 全量替换本地候选与进度。
- 开始前先向服务器写入 `inProgress`，每步进度单调增加，最后写入 `completed`。
- 重连后已进行中的引导从服务器 `currentStepId` 继续；脚本版本不匹配时服务器拒绝进度更新。
- reset/release 必须取消当前异步流程，禁止旧账号或旧场景继续执行。
