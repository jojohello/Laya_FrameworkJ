# 配置表系统设计

## 作用域

配置系统服务于策划编辑、客户端读取和服务器读取。它只描述静态定义，不保存账号、角色或战斗运行时状态。

## 数据链路

```text
Config/csv/*.csv
  ├─ exportClient.js
  │    ├─ Config/generated/json/client/*.json
  │    └─ Client/LayaProject/assets/config/*.json + config-manifest.json
  └─ exportServer.js
       ├─ Sever/output/config/tables/*.json
       └─ Sever/game-server/.../configStruct/*Config.java
```

CSV 是唯一编辑入口。JSON、manifest 和 Java 类是生成物。

导出结果必须可重复：相同 CSV 连续导出不得写入时间戳或产生内容差异，文本输出使用 UTF-8 无 BOM、LF 并保留末尾换行。

## CSV 约束

前四行依次为 `Title`、`Type`、`Description`、`UsedSize`。`UsedSize` 的 `c`、`s`、`cs` 分别表示客户端、服务器和两端导出；空值不导出。

字段类型当前支持 `int`、`float`、`bool`、`str`。每个有效导出表必须有可作为主键的 ID 字段，新增表统一使用 `ID`。ID 在单表内必须唯一。

服务器敏感或只参与权威计算的字段必须标记为 `s`，不能为了客户端显示方便导出完整服务器数据。

新增或修改表前必须先定义输入端契约：字段名、类型、说明、`UsedSize`、主键、空值语义、枚举范围以及颜色、路径等字符串格式。实现不得先修改 JSON、manifest 或 Java 类再反推 CSV。

颜色字段统一使用 `#rrggbb`；路径字段必须说明是相对仓库、`assets/` 根还是运行目录；数值字段必须说明单位和边界。仅客户端使用的表全部标记为 `c`，不会生成服务器 Java 类。

## 客户端设计

客户端运行时不读取 CSV。`ConfigMgr` 固定读取 `config/config-manifest.json`，按 manifest 发现表，并提供：

- 按表名和 ID 查询。
- 获取整表。
- 按字段查询并懒构建索引。
- 单表重新加载。

新增表不要求维护 TypeScript 表清单。manifest 是客户端资源发现契约，导出后必须与 JSON 同步提交。

## 服务器设计

服务器不使用 manifest 发现配置。`JsonTableLoader` 扫描 JSON 目录，`ConfigManager` 扫描 `configStruct` 下的 `*Config` 类并预加载强类型缓存。

类名与文件名由导出器约定。例如 `TestConfig` 对应 `tests.json`；修改命名规则必须同时验证导出器和加载器，不能只改一端。

表文件名大小写是跨平台契约。生成文件、manifest 和加载器引用必须使用完全一致的大小写，不能依赖 Windows 的大小写不敏感行为。

服务器提供强类型、原始表、整表、字段查询及 reload 能力。运行目录中的 `output` 是部署结果，不是设计事实来源。

## 热更边界

- 只修改已有字段数值：重新导出 JSON 后可通过 reload 重建缓存。
- 新增或删除表、字段，修改字段名或类型：必须重新生成 Java 类、重新编译并重启服务器。

因此服务器热更入口应调用 `ConfigManager.reloadAll()` 或 `reloadTable()`，不能用 manifest 绕过类型结构变化。

## 错误防范

- 导出前验证四行表头、ID、字段类型和 `UsedSize`，不要依赖运行时才发现格式错误。
- 客户端运行时只加载 manifest 中列出的表；新增 JSON 而不新增对应 CSV，会在下一次正规导出后从 manifest 消失。任何运行时配置表都必须先建立 `Config/csv/*.csv` 权威源。
- 客户端和服务器导出必须来自同一份 CSV 版本。
- 不手改生成 JSON 或 Java 类；否则下一次导出会覆盖修改。
- 新增表后同时验证客户端 manifest 加载和服务器类名到文件名映射。
- 在大小写敏感环境校验生成文件名，避免同一表出现大小写不同的两个文件。
- 中文 CSV 与生成文件保持 UTF-8 无 BOM、LF，避免注释和策划文本乱码。

## 已废弃方案

- 客户端 TypeScript 配置清单。
- 客户端运行时读取 CSV。
- 策划新增表时手动修改客户端表列表。
- 服务器使用 `configlist.json` 发现配置。
