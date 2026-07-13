package com.laya.game.game.config;

import com.laya.game.game.gateway.GatewayWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket服务端配置
 *
 * <p>为Gateway提供WebSocket服务端接口，允许Gateway作为客户端连接到Game Server
 *
 * <p>端点路径: /ws/gateway
 *
 * @author Laya Game Server Framework
 * @version 3.0
 * @since 2025-10-30
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final GatewayWebSocketHandler gatewayWebSocketHandler;

    /**
     * 构造函数，注入Gateway连接处理器
     *
     * @param gatewayWebSocketHandler Gateway WebSocket处理器
     */
    public WebSocketConfig(GatewayWebSocketHandler gatewayWebSocketHandler) {
        this.gatewayWebSocketHandler = gatewayWebSocketHandler;
    }

    /**
     * 注册WebSocket处理器
     *
     * <p>配置Gateway连接端点：/ws/gateway
     * <p>允许所有来源连接（内网环境）
     *
     * @param registry WebSocket处理器注册表
     */
    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {
        registry.addHandler(gatewayWebSocketHandler, "/ws/gateway")
                .setAllowedOrigins("*");
    }
}
