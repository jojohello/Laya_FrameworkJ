# Protocol 当前计划

## 当前目标

消除客户端 Start 包剩余的人工同步点，并建立生成物漂移检查。

## 执行顺序

- [ ] 为 Client Logic、Gateway、Game Server 和 `Protocol/generated` 增加基于 YAML 的一致性检查。
- [ ] 从 YAML 生成客户端 Start 包所需的最小登录消息常量，移除 `LoginProtocol.ts` 的人工硬编码。
- [ ] 补充消息名称格式、保留编号和范围冲突校验，并接入根级验证命令。

## 验收条件

- [ ] 任一消费端常量漂移都会使验证失败。
- [ ] 登录、Gateway 认证和 Gateway 到 Game Server 路由在生成后通过构建与冒烟测试。
