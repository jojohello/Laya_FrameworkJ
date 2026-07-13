/**
 * 消息ID定义
 *
 * ⚠️ 此文件由 Protocol/message-ids.yaml 自动生成
 * ⚠️ 请勿手动修改，修改请编辑 message-ids.yaml 后重新生成
 *
 * @generated 2025-12-12
 * @version 1.0.0
 */

// ========== Start包硬编码消息 (101-199) ==========
export const LOGIN = 101;
export const LOGIN_SUCCESS = 102;
export const LOGIN_FAILED = 103;

// ========== 认证类 (1xxx) ==========
export const AUTH = 1001;
export const AUTH_SUCCESS = 1002;
export const AUTH_FAILED = 1003;

// ========== 心跳类 (2xxx) ==========
export const HEARTBEAT = 2001;
export const HEARTBEAT_RESPONSE = 2002;

// ========== 游戏逻辑类 (3xxx) ==========
export const GET_PLAYER_INFO = 3010;
export const PLAYER_INFO = 3011;

// ========== 系统类 (9xxx) ==========
export const ERROR = 9001;
export const NOTIFICATION = 9002;
export const KICK = 9004;

/**
 * 所有消息ID（用于类型检查和遍历）
 */
export const MessageIds = {
    LOGIN,
    LOGIN_SUCCESS,
    LOGIN_FAILED,
    AUTH,
    AUTH_SUCCESS,
    AUTH_FAILED,
    HEARTBEAT,
    HEARTBEAT_RESPONSE,
    GET_PLAYER_INFO,
    PLAYER_INFO,
    ERROR,
    NOTIFICATION,
    KICK
} as const;

/**
 * 消息ID类型
 */
export type MessageId = typeof MessageIds[keyof typeof MessageIds];

/**
 * 根据ID获取消息名称（用于日志）
 *
 * @param id 消息ID
 * @returns 消息名称，如果未找到返回 "UNKNOWN(id)"
 */
export function getMessageName(id: number): string {
    switch (id) {
        case 101: return "LOGIN";
        case 102: return "LOGIN_SUCCESS";
        case 103: return "LOGIN_FAILED";
        case 1001: return "AUTH";
        case 1002: return "AUTH_SUCCESS";
        case 1003: return "AUTH_FAILED";
        case 2001: return "HEARTBEAT";
        case 2002: return "HEARTBEAT_RESPONSE";
        case 3010: return "GET_PLAYER_INFO";
        case 3011: return "PLAYER_INFO";
        case 9001: return "ERROR";
        case 9002: return "NOTIFICATION";
        case 9004: return "KICK";
        default: return `UNKNOWN(${id})`;
    }
}

/**
 * 根据消息名称获取ID（用于解析服务器消息）
 *
 * @param name 消息名称
 * @returns 消息ID，如果未找到返回 null
 */
export function getMessageId(name: string): number | null {
    switch (name) {
        case "LOGIN": return 101;
        case "LOGIN_SUCCESS": return 102;
        case "LOGIN_FAILED": return 103;
        case "AUTH": return 1001;
        case "AUTH_SUCCESS": return 1002;
        case "AUTH_FAILED": return 1003;
        case "HEARTBEAT": return 2001;
        case "HEARTBEAT_RESPONSE": return 2002;
        case "GET_PLAYER_INFO": return 3010;
        case "PLAYER_INFO": return 3011;
        case "ERROR": return 9001;
        case "NOTIFICATION": return 9002;
        case "KICK": return 9004;
        default: return null;
    }
}

/**
 * 检查是否是有效的消息ID
 *
 * @param id 消息ID
 * @returns 是否有效
 */
export function isValidMessageId(id: number): boolean {
    return getMessageName(id) !== `UNKNOWN(${id})`;
}
