// jojohello 2025-10-30
// 消息类型常量定义

/**
 * 消息类型常量
 *
 * 定义所有客户端和服务器之间通信的消息类型
 */
/** @deprecated Runtime code must use the generated numeric MessageIds module. */
export const MessageTypes = {
    // ========== 登录相关 ==========
    LOGIN: "LOGIN",
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",

    // ========== 玩家信息相关 ==========
    GET_PLAYER_INFO: "GET_PLAYER_INFO",
    PLAYER_INFO: "PLAYER_INFO",

    // ========== 心跳相关 ==========
    HEARTBEAT: "HEARTBEAT",
    HEARTBEAT_RESPONSE: "HEARTBEAT_RESPONSE",

    // ========== 系统消息 ==========
    ERROR: "ERROR",
    KICK: "KICK",
    WELCOME: "WELCOME",

} as const;

/**
 * 消息类型联合类型
 */
export type MessageType = typeof MessageTypes[keyof typeof MessageTypes];
