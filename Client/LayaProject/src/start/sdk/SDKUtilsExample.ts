// jojohello 2025-01-XX
// SDKUtils 使用示例

import { SDKUtils } from "./SDKUtils";

/**
 * SDKUtils 使用示例类
 */
export class SDKUtilsExample {
    
    /**
     * 示例1: 基本的POST请求
     */
    public static async exampleBasicPost(): Promise<void> {
        try {
            console.log("=== 示例1: 基本的POST请求 ===");
            
            const response = await SDKUtils.post("https://api.example.com/login", {
                username: "testuser",
                password: "testpass"
            });
            
            console.log("POST请求成功:", response);
        } catch (error) {
            console.error("POST请求失败:", error);
        }
    }
    
    /**
     * 示例2: 基本的GET请求
     */
    public static async exampleBasicGet(): Promise<void> {
        try {
            console.log("=== 示例2: 基本的GET请求 ===");
            
            const response = await SDKUtils.get("https://api.example.com/user", {
                userId: "12345"
            });
            
            console.log("GET请求成功:", response);
        } catch (error) {
            console.error("GET请求失败:", error);
        }
    }
    
    /**
     * 示例3: 自定义超时时间的请求
     */
    public static async exampleCustomTimeout(): Promise<void> {
        try {
            console.log("=== 示例3: 自定义超时时间（5秒）===");
            
            const response = await SDKUtils.post(
                "https://api.example.com/slow-api",
                { data: "test" },
                5000 // 5秒超时
            );
            
            console.log("自定义超时请求成功:", response);
        } catch (error) {
            console.error("自定义超时请求失败:", error);
        }
    }
    
    /**
     * 示例4: 完整的HTTP请求配置
     */
    public static async exampleFullConfig(): Promise<void> {
        try {
            console.log("=== 示例4: 完整的HTTP请求配置 ===");
            
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
            
            console.log("完整配置请求成功:", response);
        } catch (error) {
            console.error("完整配置请求失败:", error);
        }
    }
    
    /**
     * 示例5: 带超时的Promise包装器
     */
    public static async exampleWithTimeout(): Promise<void> {
        try {
            console.log("=== 示例5: 带超时的Promise包装器 ===");
            
            // 模拟一个可能很慢的操作
            const slowOperation = new Promise<string>((resolve) => {
                setTimeout(() => {
                    resolve("操作完成");
                }, 5000); // 5秒后完成
            });
            
            // 使用3秒超时包装
            const result = await SDKUtils.withTimeout(
                slowOperation,
                3000, // 3秒超时
                "慢操作超时了"
            );
            
            console.log("带超时的操作成功:", result);
        } catch (error) {
            console.error("带超时的操作失败:", error);
        }
    }
    
    /**
     * 示例6: 微信API调用
     */
    public static async exampleWxApiCall(): Promise<void> {
        try {
            console.log("=== 示例6: 微信API调用 ===");
            
            // 模拟微信API调用
            const result = await SDKUtils.wxApiCall((success, fail) => {
                // 模拟微信API
                setTimeout(() => {
                    success({ code: "mock_code_123" });
                }, 1000);
            }, 3000); // 3秒超时
            
            console.log("微信API调用成功:", result);
        } catch (error) {
            console.error("微信API调用失败:", error);
        }
    }
    
    /**
     * 示例7: 设备信息获取
     */
    public static exampleDeviceInfo(): void {
        console.log("=== 示例7: 设备信息获取 ===");
        
        const deviceInfo = SDKUtils.getDeviceInfo();
        console.log("设备信息:", deviceInfo);
        
        const isOnline = SDKUtils.isNetworkAvailable();
        console.log("网络状态:", isOnline ? "在线" : "离线");
    }
    
    /**
     * 示例8: 工具函数
     */
    public static exampleUtilityFunctions(): void {
        console.log("=== 示例8: 工具函数 ===");
        
        const uniqueId = SDKUtils.generateUniqueId("user");
        console.log("生成的唯一ID:", uniqueId);
        
        const timestamp = SDKUtils.formatTimestamp(Date.now());
        console.log("格式化的时间戳:", timestamp);
    }
    
    /**
     * 运行所有示例
     */
    public static async runAllExamples(): Promise<void> {
        console.log("开始运行 SDKUtils 使用示例...");
        
        // 同步示例
        this.exampleDeviceInfo();
        this.exampleUtilityFunctions();
        
        // 异步示例
        await this.exampleBasicPost();
        await this.exampleBasicGet();
        await this.exampleCustomTimeout();
        await this.exampleFullConfig();
        await this.exampleWithTimeout();
        await this.exampleWxApiCall();
        
        console.log("所有示例运行完成！");
    }
}

// 使用示例：
// SDKUtilsExample.runAllExamples();
