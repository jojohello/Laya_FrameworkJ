// jojohello 2025-12-10
// 登录协议处理

import { Protocol } from "../network/Protocol";
import { LoginMgr } from "./LoginMgr";

/**
 * 登录相关消息ID（写死常量，避免依赖 Logic 包）
 *
 * ⚠️ 注意：这些常量必须与 Protocol/message-ids.yaml 中定义的值保持一致
 * 如果修改了 YAML 文件中的值，必须同步更新此处的常量
 */
const LOGIN = 101;
const LOGIN_SUCCESS = 102;
const LOGIN_FAILED = 103;

/**
 * LoginProtocol - 登录消息处理
 *
 * 职责：
 * - 处理登录相关的网络消息（LOGIN_SUCCESS, LOGIN_FAILED）
 * - 发送登录请求
 *
 * 注意：
 * - 不要在这里处理业务逻辑，业务逻辑应该在 LoginMgr 中
 * - Protocol 只负责消息的发送和接收分发
 * - 消息ID已写死，无需从 MessageIds 导入
 */
export class LoginProtocol extends Protocol {

    /**
     * 注册消息处理
     *
     * 由 Protocol.init() 自动调用
     */
    protected register(): void {
        // 注册登录成功消息
        this.registerMessage(LOGIN_SUCCESS, this.onLoginSuccess.bind(this));

        // 注册登录失败消息
        this.registerMessage(LOGIN_FAILED, this.onLoginFailed.bind(this));
    }

    // ========== 消息处理函数 ==========

    /**
     * 处理登录成功消息
     *
     * @param data 服务器返回的数据
     */
    private onLoginSuccess(data: any): void {
        // 通知 LoginMgr 处理业务逻辑
        LoginMgr.instance.handleLoginSuccess(data);
    }

    /**
     * 处理登录失败消息
     *
     * @param data 服务器返回的数据
     */
    private onLoginFailed(data: any): void {
        // 通知 LoginMgr 处理业务逻辑
        LoginMgr.instance.handleLoginFailed(data);
    }

    // ========== 发送消息函数 ==========

    /**
     * 发送登录请求
     *
     * @param userId 用户ID
     * @param timestamp 时间戳
     */
    sendLogin(userId: string, timestamp: number): void {
        this.sendMessage(LOGIN, {
            timestamp: timestamp
        }, userId);
    }
}
