# Laya Game Server - 部署目录

## 📁 目录结构

```
output/
├── bin/                    # 启动脚本目录
│   ├── start-all.bat      # 启动所有服务器
│   ├── stop-all.bat       # 停止所有服务器
│   ├── start-*.bat        # 单独启动各服务器
│   ├── restart-game-server.bat  # 重启Game Server（策划常用）
│   └── view-logs.bat      # 查看日志
│
├── config/                 # 配置文件目录
│   ├── application-common.yml  # 公共配置
│   ├── tables/            # 游戏配置表（策划维护）
│   │   ├── items.json     # 物品配置
│   │   └── monsters.json  # 怪物配置
│   └── README.md          # 配置说明文档
│
├── servers/                # 服务器JAR包目录
│   ├── login-server/
│   ├── gateway-server/
│   ├── central-data-server/
│   └── game-server/
│
├── logs/                   # 日志目录
│   ├── login-server.log
│   ├── gateway-server.log
│   ├── central-data-server.log
│   └── game-server.log
│
├── data/                   # 运行时数据目录
│
└── README.md              # 本文件
```

---

## 🚀 快速开始

### 1. 首次部署

1. **构建项目**
   ```bash
   # 在项目根目录运行
   build-and-deploy.bat
   ```

2. **配置环境**
   - 检查 `config/application-common.yml`
   - 确认 Redis 和 MySQL 连接信息

3. **启动服务器**
   ```bash
   cd output/bin
   start-all.bat
   ```

4. **验证启动**
   - Central Data Server: http://localhost:8083/actuator/health
   - Login Server: http://localhost:8081/actuator/health
   - Gateway Server: http://localhost:8082/actuator/health
   - Game Server: http://localhost:8084/actuator/health

---

## 📋 常用操作

### 启动/停止服务器

```bash
# 启动所有服务器
cd bin
start-all.bat

# 停止所有服务器
stop-all.bat

# 单独启动某个服务器
start-game-server.bat
start-gateway-server.bat
start-central-server.bat
start-login-server.bat

# 重启Game Server（策划修改配置后）
restart-game-server.bat
```

### 查看日志

```bash
# 方式1：使用脚本
cd bin
view-logs.bat

# 方式2：直接打开
notepad ..\logs\game-server.log

# 方式3：实时查看（需要安装tail工具）
tail -f ..\logs\game-server.log
```

### 修改配置

#### 策划修改游戏配置表
1. 编辑 `config/tables/*.json`
2. 运行 `bin/restart-game-server.bat`
3. 查看日志确认加载成功

#### 开发人员修改服务器代码
1. 修改源码
2. 运行项目根目录下的 `build-and-deploy.bat`
3. 运行 `bin/stop-all.bat` 然后 `bin/start-all.bat`

---

## 🔧 配置说明

### 公共配置（application-common.yml）

包含所有服务器共享的配置：
- **Redis**: 数据缓存和会话管理
- **MySQL**: 持久化存储
- **Jackson**: JSON序列化
- **日志**: 日志格式和级别

详细说明见：[config/README.md](config/README.md)

### 游戏配置表（config/tables/）

由**策划**维护的游戏配置：
- **items.json**: 物品配置（武器、药水、防具等）
- **monsters.json**: 怪物配置（属性、掉落、技能等）
- 更多配置表可按需添加

详细说明见：[config/README.md](config/README.md)

---

## 🛠️ 环境要求

### 必需环境

1. **JDK 21+**
   ```bash
   java -version
   # 应显示：java version "21.x.x" 或更高
   ```

2. **Redis** (可选，用于缓存)
   ```bash
   # Windows: 下载 Redis for Windows
   # Linux: sudo apt-get install redis-server
   redis-cli ping
   # 应返回：PONG
   ```

3. **MySQL 8.0+** (可选，用于持久化)
   ```bash
   mysql --version
   # 应显示：mysql Ver 8.0.x
   ```

### 推荐工具

- **Notepad++** 或 **VS Code**: 编辑配置文件
- **Postman**: 测试API接口
- **Redis Desktop Manager**: 查看Redis数据
- **MySQL Workbench**: 管理MySQL数据库

---

## 📊 服务器架构

```
┌─────────────┐
│   客户端    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│Login Server │ (8081)
└──────┬──────┘
       │
       ↓
┌─────────────┐     ┌──────────────────┐
│Gateway Server│────→│Central Data Server│ (8083)
│   (8082)    │     │   (Redis/MySQL)   │
└──────┬──────┘     └──────────────────┘
       │
       ↓
┌─────────────┐
│Game Server  │ (8084)
│ (游戏逻辑) │
└─────────────┘
```

### 服务器职责

| 服务器 | 端口 | 职责 |
|--------|------|------|
| **Login Server** | 8081 | 用户登录、注册 |
| **Gateway Server** | 8082 | WebSocket网关、消息转发 |
| **Central Data Server** | 8083 | 会话管理、数据中心 |
| **Game Server** | 8084 | 游戏逻辑、房间管理、背包系统 |

---

## 🐛 故障排查

### 服务器启动失败

1. **检查端口占用**
   ```bash
   netstat -ano | findstr "8081"
   netstat -ano | findstr "8082"
   netstat -ano | findstr "8083"
   netstat -ano | findstr "8084"
   ```

2. **查看日志**
   ```bash
   cd logs
   type game-server.log
   ```

3. **检查Java版本**
   ```bash
   java -version
   # 必须是 JDK 21 或更高
   ```

### Redis连接失败

1. **启动Redis服务**
   ```bash
   # Windows
   redis-server.exe

   # Linux
   sudo service redis-server start
   ```

2. **测试连接**
   ```bash
   redis-cli ping
   # 应返回 PONG
   ```

### MySQL连接失败

1. **检查MySQL服务**
   ```bash
   # Windows
   net start MySQL80

   # Linux
   sudo service mysql start
   ```

2. **验证用户权限**
   ```sql
   mysql -u laya_user -p
   # 输入密码: laya123456
   ```

---

## 📞 获取帮助

### 文档

- **配置说明**: [config/README.md](config/README.md)
- **API文档**: http://localhost:8083/swagger-ui.html (启动后访问)
- **健康检查**: http://localhost:8084/actuator/health

### 常见问题

**Q: 修改配置表后需要重启所有服务器吗？**
A: 不需要，只需运行 `bin/restart-game-server.bat` 重启 Game Server 即可。

**Q: 如何查看实时日志？**
A: 运行 `tail -f logs/game-server.log`（需要安装 tail 工具）。

**Q: 如何修改服务器端口？**
A: 编辑 `servers/*/application.yml` 中的 `server.port` 配置项。

**Q: 策划可以直接修改哪些文件？**
A: 策划只需要修改 `config/tables/` 目录下的 JSON 文件。

---

## 🔐 安全建议

### 生产环境部署

1. **修改默认密码**
   - Redis 密码
   - MySQL 密码
   - JWT 密钥

2. **配置防火墙**
   ```bash
   # 只允许内网访问
   # 8081-8084 端口不对外开放
   ```

3. **启用HTTPS**
   - 配置 SSL 证书
   - 使用 Nginx 反向代理

4. **定期备份**
   - 数据库备份
   - 配置文件备份
   - 日志文件归档

---

## 📝 版本信息

- **版本**: 1.0.0
- **最后更新**: 2025-10-28
- **Java版本**: JDK 21+
- **Spring Boot**: 3.2.0

---

**Laya Game Server Framework** - 轻量级游戏服务器框架
