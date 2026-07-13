package com.laya.game.game.protocol;

/**
 * 消息类型枚举
 * 定义 Game Server 支持的所有消息类型
 *
 * 编号规则：
 * - 1xxx: 认证类
 * - 2xxx: 心跳类
 * - 3xxx: 游戏消息类
 * - 31xx: 房间类
 * - 32xx: 玩家动作类
 * - 4xxx: 游戏事件类
 * - 5xxx: 背包类
 * - 9xxx: 系统类
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
public enum MessageType {

    // ==================== 认证类 (1xxx) ====================

    /**
     * 认证请求
     */
    AUTH(1001, "AUTH"),

    /**
     * 认证成功
     */
    AUTH_SUCCESS(1002, "AUTH_SUCCESS"),

    /**
     * 认证失败
     */
    AUTH_FAILED(1003, "AUTH_FAILED"),

    // ==================== 心跳类 (2xxx) ====================

    /**
     * 心跳请求
     */
    HEARTBEAT(2001, "HEARTBEAT"),

    /**
     * 心跳响应
     */
    HEARTBEAT_RESPONSE(2002, "HEARTBEAT_RESPONSE"),

    // ==================== 游戏消息类 (3xxx) ====================

    /**
     * 通用游戏消息
     */
    GAME_MESSAGE(3001, "GAME_MESSAGE"),

    /**
     * 游戏消息确认
     */
    GAME_MESSAGE_ACK(3002, "GAME_MESSAGE_ACK"),

    /**
     * 进入游戏（重要：用于更新路由表）
     */
    ENTER_GAME(3003, "ENTER_GAME"),

    /**
     * 离开游戏
     */
    LEAVE_GAME(3004, "LEAVE_GAME"),

    // ==================== 房间类 (31xx) ====================

    /**
     * 创建房间
     */
    ROOM_CREATE(3101, "ROOM_CREATE"),

    /**
     * 加入房间
     */
    ROOM_JOIN(3102, "ROOM_JOIN"),

    /**
     * 离开房间
     */
    ROOM_LEAVE(3103, "ROOM_LEAVE"),

    /**
     * 房间列表查询
     */
    ROOM_LIST(3104, "ROOM_LIST"),

    /**
     * 房间信息更新
     */
    ROOM_INFO_UPDATE(3105, "ROOM_INFO_UPDATE"),

    // ==================== 玩家动作类 (32xx) ====================

    /**
     * 玩家移动
     */
    PLAYER_MOVE(3201, "PLAYER_MOVE"),

    /**
     * 玩家动作
     */
    PLAYER_ACTION(3202, "PLAYER_ACTION"),

    /**
     * 玩家状态更新
     */
    PLAYER_STATE_UPDATE(3203, "PLAYER_STATE_UPDATE"),

    // ==================== 游戏事件类 (4xxx) ====================

    /**
     * 游戏状态更新
     */
    GAME_STATE_UPDATE(4001, "GAME_STATE_UPDATE"),

    /**
     * 游戏开始
     */
    GAME_START(4002, "GAME_START"),

    /**
     * 游戏结束
     */
    GAME_END(4003, "GAME_END"),

    // ==================== 背包类 (5xxx) ====================

    /**
     * 获取背包信息
     */
    INVENTORY_GET(5001, "INVENTORY_GET"),

    /**
     * 使用物品
     */
    ITEM_USE(5002, "ITEM_USE"),

    /**
     * 添加物品
     */
    ITEM_ADD(5003, "ITEM_ADD"),

    /**
     * 移除物品
     */
    ITEM_REMOVE(5004, "ITEM_REMOVE"),

    /**
     * 背包更新通知
     */
    INVENTORY_UPDATE(5005, "INVENTORY_UPDATE"),

    // ==================== 系统类 (9xxx) ====================

    /**
     * 错误消息
     */
    ERROR(9001, "ERROR"),

    /**
     * 通知消息
     */
    NOTIFICATION(9002, "NOTIFICATION"),

    /**
     * 系统公告
     */
    ANNOUNCEMENT(9003, "ANNOUNCEMENT"),

    /**
     * 踢出玩家
     */
    KICK(9004, "KICK");

    // ==================== 字段和方法 ====================

    /**
     * 消息代码
     */
    private final int code;

    /**
     * 消息类型字符串
     */
    private final String type;

    /**
     * 构造函数
     */
    MessageType(int code, String type) {
        this.code = code;
        this.type = type;
    }

    /**
     * 获取消息代码
     */
    public int getCode() {
        return code;
    }

    /**
     * 获取消息类型字符串
     */
    public String getType() {
        return type;
    }

    /**
     * 根据类型字符串查找枚举
     *
     * @param type 类型字符串
     * @return MessageType枚举，如果未找到返回null
     */
    public static MessageType fromType(String type) {
        if (type == null) {
            return null;
        }
        for (MessageType messageType : values()) {
            if (messageType.type.equals(type)) {
                return messageType;
            }
        }
        return null;
    }

    /**
     * 根据代码查找枚举
     *
     * @param code 消息代码
     * @return MessageType枚举，如果未找到返回null
     */
    public static MessageType fromCode(int code) {
        for (MessageType messageType : values()) {
            if (messageType.code == code) {
                return messageType;
            }
        }
        return null;
    }

    @Override
    public String toString() {
        return type;
    }
}
