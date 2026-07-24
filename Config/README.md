# Config 配置表系统

`Config` 维护客户端与服务器共享的静态策划配置。CSV 是唯一源数据，导出工具按字段作用域生成各端需要的文件。

## 目录

```text
Config/
├── csv/                         # 唯一源数据
├── tools/exportClient.js        # 客户端 JSON 与 manifest
├── tools/exportServer.js        # 服务器 JSON 与 Java configStruct
├── generated/json/client/       # 客户端导出备份
└── exportAll.bat                # 依次导出两端
```

服务器运行文件输出到 `Sever/output/config/tables/`，Java 配置类输出到 `Sever/game-server/src/main/java/com/laya/game/game/configStruct/`。客户端文件输出到 `Client/LayaProject/assets/config/`。

## CSV 格式

每个 CSV 前四行固定为：

```csv
Title,ID,name,serverValue
Type,int,str,int
Description,配置ID,名称,服务器数值
UsedSize,cs,c,s
```

`UsedSize`：

| 标记 | 客户端 | 服务器 |
| --- | --- | --- |
| `c` | 是 | 否 |
| `s` | 否 | 是 |
| `cs` | 是 | 是 |
| 空 | 否 | 否 |

当前支持 `int`、`float`、`bool`、`str`。配置表应包含 `ID` 主键；工具兼容 `ID/id/Id/iD`，新增表统一使用 `ID`。

编辑配置时先定义 CSV 输入字段及格式，再运行导出器生成 JSON、manifest 和 Java 类。禁止手工修改生成物。客户端专用表使用 `UsedSize=c`，服务器导出器会正常跳过，不要求生成 Java 类。

`UITextStyle.csv` 是客户端 UI 语义文字样式表，记录字体、字号、颜色、粗体、描边像素、描边颜色和对齐方式；颜色统一使用 `#rrggbb`，`Stroke>0` 时必须填写 `StrokeColor`。

## 导出

从仓库根目录运行：

```powershell
node Config/tools/exportClient.js
node Config/tools/exportServer.js
```

也可以在 Windows 中运行：

```powershell
Config\exportAll.bat
```

客户端导出器会：

- 生成 `Config/generated/json/client/*.json`。
- 同步到 `Client/LayaProject/assets/config/*.json`。
- 生成并同步 `config-manifest.json`。

服务器导出器会：

- 生成 `Sever/output/config/tables/*.json`。
- 生成对应的 `*Config.java` 强类型类。

生成文件不应手动修改。修改 CSV 后重新导出，并一起提交纳入 Git 的输出。

## 运行时读取

客户端 `ConfigMgr` 先读取 `config/config-manifest.json`，再加载表；支持按 ID、整表和字段索引查询。

`Character.csv` 保存战斗角色的兵种、基础场景对象 ID、模型与局部队伍色蒙版路径、显示缩放、技能 ID 列表和 AI 模板 ID。`skillIds` 使用分号分隔，`aiTemplateId=0` 表示尚未分配模板。

服务器 `ConfigManager` 扫描 JSON 目录和 `configStruct` 类；已有字段数值可以通过 reload 重载，新增表或字段结构变化需要重新导出、编译并重启。

稳定设计与热更边界见 [DESIGN.md](DESIGN.md)，当前未完成工作见 [PlanAndStatus.md](PlanAndStatus.md)。
