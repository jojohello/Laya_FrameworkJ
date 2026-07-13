package com.laya.game.gateway.config;

import com.laya.game.gateway.websocket.GatewayWebSocketHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket配置类
 *
 * 配置客户端WebSocket连接入口和处理器
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(WebSocketConfig.class);
    private final GatewayWebSocketHandler gatewayWebSocketHandler;
    @Value("${laya.gateway.websocket.endpoint:/ws}")
    private String endpoint;
    @Value("${laya.gateway.websocket.allowed-origins:*}")
    private String allowedOrigins;

    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {
        // 使用setAllowedOriginPatterns代替setAllowedOrigins
        registry.addHandler(gatewayWebSocketHandler, endpoint).setAllowedOriginPatterns(allowedOrigins).withSockJS();
        // 原生WebSocket支持（不使用SockJS）
        registry.addHandler(gatewayWebSocketHandler, endpoint + "/native").setAllowedOriginPatterns(allowedOrigins); // 使用setAllowedOriginPatterns代替setAllowedOrigins
        log.info("Gateway WebSocket configured: endpoint={}, allowed-origin-patterns={}", endpoint, allowedOrigins);
    }

    @java.lang.SuppressWarnings("all")
    public WebSocketConfig(final GatewayWebSocketHandler gatewayWebSocketHandler) {
        this.gatewayWebSocketHandler = gatewayWebSocketHandler;
    }
}
