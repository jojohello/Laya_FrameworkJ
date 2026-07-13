# 🔒 安全配置指南

> 生产环境安全配置最佳实践 - 支持多实例部署

---

## 📋 架构决策说明

### 为什么不使用环境变量？

**游戏服务器的特殊需求**：
- 需要在同一台机器上启动**多个实例**
- 每个实例需要**独立的配置**（不同端口、数据库、密钥）
- 环境变量在同一进程空间是**共享的**，无法实现实例级隔离

**选择命令行参数的原因**：
- ✅ 每个实例独立配置
- ✅ 支持动态扩缩容
- ✅ Spring Boot原生支持，优先级最高

---

## 🎯 生产环境部署方案

### 方案1：命令行参数（推荐）

#### Login Server 多实例部署

**实例1**（服务区1）：
```bash
java -jar login-server.jar \
  --server.port=8081 \
  --spring.datasource.url=jdbc:mysql://db1.internal:3306/game_zone1 \
  --spring.datasource.username=zone1_user \
  --spring.datasource.password=STRONG_PASSWORD_1 \
  --jwt.secret=$(openssl rand -base64 32) \
  --jwt.expiration=3600 \
  --central.server.url=http://central1.internal:8083
```

**实例2**（服务区2）：
```bash
java -jar login-server.jar \
  --server.port=8091 \
  --spring.datasource.url=jdbc:mysql://db2.internal:3306/game_zone2 \
  --spring.datasource.username=zone2_user \
  --spring.datasource.password=STRONG_PASSWORD_2 \
  --jwt.secret=$(openssl rand -base64 32) \
  --jwt.expiration=3600 \
  --central.server.url=http://central2.internal:8083
```

#### Gateway Server 多实例部署

**实例1**：
```bash
java -jar gateway-server.jar \
  --server.port=8082 \
  --laya.gateway.server-ip=gateway1.internal \
  --laya.gateway.central-server.host=central1.internal \
  --laya.gateway.websocket.max-connections=10000
```

**实例2**：
```bash
java -jar gateway-server.jar \
  --server.port=8092 \
  --laya.gateway.server-ip=gateway2.internal \
  --laya.gateway.central-server.host=central2.internal \
  --laya.gateway.websocket.max-connections=10000
```

---

### 方案2：配置文件 + 命令行参数

**为每个实例创建独立配置文件**：

```bash
# application-zone1.yml
server:
  port: 8081
spring:
  datasource:
    url: jdbc:mysql://db1.internal:3306/game_zone1
    username: zone1_user
    password: ${DB_PASSWORD}  # 从命令行传入
jwt:
  secret: ${JWT_SECRET}  # 从命令行传入
```

**启动**：
```bash
java -jar login-server.jar \
  --spring.profiles.active=zone1 \
  --DB_PASSWORD=STRONG_PASSWORD_1 \
  --JWT_SECRET=$(cat /secure/zone1.secret)
```

---

### 方案3：密钥管理服务（生产推荐）

**使用HashiCorp Vault**：

```bash
# 从Vault获取密钥
export DB_PASS=$(vault kv get -field=password secret/game/zone1/db)
export JWT_SECRET=$(vault kv get -field=secret secret/game/zone1/jwt)

# 启动
java -jar login-server.jar \
  --spring.datasource.password=$DB_PASS \
  --jwt.secret=$JWT_SECRET
```

**使用AWS Secrets Manager**：

```bash
# 从AWS获取密钥
export DB_PASS=$(aws secretsmanager get-secret-value \
  --secret-id game/zone1/db --query SecretString --output text)

# 启动
java -jar login-server.jar \
  --spring.datasource.password=$DB_PASS
```

---

## 🔐 JWT密钥生成

### 生成强随机密钥

**方法1：OpenSSL（推荐）**
```bash
# 生成256位Base64编码密钥
openssl rand -base64 32

# 输出示例:
# 4xK8vZJ+3mN2pQ7tL9wR1sE5fY6gH8iU0aV3bW4cX=
```

