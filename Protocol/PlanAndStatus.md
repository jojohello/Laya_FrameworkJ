# Protocol 当前计划

## 当前目标

消除消息 ID 在 Java 消费端和客户端 Start 包中的人工同步点，并建立生成物漂移检查。

## 执行顺序

- [ ] 扩展生成器，按正确 package 直接生成 Gateway 与 Game Server 的 `MessageIds.java`。
- [ ] 为 Client Logic、Gateway、Game Server 和 `Protocol/generated` 增加基于 YAML 的一致性检查。
- [ ] 从 YAML 生成客户端 Start 包所需的最小登录消息常量，移除 `LoginProtocol.ts` 的人工硬编码。
- [ ] 使生成结果可重复，避免日期等非语义信息造成无意义差异。
- [ ] 补充消息名称格式、保留编号和范围冲突校验，并接入根级验证命令。

## 验收条件

- [ ] 修改 YAML 后一次生成即可更新所有消费端，不需要复制或修改 package。
- [ ] 任一消费端常量漂移都会使验证失败。
- [ ] 连续生成两次无文件差异。
- [ ] 登录、Gateway 认证和 Gateway 到 Game Server 路由在生成后通过构建与冒烟测试。
