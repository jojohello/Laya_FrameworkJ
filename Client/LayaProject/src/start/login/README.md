# 登录模块说明

## 概述
登录模块提供了完整的登录功能，支持多种登录方式，包括开发登录、微信登录和游客登录。

## 文件结构
```
src/start/
├── Config.ts           # 配置文件（平台和服务器URL）

├── login/
│   ├── LoginMgr.ts     # 登录管理器主类
│   └── README.md       # 说明文档
└── sdk/
    ├── ISDK.ts         # SDK接口定义
    ├── WebSDK.ts       # Web平台实现
    ├── WechatMiniGameSDK.ts # 微信小游戏平台实现
    └── SDKMgr.ts       # 主管理器（类型定义和工厂）
```

## 核心类说明

### SDKMgr (SDK管理器)
- **功能**: 根据不同平台提供统一的登录接口
- **架构**: 采用策略模式，自动根据环境选择对应的SDK实现
- **支持的平台**: Web、微信小游戏
- **支持的登录方式**: 开发登录、微信登录、游客登录
- **单例模式**: 全局唯一实例

### 配置系统
- **Config**: 静态配置类，发布时手动修改平台和登录服务器URL

### 平台SDK实现
- **ISDK**: SDK接口，定义所有平台必须实现的方法（getPlatform、login、setServerUrl）
- **WebSDK**: Web平台实现，使用开发登录方式
- **WechatMiniGameSDK**: 微信小游戏平台实现，自动获取微信授权码进行登录

### LoginMgr (登录管理器)
- **功能**: 登录逻辑的主入口，通过SDKMgr调用登录接口
- **特性**: 
  - 自动检测运行环境并设置合适的平台
  - 本地登录信息缓存和验证
  - 登录状态管理
  - 自动登录功能
- **单例模式**: 全局唯一实例

## 使用方法

### 1. 配置修改
```typescript
// 在 src/start/Config.ts 中修改以下配置：

// 设置当前平台
public static readonly CURRENT_PLATFORM: Platform = Platform.WEB;

// 设置各平台登录服务器URL
public static readonly LOGIN_SERVER_URLS: { [key in Platform]: string } = {
    [Platform.WEB]: "http://localhost:8081/api",
    [Platform.ANDROID]: "http://localhost:8081/api", 
    [Platform.IOS]: "http://localhost:8081/api",
    [Platform.MINIGAME]: "http://localhost:8081/api"
};
```

### 2. 基本初始化
```typescript
// 获取登录管理器实例
const loginMgr = LoginMgr.instance;

// 检查登录状态
if (loginMgr.isLoggedIn()) {
    console.log("用户已登录");
    const loginInfo = loginMgr.getLoginInfo();
    console.log("登录信息:", loginInfo);
}
```

### 3. 自动登录
```typescript
try {
    // 自动登录（根据配置的平台选择合适的登录方式）
    const result = await loginMgr.autoLogin();
    console.log("登录成功:", result);
} catch (error) {
    console.error("登录失败:", error);
}
```

### 4. 手动登录
```typescript
// 统一登录接口（根据配置的平台自动选择登录方式）
const result = await loginMgr.login("jojohello"); // 账号名称在微信平台下无效
```

### 5. 登出
```typescript
loginMgr.logout();
```

### 6. 获取上次登录账号
```typescript
const lastAccount = loginMgr.getLastLoginAccount();
if (lastAccount) {
    console.log("上次登录账号:", lastAccount);
    // 可以在登录界面显示上次登录的账号
}
```

### 7. 配置查询
```typescript
// 获取当前平台
const platform = Config.getPlatform();

// 获取当前平台的登录URL
const loginUrl = Config.getCurrentLoginServerUrl();

// 获取指定平台的登录URL
const webLoginUrl = Config.getLoginServerUrl(Platform.WEB);

// 获取所有平台配置
const allUrls = Config.getAllLoginServerUrls();

// 检测是否微信环境
const isWechat = Config.isWechatEnvironment();
```

## 登录流程

### Web平台登录流程
1. 调用 `loginMgr.login(accountName)`
2. WebSDK生成开发授权码: `dev_${accountName}_${timestamp}`
3. 发送POST请求到登录服务器
4. 服务器验证并返回Token
5. 保存登录信息到本地存储

### 微信小游戏登录流程
1. 调用 `loginMgr.login()` (accountName参数无效)
2. WechatMiniGameSDK自动获取微信授权码 (code)
3. 获取微信用户信息 (可选)
4. 发送POST请求到登录服务器
5. 服务器验证微信授权码
6. 返回Token和用户信息

### 自动登录流程
1. 检查是否已登录（当前会话）
2. 如果已登录，直接返回登录信息
3. 如果未登录，根据环境选择登录方式
4. 执行相应的登录流程
5. 登录成功后记录账号到本地存储

## 服务器接口

### 登录请求格式
```http
POST /api/login
Content-Type: application/json

{
    "type": "GUEST|WECHAT",
    "authCode": "授权码",
    "platform": "web|miniprogram",
    "deviceInfo": "设备信息",
    "version": "1.0.0",
    "extraParams": "额外参数JSON字符串"
}
```

### 登录响应格式
```json
{
    "success": true,
    "token": "JWT令牌",
    "userId": "用户ID",
    "loginTimestamp": 1703123456789,
    "nickname": "用户昵称",
    "avatar": "头像URL"
}
```

## 本地存储

登录成功后，只记录上次登录的账号：
- `lastLoginAccount`: 上次登录成功的用户ID

**注意**: 不保存Token、时间戳等敏感信息，每次启动都需要重新登录。

## 错误处理

所有登录方法都会抛出异常，需要适当的错误处理：
```typescript
try {
    const result = await loginMgr.autoLogin();
    console.log("登录成功:", result);
} catch (error) {
    console.error("登录失败:", error);
    // 显示错误提示给用户
}
```

## 平台配置

系统根据Config.ts中的CURRENT_PLATFORM配置确定当前平台：
- `Platform.WEB` - Web平台
- `Platform.ANDROID` - Android平台
- `Platform.IOS` - iOS平台  
- `Platform.MINIGAME` - 微信小游戏平台

## 注意事项

1. **配置修改**: 配置是静态的，需要直接修改Config.ts文件
2. **平台发布**: 不同平台需要发布不同的版本，修改CURRENT_PLATFORM
3. **服务器地址**: 需要根据实际部署情况修改LOGIN_SERVER_URLS
4. **本地存储**: 只记录上次登录账号，不保存Token等敏感信息
5. **微信环境**: 微信登录只能在微信环境中使用
6. **错误处理**: 建议在UI层面提供友好的错误提示
7. **网络请求**: 使用Laya的HttpRequest进行网络通信
8. **重新登录**: 每次启动应用都需要重新登录

## 示例代码

参考 `Config.ts` 文件中的注释，展示了如何修改配置。
