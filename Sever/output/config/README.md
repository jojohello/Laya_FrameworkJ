# Laya Game Server - 配置文件说明

## 📁 目录结构

```
config/
├── application-common.yml   # 公共配置（Redis、MySQL等）
├── tables/                  # 游戏配置表（策划维护）
│   ├── items.json          # 物品配置
│   ├── monsters.json       # 怪物配置
│   ├── skills.json         # 技能配置（待添加）
│   └── rooms.json          # 房间配置（待添加）
└── README.md               # 本文件
```

---

## 🔧 application-common.yml

### 说明
此文件包含所有服务器的公共配置，包括：
- Redis连接配置
- MySQL数据库配置
- Jackson JSON序列化配置
- 日志配置

### 修改方法
1. 打开 `application-common.yml`
2. 修改对应的配置项
3. 重启相关服务器（运行 `bin/stop-all.bat` 然后 `bin/start-all.bat`）

### 常用配置项

#### Redis配置
```yaml
spring:
  redis:
    host: localhost      # Redis服务器地址
    port: 6379          # Redis端口
    password:           # Redis密码（如果有）
```

#### MySQL配置
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/laya_game...
    username: laya_user  # 数据库用户名
    password: laya123456 # 数据库密码
```

---

## 📋 游戏配置表（tables/）

### 说明
此目录包含游戏的所有配置表，由**策划**维护。
配置表采用 **JSON格式**，便于Excel导出和编辑。

### 修改配置表的流程

1. **修改配置文件**
   - 打开 `tables/` 目录下的JSON文件
   - 使用文本编辑器（推荐 VS Code 或 Notepad++）编辑
   - 保存文件

2. **重启Game Server**
   - 运行 `bin/restart-game-server.bat`
   - 或者运行 `bin/stop-all.bat` 然后 `bin/start-all.bat`

3. **验证配置**
   - 查看日志文件：`logs/game-server.log`
   - 检查是否有配置加载错误

### ⚠️ 注意事项

1. **JSON格式要求**
   - 必须是有效的JSON格式
   - 字符串必须用双引号 `"`
   - 最后一项不能有逗号 `,`
   - 数字不需要引号

2. **ID唯一性**
   - 每个配置项的 `id` 必须唯一
   - 建议使用分段ID：
     - 1001-1999: 武器
     - 2001-2999: 消耗品
     - 3001-3999: 防具
     - 4001-4999: 货币/材料
     - 5001-5999: 特殊物品

3. **配置验证**
   - 修改后建议使用 JSON 验证工具检查格式
   - 在线工具：https://jsonlint.com/

---

## 📖 配置表详解

### 1. items.json - 物品配置

#### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | number | 物品ID（唯一） | 1001 |
| name | string | 物品名称 | "新手剑" |
| type | string | 物品类型 | "weapon", "consumable", "armor" |
| rarity | string | 稀有度 | "common", "rare", "epic", "legendary" |
| level | number | 需求等级 | 1 |
| attack | number | 攻击力（武器） | 10 |
| defense | number | 防御力（防具） | 5 |
| healAmount | number | 治疗量（药水） | 50 |
| description | string | 物品描述 | "初始装备" |
| maxStackSize | number | 最大堆叠数 | 99 |
| canTrade | boolean | 是否可交易 | true |
| canDrop | boolean | 是否可丢弃 | true |
| sellPrice | number | 出售价格 | 50 |

#### 示例

```json
{
  "id": 1001,
  "name": "新手剑",
  "type": "weapon",
  "rarity": "common",
  "level": 1,
  "attack": 10,
  "description": "初始装备，攻击力较低",
  "maxStackSize": 1,
  "canTrade": true,
  "canDrop": true,
  "sellPrice": 50
}
```

---

### 2. monsters.json - 怪物配置

#### 字段说明

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| id | number | 怪物ID（唯一） | 10001 |
| name | string | 怪物名称 | "史莱姆" |
| type | string | 怪物类型 | "normal", "elite", "boss" |
| level | number | 怪物等级 | 1 |
| hp | number | 生命值 | 50 |
| mp | number | 魔法值 | 0 |
| attack | number | 攻击力 | 5 |
| defense | number | 防御力 | 2 |
| speed | number | 移动速度 | 10 |
| expReward | number | 经验奖励 | 10 |
| goldReward | number | 金币奖励 | 5 |
| dropItems | array | 掉落物品列表 | 见下方 |
| skills | array | 技能ID列表 | [10101, 10102] |
| description | string | 怪物描述 | "最常见的怪物" |

#### 掉落物品格式

```json
"dropItems": [
  {
    "itemId": 2001,        // 物品ID
    "probability": 0.3     // 掉落概率（0.0-1.0）
  }
]
```

#### 示例

```json
{
  "id": 10001,
  "name": "史莱姆",
  "type": "normal",
  "level": 1,
  "hp": 50,
  "mp": 0,
  "attack": 5,
  "defense": 2,
  "speed": 10,
  "expReward": 10,
  "goldReward": 5,
  "dropItems": [
    {"itemId": 2001, "probability": 0.3},
    {"itemId": 4001, "probability": 1.0}
  ],
  "skills": [],
  "description": "最常见的怪物，适合新手练级"
}
```

---

## 🔥 热更新（计划中）

Game Server 将支持配置表热更新功能：
- 修改配置文件后，Game Server 自动检测并重新加载
- 无需重启服务器
- 目前此功能正在开发中，暂时需要重启 Game Server

---

## 📞 联系方式

如有配置问题，请联系开发团队：
- 项目地址：Laya Game Server Framework
- 文档地址：../docs/

---

**最后更新**: 2025-10-28
