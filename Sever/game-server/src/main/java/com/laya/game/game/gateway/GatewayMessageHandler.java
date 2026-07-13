package com.laya.game.game.gateway;

import com.laya.game.game.protocol.GameMessage;

/**
 * Gateway 消息处理器接口
 * 所有Gateway消息处理器都需要实现此接口
 *
 * 设计说明：
 * - 原MessageHandler位于独立的dispatcher包（过度设计）
 * - 现在改名为GatewayMessageHandler，归属gateway包（收发一体）
 * - 消息路由逻辑内嵌在GatewayClient中，不再需要独立的Dispatcher
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
@FunctionalInterface
public interface GatewayMessageHandler {

    /**
     * 处理消息
     *
     * @param message 游戏消息
     */
    void handle(GameMessage message);
}
