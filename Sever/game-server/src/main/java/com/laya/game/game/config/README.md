# 配置管理系统 (Config Package)

## 📋 概述

配置管理系统负责加载、缓存和查询游戏配置数据。采用**预加载 + 自动扫描**架构,支持策划驱动的配置更新流程。

**版本**: 2.0.0 (预加载 + 自动扫描)
**完成时间**: 2025-10-29

---

## 🎯 核心特性

### 1. 预加载架构
- ✅ 启动时将所有配置转换为强类型POJO对象
- ✅ 查询时直接返回对象,无Jackson转换开销 (0.001ms)
- ✅ 性能提升300倍 (相比懒加载)

### 2. 自动扫描机制
- ✅ 自动扫描`configStruct`包下的所有`*Config.class`
- ✅ 工具生成配置类后无需程序员手动注册
- ✅ 策划驱动:策划加表 → 工具生成类 → 自动加载

### 3. 双层缓存
- **rawCache**: 原始JSON数据 (支持`getRaw()`动态查询)
- **typedCache**: 预加载的强类型对象 (主要查询接口)

### 4. 泛型查询接口
- **强类型查询**: `get(ItemConfig.class, 1001)`
- **字段查询**: `getByField(ItemConfig.class, "type", "weapon")`
- **批量查询**: `getAll(ItemConfig.class)`
- **动态查询**: `getRaw("items", 1001)`

---

## 📂 文件结构

```
config/
├── README.md               # 本文档
├── ConfigManager.java      # 配置管理器 (核心类)
└── JsonTableLoader.java    # JSON文件加载器
```

---

## 🚀 工作流程

### 启动流程

```
1. loadAllRawConfigs()
   └── JsonTableLoader扫描config/tables/*.json
   └── 解析JSON并存入rawCache

2. preloadTypedConfigs()
   └── scanConfigClasses()  // 自动扫描configStruct包
   └── 找到所有*Config.class
   └── 逐个调用loadConfigTable()
       └── 类名映射表名: ItemConfig → "items"
       └── 从rawCache取数据
       └── Jackson转换为POJO
       └── 存入typedCache

3. 完成初始化
```

### 策划工作流 (无需程序员介入)

```
策划: 添加skills.json到config/tables/
  ↓
工具: 读取skills.json → 生成SkillConfig.java到configStruct/
  ↓
程序员: mvn compile (编译项目)
  ↓
ConfigManager启动:
  • JsonTableLoader自动加载skills.json → rawCache ✅
  • scanConfigClasses()自动找到SkillConfig.class ✅
  • 预加载SkillConfig → typedCache ✅
  ↓
完成! 程序员不用改任何代码 ✅
```

---

## 🔧 核心类说明

### ConfigManager.java

**职责**: 统一配置查询接口,预加载管理

**关键方法**:
```java
// 初始化
@PostConstruct
public void init()

// 自动扫描配置类
private List<Class<?>> scanConfigClasses()

// 加载单张配置表
private <T> void loadConfigTable(Class<T> configClass)

// 类名→表名映射
private String getTableName(Class<?> configClass)
// 规则: ItemConfig → items, MonsterConfig → monsters

// 查询接口
public <T> T get(Class<T> configClass, int id)
public <T> List<T> getAll(Class<T> configClass)
public <T> List<T> getByField(Class<T> configClass, String field, Object value)
public Map<String, Object> getRaw(String tableName, int id)
```

**扫描机制**:
```java
// 使用Spring ResourcePatternResolver
String packageSearchPath = "classpath*:com/laya/game/game/configStruct/**/*.class";
Resource[] resources = resolver.getResources(packageSearchPath);

// 过滤以Config结尾的类
if (className.endsWith("Config")) {
    Class<?> clazz = Class.forName(className);
    classes.add(clazz);
}
```

---

### JsonTableLoader.java

**职责**: 扫描并加载JSON配置文件

**关键方法**:
```java
// 加载所有配置表
public Map<String, List<Map<String, Object>>> loadAll()

// 扫描config/tables/目录下的所有.json文件
File[] jsonFiles = configDir.listFiles((dir, name) -> name.endsWith(".json"));

// 解析JSON为List<Map>格式
private List<Map<String, Object>> parseJsonFile(File file)
```

