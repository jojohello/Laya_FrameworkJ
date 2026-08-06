// jojohello 2025-08-05
// SDK工具类，提供通用的HTTP请求和超时处理功能

/**
 * HTTP请求配置接口
 */
export interface HttpRequestConfig {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    data?: any;
    headers?: string[][];
    timeout?: number; // 超时时间，单位毫秒，默认3000ms
    dataType?: "text" | "json" | "xml" | "binary";
}

/**
 * HTTP响应接口
 */
export interface HttpResponse<T = any> {
    success: boolean;
    data: T;
    statusCode?: number;
    headers?: any;
}

/**
 * SDK工具类
 */
export class SDKUtils {
    
    /**
     * 默认超时时间（毫秒）
     */
    private static readonly DEFAULT_TIMEOUT = 3000;
    
    /**
     * 发送HTTP请求（带超时处理）
     * @param config 请求配置
     * @returns Promise<HttpResponse>
     */
    public static async httpRequest<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
        return new Promise((resolve, reject) => {
            const http = new Laya.HttpRequest();
            let isCompleted = false; // 标记是否已完成（成功或失败）
            
            // 设置超时时间
            const timeout = config.timeout || SDKUtils.DEFAULT_TIMEOUT;
            const timeoutHandler = () => {
                if (!isCompleted) {
                    isCompleted = true;
                    reject(new Error(`请求超时（${timeout}ms）`));
                }
            };
            Laya.timer.once(timeout, null, timeoutHandler);
            
            // 请求成功回调
            http.on(Laya.Event.COMPLETE, (data: any) => {
                if (isCompleted) return;
                
                isCompleted = true;
                Laya.timer.clear(null, timeoutHandler); // 清除超时定时器
                
                try {
                    let parsedData: T;
                    
                    // 根据dataType解析数据
                    if (config.dataType === "json" || !config.dataType) {
                        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
                    } else {
                        parsedData = data as T;
                    }
                    const response: HttpResponse<T> = {
                        success: true,
                        data: parsedData
                    };
                    
                    resolve(response);
                    
                } catch (error) {
                    // Responses can contain login tokens or platform data. Never echo
                    // an unparsed response body into client logs.
                    console.error("SDKUtils: 响应解析失败", error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    reject(new Error(`响应解析失败: ${errorMessage}`));
                }
            });
            
            // 请求失败回调
            http.on(Laya.Event.ERROR, (error: any) => {
                if (isCompleted) return;
                
                isCompleted = true;
                Laya.timer.clear(null, timeoutHandler); // 清除超时定时器
                console.error("SDKUtils: HTTP请求失败", error);
                reject(new Error("网络请求失败"));
            });
            
            // 发送请求
            const method = config.method || "GET";
            const dataType = config.dataType || "json";
            // 转换headers格式 - Laya需要的是 ["Content-Type", "application/json"] 格式
            const defaultHeaders = ["Content-Type", "application/json"];
            const headers = config.headers ? 
                config.headers.reduce((acc, header) => acc.concat(header), [] as string[]) : // 将 [["Content-Type", "application/json"]] 转换为 ["Content-Type", "application/json"]
                defaultHeaders;
            
            if (method === "GET") {
                // GET请求，将数据作为查询参数
                const queryString = config.data ? SDKUtils.objectToQueryString(config.data) : "";
                const fullUrl = queryString ? `${config.url}?${queryString}` : config.url;
                
                // 转换headers格式 - Laya需要的是 ["Content-Type", "application/json"] 格式
                http.send(fullUrl, "", "get", dataType, headers);
            } else {
                // POST/PUT/DELETE请求
                const requestData = config.data ? JSON.stringify(config.data) : "";
                const httpMethod = method.toLowerCase() as "get" | "post" | "head";
                http.send(config.url, requestData, httpMethod, dataType, headers);
            }
        });
    }
    
    /**
     * 发送POST请求（简化版）
     * @param url 请求URL
     * @param data 请求数据
     * @param timeout 超时时间（毫秒）
     * @returns Promise<T>
     */
    public static async post<T = any>(url: string, data?: any, timeout?: number): Promise<T> {
        const response = await SDKUtils.httpRequest<T>({
            url,
            method: "POST",
            data,
            timeout
        });
        return response.data;
    }
    
