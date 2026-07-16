# Guide 引导模块

`GuideMgr` 负责接收服务器下发的可执行引导和进度，等待客户端场景/UI 条件满足后，串行执行 `assets/guides/{flowId}.json`。

## 配置与流程

- `Config/csv/Guide.csv` 是双端 Guide 索引表的唯一编辑入口。
- `triggerType/triggerArgs` 由服务器权威判断，客户端根据已同步状态重复判断以选择合适的展示时机。
- `flowId` 对应客户端 `guides/{flowId}.json`。
- 流程由有序 `steps` 组成；每步先等待 `waitFor`，再顺序执行 `actions`。

当前条件：`playerLevelEquals`、`playerLevelAtLeast`、`sceneActive`、`uiReady`、`dialogIdle`。

当前动作：`showConfirmDialog`、`invokeCommand`、`delay`。`invokeCommand` 只能调用 `GuideCommandRegistry` 中由组合根注册的白名单命令。

## 首个流程

Guide `1001` 在服务器与客户端确认玩家为 1 级后执行 flow `10001`：等待 MainScene/MainUI 就绪，显示不可关闭的确认弹窗，确认后调用 `player.levelUp`，等待服务器同步等级达到 2，再上报完成。

业务数据不能由 Guide 直接修改。升级仍通过 `PLAYER_LEVEL_UP_REQUEST` 交给 Game Server 原子校验和写库。
