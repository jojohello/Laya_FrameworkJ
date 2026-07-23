# Scene 当前计划

## 当前目标

Scene 时间调度基础层及 SceneObj/HUD/Buff/Skill 的显式 owner、显式时间接口已经形成。下一步迁移 AnimationAction、技能状态结束时间和剩余 gameplay 时间来源，并在 LayaAir IDE 验证两种模式、暂停、倍速、后台与场景缓存。

## 待完成

- [ ] 清理 Skill、Action、Buff、Bullet 和动画中的默认 Scene 取时、毫秒/秒往返转换及播放完成回调；所有延迟和结束条件改用计划逻辑时间。
- [ ] 检查 gameplay 代码中的 `Date.now()`、`performance.now()`、`Laya.timer` 和含糊 `realTime` 命名，只保留网络、真实超时、外层生命周期和性能采样等明确例外。
- [ ] 为 Realtime 与 FixedTick 增加可重复的调度验证，覆盖 1×/2×、暂停、单帧 1/3/4/5 次逻辑更新、积压不丢弃和累计 renderDt。
- [ ] 在 LayaAir IDE 验证后台恢复：Realtime 补入后台经过时间并到达最新状态；FixedTick 忽略后台经过时间并从原 tick 恢复。
- [ ] 连续执行三次 Scene 进入、退出、缓存恢复，确认对象、地图、Camera、Layer、空间索引、异步令牌和时间状态全部重新初始化。

## 验收条件

- 下层 gameplay 不读取时间模式或墙钟，不建立绕过 Scene 的独立 Timer。
- FixedTick 默认 30Hz，单 Laya 帧最多追 5 次；超过 3 次时跳过渲染且下次累计推进表现。
- Realtime 不截断大 dt；两种模式使用相同的下层 `curTime` 比较逻辑。
- TypeScript、文档检查通过，并完成 LayaAir IDE 生命周期实测。
