# ConfigStruct 说明

本目录保存服务器配置结构类，文件由 `Config/tools/exportServer.js` 根据 CSV 自动生成。

## 当前规则

- 源数据来自 `Config/csv/*.csv`。
- 只有 `UsedSize` 为 `s` 或 `cs` 的字段会进入服务器导出。
- 生成的 JSON 位于 `Sever/output/config/tables/*.json`。
- 生成的 Java 类位于本目录，命名为 `XxxConfig.java`。
- 不依赖 Lombok，getter 由导出工具显式生成。
- 字段使用 `final`，构造器使用 `@JsonCreator` 和 `@JsonProperty`。

示例结构：

```java
public class SceneTypeConfig implements Serializable {
    @JsonProperty("ID")
    private final int ID;

    @JsonProperty("ui")
    private final String ui;

    @JsonCreator
    public SceneTypeConfig(
            @JsonProperty("ID") int ID,
            @JsonProperty("ui") String ui) {
        this.ID = ID;
        this.ui = ui;
    }

    public int getID() {
        return ID;
    }

    public String getUi() {
        return ui;
    }
}
```

## 加载规则

`ConfigManager` 自动扫描本包下所有 `*Config.class`，并映射到配置表：

- `SceneTypeConfig` -> `scenetypes.json`
- `SceneObjConfigConfig` -> `sceneobjconfigs.json`
- `TestConfig` -> `tests.json`

不需要手动维护表清单，也不需要服务器读取客户端的 `config-manifest.json`。

## 修改规则

- 只改已有字段的数值: 重新导出服务器 JSON 后，可调用 `configManager.reloadAll()` 或 `configManager.reloadTable(XxxConfig.class)`。
- 新增表、新增字段、修改字段类型: 需要重新导出 Java 结构类，重新编译并重启服务器。
- 不建议手写或长期保留对生成类的人工修改，下一次导出会覆盖。
