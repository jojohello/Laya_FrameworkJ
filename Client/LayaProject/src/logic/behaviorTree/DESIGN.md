# BehaviorTree 设计约束

本文件作用于 `src/logic/behaviorTree/`，继承 `src/DESIGN.md` 与根目录 `DESIGN.md`。

## 节点归属

- `BehaviorNodes.ts` 只包含无领域语义的行为树基础节点：基类、Selector、Sequence、Parallel 以及函数式 Condition/Action 包装。它不得导入 SceneObj、Skill、AI、配置或任何具体玩法模块。
- 目标选择、技能、移动、兵种特性和 Boss 阶段等领域叶子节点属于 `src/logic/ai/`；节点必须只保存共享定义，实体运行态保存在 owner 的标量字段或明确业务模块中。
- 行为树组合文件只负责装配一种 AI 表现和导出其共享 Agent；可被另一棵树复用的领域节点先按职责提取到 `src/logic/ai/nodes/`，具体树放在 `src/logic/ai/trees/`。

## 演进门槛

当前只有 `SimpleCombatTree`，其私有领域节点暂与该树同文件以保持最小结构。新增第二种正式 AI 表现（例如 Boss、守卫、远程拉扯或逃跑）前，必须先将 `SimpleCombatAI.ts` 拆为 `nodes/` 与 `trees/SimpleCombatTree.ts`，再添加新树；不得继续向单一 AI 文件堆叠不同表现的节点。

日志不能防范节点归属退化；该问题通过模块边界、代码审查和本 DESIGN 约束预防。