**方法2：Python**
```python
import secrets
print(secrets.token_urlsafe(32))
```

**方法3：在线工具**
- https://randomkeygen.com/
- 选择 "Fort Knox Passwords" 256-bit

### 密钥存储最佳实践

1. **开发环境**：
   - 使用默认密钥（已在application.yml中配置）
   - 不提交到Git

2. **测试环境**：
   - 生成测试专用密钥
   - 存储在CI/CD环境变量中

3. **生产环境**：
   - 使用密钥管理服务（Vault/AWS Secrets Manager）
   - 或存储在安全的配置中心
   - 定期轮换（建议3-6个月）

---

## 🛡️ 安全检查清单

### 部署前检查

- [ ] JWT密钥长度≥32字节（256位）
- [ ] 数据库密码强度≥12位，包含大小写字母、数字、特殊字符
- [ ] Redis密码已设置（如果启用）
- [ ] 启动脚本权限为700（仅owner可执行）
- [ ] 敏感配置不在代码仓库中
- [ ] 日志中已脱敏Token和密码

### 运行时检查

- [ ] JVM参数已优化（堆内存、GC策略）
- [ ] 连接池大小合理配置
- [ ] 监控和告警已配置
- [ ] 日志轮转和归档已配置

---

## 📝 启动脚本示例

### Systemd服务配置（Linux）

```ini
# /etc/systemd/system/login-server-zone1.service
[Unit]
Description=Laya Login Server - Zone 1
After=network.target

[Service]
Type=simple
User=gameserver
Group=gameserver
WorkingDirectory=/opt/laya-game

# 从安全文件读取密钥
EnvironmentFile=/etc/laya-game/zone1.env

ExecStart=/usr/bin/java \
  -Xms1g -Xmx2g -XX:+UseG1GC \
  -jar /opt/laya-game/login-server.jar \
  --server.port=8081 \
  --spring.datasource.password=${DB_PASSWORD} \
  --jwt.secret=${JWT_SECRET}

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**/etc/laya-game/zone1.env**（权限600）：
```bash
DB_PASSWORD=STRONG_PASSWORD_1
JWT_SECRET=YOUR_256BIT_SECRET_KEY
```

### Docker Compose

```yaml
version: '3.8'

services:
  login-server-zone1:
    image: laya-game/login-server:1.0.0
    container_name: login-server-zone1
    ports:
      - "8081:8081"
    environment:
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD_ZONE1}
      - JWT_SECRET=${JWT_SECRET_ZONE1}
    command: >
      --server.port=8081
      --spring.datasource.url=jdbc:mysql://mysql-zone1:3306/game_zone1
    restart: unless-stopped

  login-server-zone2:
    image: laya-game/login-server:1.0.0
    container_name: login-server-zone2
    ports:
      - "8091:8081"
    environment:
      - SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD_ZONE2}
      - JWT_SECRET=${JWT_SECRET_ZONE2}
    command: >
      --server.port=8081
      --spring.datasource.url=jdbc:mysql://mysql-zone2:3306/game_zone2
    restart: unless-stopped
```

**.env文件**（不提交到Git）：
```bash
DB_PASSWORD_ZONE1=STRONG_PASSWORD_1
JWT_SECRET_ZONE1=YOUR_SECRET_1
DB_PASSWORD_ZONE2=STRONG_PASSWORD_2
JWT_SECRET_ZONE2=YOUR_SECRET_2
```

---

## 🎯 总结

### 开发环境
- ✅ 使用`application.yml`默认配置
- ✅ 在IDEA中直接运行
- ✅ 默认密钥已配置（仅用于开发）

### 生产环境
- ✅ 通过命令行参数传入敏感配置
- ✅ 使用强随机密钥
- ✅ 支持多实例独立配置
- ✅ 使用密钥管理服务（推荐）

### 关键原则
1. **配置分层**：开发默认 < 配置文件 < 命令行参数
2. **密钥隔离**：每个实例、每个区服独立密钥
3. **最小权限**：启动脚本和配置文件严格权限控制
4. **定期轮换**：JWT密钥定期更换
