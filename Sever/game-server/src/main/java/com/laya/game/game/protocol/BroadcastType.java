package com.laya.game.game.protocol;

/**
 * 广播类型枚举
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
public enum BroadcastType {

    /**
     * 发送给指定用户列表
     * 最常用的广播类型
     */
    TO_USERS,

    /**
     * 发送给房间所有玩家
     * 用于房间内广播
     */
    TO_ROOM,

    /**
     * 全服广播
     * 慎用，性能影响大
     */
    TO_ALL
}