    /**
     * 发送GET请求（简化版）
     * @param url 请求URL
     * @param params 查询参数
     * @param timeout 超时时间（毫秒）
     * @returns Promise<T>
     */
    public static async get<T = any>(url: string, params?: any, timeout?: number): Promise<T> {
        const response = await SDKUtils.httpRequest<T>({
            url,
            method: "GET",
            data: params,
            timeout
        });
        return response.data;
    }
    
    /**
     * 带超时的Promise包装器
     * @param promise 原始Promise
     * @param timeout 超时时间（毫秒）
     * @param timeoutMessage 超时错误信息
     * @returns Promise<T>
     */
    public static async withTimeout<T>(
        promise: Promise<T>, 
        timeout: number = SDKUtils.DEFAULT_TIMEOUT,
        timeoutMessage?: string
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            let isCompleted = false;
            
            // 设置超时定时器
            const timeoutHandler = () => {
                if (!isCompleted) {
                    isCompleted = true;
                    const message = timeoutMessage || `操作超时（${timeout}ms）`;
                    reject(new Error(message));
                }
            };
            Laya.timer.once(timeout, null, timeoutHandler);
            
            // 处理原始Promise
            promise.then((result) => {
                if (isCompleted) return;
                
                isCompleted = true;
                Laya.timer.clear(null, timeoutHandler);
                resolve(result);
            }).catch((error) => {
                if (isCompleted) return;
                
                isCompleted = true;
                Laya.timer.clear(null, timeoutHandler);
                reject(error);
            });
        });
    }
    
    /**
     * 微信API调用包装器（带超时）
     * @param apiCall 微信API调用函数
     * @param timeout 超时时间（毫秒）
     * @returns Promise<T>
     */
    public static async wxApiCall<T>(
        apiCall: (success: (res: any) => void, fail: (error: any) => void) => void,
        timeout: number = SDKUtils.DEFAULT_TIMEOUT
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            let isCompleted = false;
            
            // 设置超时定时器
            const timeoutHandler = () => {
                if (!isCompleted) {
                    isCompleted = true;
                    reject(new Error(`微信API调用超时（${timeout}ms）`));
                }
            };
            Laya.timer.once(timeout, null, timeoutHandler);
            
            // 调用微信API
            apiCall(
                (res: any) => {
                    if (isCompleted) return;
                    
                    isCompleted = true;
                    Laya.timer.clear(null, timeoutHandler);
                    resolve(res);
                },
                (error: any) => {
                    if (isCompleted) return;
                    
                    isCompleted = true;
                    Laya.timer.clear(null, timeoutHandler);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * 将对象转换为查询字符串
     * @param obj 对象
     * @returns 查询字符串
     */
    private static objectToQueryString(obj: any): string {
        if (!obj || typeof obj !== 'object') {
            return '';
        }
        
        const params = new URLSearchParams();
        for (const key in obj) {
            if (obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null) {
                params.append(key, String(obj[key]));
            }
        }
        
        return params.toString();
    }
    
    /**
     * 检查网络连接状态
     * @returns boolean
     */
    public static isNetworkAvailable(): boolean {
        return navigator.onLine !== false;
    }
    
    /**
     * 获取设备信息
     * @returns 设备信息对象
     */
    public static getDeviceInfo(): any {
        return {
            userAgent: Laya.Browser.userAgent,
            platform: Laya.Browser.platform,
            language: navigator.language || "zh-CN",
            screenWidth: Laya.Browser.width,
            screenHeight: Laya.Browser.height,
            pixelRatio: Laya.Browser.pixelRatio,
            isOnline: SDKUtils.isNetworkAvailable()
        };
    }
    
    /**
     * 生成唯一ID
     * @param prefix 前缀
     * @returns 唯一ID
     */
    public static generateUniqueId(prefix: string = "id"): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}_${timestamp}_${random}`;
    }
    
    /**
     * 格式化时间戳
     * @param timestamp 时间戳
     * @returns 格式化的时间字符串
     */
    public static formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        return date.toISOString();
    }
}