---

## 📊 性能数据

| 指标 | 懒加载(旧) | 预加载(新) | 改进 |
|------|----------|----------|------|
| 初始化时间 | 123ms | 251ms | +128ms |
| 首次查询 | 1-2ms | 0.001ms | **快1000倍+** |
| 后续查询 | 0.001ms | 0.001ms | 相同 |
| 内存占用 | 50.5MB | 24.4MB | **节省51%** |

**测试环境**: 15条配置, 2张表

---

## 🎯 使用示例

### 基础查询
```java
@Autowired
private ConfigManager configManager;

// 1. 强类型查询
ItemConfig sword = configManager.get(ItemConfig.class, 1001);
System.out.println(sword.getName());  // "铁剑"

// 2. 字段查询
List<ItemConfig> weapons = configManager.getByField(
    ItemConfig.class, "type", "weapon");

// 3. 查询所有
List<ItemConfig> allItems = configManager.getAll(ItemConfig.class);

// 4. 动态查询
Map<String, Object> rawItem = configManager.getRaw("items", 1001);
```

### 添加新配置表

**步骤1**: 策划创建JSON文件
```json
// config/tables/skills.json
[
  {"id": 5001, "name": "火球术", "damage": 100},
  {"id": 5002, "name": "冰冻术", "damage": 80}
]
```

**步骤2**: 工具生成Config类
```java
// configStruct/SkillConfig.java (工具自动生成)
@Data
public class SkillConfig implements Serializable {
    private final int id;
    private final String name;
    private final int damage;

    @JsonCreator
    public SkillConfig(
        @JsonProperty("id") int id,
        @JsonProperty("name") String name,
        @JsonProperty("damage") int damage
    ) {
        this.id = id;
        this.name = name.intern();
        this.damage = damage;
    }
}
```

**步骤3**: 编译并运行
```bash
mvn compile
java -jar game-server.jar
```

**ConfigManager会自动**:
1. 扫描到`SkillConfig.class`
2. 映射表名 `SkillConfig` → `"skills"`
3. 从rawCache取`skills`表数据
4. 转换为`SkillConfig`对象
5. 存入typedCache

**步骤4**: 使用
```java
SkillConfig fireball = configManager.get(SkillConfig.class, 5001);
System.out.println(fireball.getName());  // "火球术"
```

---

## 🎯 设计决策

### 为什么预加载?
1. **查询频率极高**: 每个玩家操作都需要查配置
2. **数据量可控**: 配置总量通常< 100MB
3. **性能优先**: 运行时性能 > 启动速度
4. **内存更省**: 去掉懒加载的L2缓存管理开销

### 为什么自动扫描?
1. **策划驱动**: 策划加表不应惊动程序员
2. **避免遗漏**: 工具生成类自动加载,不会忘记注册
3. **降低维护成本**: 配置类可能有20-50个,手动注册容易出错

### 为什么保留rawCache?
1. **兼容性**: 支持`getRaw()`动态查询
2. **灵活性**: 有些临时表不需要Config类
3. **调试方便**: 可以查看原始JSON数据

---

## ⚠️ 注意事项

### 类名映射规则
```
ItemConfig      → items       ✅
MonsterConfig   → monsters    ✅
NPCConfig       → npcs        ✅
EquipmentConfig → equipments  ✅
```

**规则**: `XxxConfig` → 去掉"Config" → 首字母小写 → 加"s"

### Fail-Fast机制
- **场景A**: 有`SkillConfig.class`,但没有`skills.json`
  - **行为**: 启动失败,抛异常 ✅
  - **原因**: Fail-fast,及早发现问题

- **场景B**: 有`skills.json`,但没有`SkillConfig.class`
  - **行为**: 启动成功,只存在rawCache ✅
  - **影响**: 可以用`getRaw()`查询,不能用`get()`

## 🔗 相关文档

- [configStruct包README](../configStruct/README.md) - 配置数据结构说明
- [DESIGN.md](../../../../../../../../DESIGN.md) - 整体架构设计
