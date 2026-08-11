# SDKUtils 使用指南

`SDKUtils` 是一个通用的SDK工具类，提供了HTTP请求、超时处理、微信API调用等功能。

## 主要功能

### 1. HTTP请求功能

#### 基本POST请求
```typescript
import { SDKUtils } from "./SDKUtils";

// 基本POST请求（默认3秒超时）
const response = await SDKUtils.post("https://api.example.com/login", {
    username: "testuser",
    password: "testpass"
});
```

#### 基本GET请求
```typescript
// 基本GET请求（默认3秒超时）
const response = await SDKUtils.get("https://api.example.com/user", {
    userId: "12345"
});
```

#### 自定义超时时间
```typescript
// 自定义5秒超时
const response = await SDKUtils.post(
    "https://api.example.com/slow-api",
    { data: "test" },
    5000 // 5秒超时
);
```

#### 完整配置请求
```typescript
const response = await SDKUtils.httpRequest({
    url: "https://api.example.com/upload",
    method: "POST",
    data: { file: "test.txt", content: "Hello World" },
    headers: [
        ["Content-Type", "application/json"],
        ["Authorization", "Bearer token123"]
    ],
    timeout: 10000, // 10秒超时
    dataType: "json"
});
```

### 2. 超时处理功能

#### Promise超时包装器
```typescript
// 为任何Promise添加超时处理
const slowOperation = new Promise<string>((resolve) => {
    setTimeout(() => resolve("操作完成"), 5000);
});

const result = await SDKUtils.withTimeout(
    slowOperation,
    3000, // 3秒超时
    "慢操作超时了"
);
```

#### 微信API调用包装器
```typescript
// 微信API调用（带超时）
const result = await SDKUtils.wxApiCall((success, fail) => {
    (window as any).wx.login({
        success: success,
        fail: fail
    });
}, 3000); // 3秒超时
```

### 3. 微信登录模式

`WechatMiniGameSDK` 始终负责微信小游戏平台接入。`MyGameConfig.forceAccountLogin=true` 时使用 `GUEST` 类型的短时开发凭据，仅供 Local/Test 建立测试账号和验证公共登录/UI 链路，不调用微信 `code2Session`，也不代表微信身份；开关为 `false` 时使用 `wx.login()` 返回的真实临时代码，Production 强制采用此模式。仅在用户已经授权且 `wx.getUserInfo(withCredentials=true)` 成功时附带 `encryptedData/iv`；未授权或读取失败时仍只凭 code 登录。真实微信路径不上传 `openid`、`unionid` 或内部 `userId`；服务端通过 `code2Session` 校验并解析账号。

LayaAir 在小游戏适配器中会把非 2xx HTTP 状态派发为 `ERROR`。`SDKUtils` 会从底层请求对象解析结构化 JSON 错误体，使登录调用方仍能消费服务端 `LoginResponse`；无法解析契约响应时才抛出网络/HTTP 错误，且不记录原始响应体。

### 4. 工具函数

#### 设备信息获取
```typescript
const deviceInfo = SDKUtils.getDeviceInfo();
console.log("设备信息:", deviceInfo);
// 输出: { userAgent, platform, language, screenWidth, screenHeight, pixelRatio, isOnline }
```

#### 网络状态检查
```typescript
const isOnline = SDKUtils.isNetworkAvailable();
console.log("网络状态:", isOnline ? "在线" : "离线");
```

#### 生成唯一ID
```typescript
const uniqueId = SDKUtils.generateUniqueId("user");
console.log("生成的唯一ID:", uniqueId);
// 输出: user_1703123456789_abc123def
```

#### 格式化时间戳
```typescript
const timestamp = SDKUtils.formatTimestamp(Date.now());
console.log("格式化的时间戳:", timestamp);
// 输出: 2023-12-21T10:30:45.123Z
```

## 接口定义

### HttpRequestConfig
```typescript
interface HttpRequestConfig {
    url: string;                    // 请求URL
    method?: "GET" | "POST" | "PUT" | "DELETE"; // 请求方法
    data?: any;                     // 请求数据
    headers?: string[][];           // 请求头
    timeout?: number;               // 超时时间（毫秒）
    dataType?: "text" | "json" | "xml" | "binary"; // 数据类型
}
```

### HttpResponse
```typescript
interface HttpResponse<T = any> {
    success: boolean;               // 是否成功
    data: T;                        // 响应数据
    statusCode?: number;            // 状态码
    headers?: any;                  // 响应头
}
```

## 超时处理机制

### 特性
- **防重复处理**: 使用 `isCompleted` 标记确保每个请求只处理一次
- **资源清理**: 自动清除定时器，避免内存泄漏
- **忽略延迟响应**: 超时后即使收到响应也会忽略处理
- **详细日志**: 完整的超时和错误日志记录

### 超时流程
```
发起请求 → 设置超时定时器 → 等待响应
    ↓
超时触发 → 标记完成 → 忽略后续响应
    ↓
收到响应 → 检查是否已完成 → 处理或忽略
```

## 使用示例

### 在WebSDK中使用
```typescript
private async sendLoginRequest(requestData: LoginRequest): Promise<LoginResponse> {
    try {
        const response = await SDKUtils.post<LoginResponse>(
            `${this._serverUrl}/login`,
            requestData,
            3000 // 3秒超时
        );
        
        if (response.success) {
            return response;
        } else {
            throw new Error(response.errorMessage || "登录失败");
        }
    } catch (error) {
        console.error("登录请求失败", error);
        throw error;
    }
}
```

### 在微信SDK中使用
```typescript
private async getWechatCode(): Promise<string> {
    const result = await SDKUtils.wxApiCall<any>((success, fail) => {
        (window as any).wx.login({
            success: success,
            fail: fail
        });
    }, 3000); // 3秒超时
    
    return result.code;
}
```

## 错误处理

### 超时错误
```typescript
try {
    const response = await SDKUtils.post(url, data, 3000);
} catch (error) {
    if (error.message.includes("超时")) {
        console.warn("请求超时，请检查网络连接");
    }
}
```

### 网络错误
```typescript
try {
    const response = await SDKUtils.get(url);
} catch (error) {
    if (error.message.includes("网络请求失败")) {
        console.error("网络连接失败");
    }
}
```

## 最佳实践

1. **合理设置超时时间**: 根据API的响应时间特点设置合适的超时时间
2. **错误处理**: 始终使用 try-catch 包装异步请求
3. **用户提示**: 将技术错误转换为用户易懂的提示信息
4. **日志记录**: 使用详细的日志便于调试和问题排查
5. **资源清理**: 确保在组件销毁时清理相关资源

## 注意事项

1. 默认超时时间为3秒，可根据需要调整
2. 超时后会自动忽略后续的响应，避免重复处理
3. `wx.login` 或登录 HTTP 请求失败时回到重试状态；昵称头像未授权、权限失效或资料 API 失败不得阻断账号登录
4. 所有网络请求都会自动添加 `Content-Type: application/json` 头
5. GET请求的参数会自动转换为查询字符串
