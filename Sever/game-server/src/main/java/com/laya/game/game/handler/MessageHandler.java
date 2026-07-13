package com.laya.game.game.handler;

import com.laya.game.game.protocol.GameMessage;

/**
 * 业务消息处理器接口
 *
 * 所有业务处理器都需要实现此接口
 *
 * @author Laya Game Server
 * @since 2025-10-30
 */
public interface MessageHandler {

    /**
     * 获取消息ID
     * 用于消息路由
     *
     * @return 消息ID（如：101 (LOGIN), 3010 (GET_PLAYER_INFO)）
     */
    Short getMessageId();

    /**
     * 处理消息
     *
     * @param message 游戏消息
     * @param context 消息上下文
     */
    void handle(GameMessage message, MessageContext context);
}
