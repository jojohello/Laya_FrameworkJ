package com.laya.game.central.config;

import com.laya.game.central.websocket.CentralWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket配置类
 * 
 * 配置WebSocket端点和处理器，用于实时通信
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final CentralWebSocketHandler centralWebSocketHandler;

    @Override
    public void registerWebSocketHandlers(@NonNull WebSocketHandlerRegistry registry) {
        // 注册中心数据服务器WebSocket处理器
        // 允许所有来源，生产环境应该限制
        registry.addHandler(centralWebSocketHandler, "/ws").setAllowedOrigins("*").withSockJS(); // 启用SockJS支持
        // 注册原生WebSocket处理器（不使用SockJS）
        registry.addHandler(centralWebSocketHandler, "/ws/native").setAllowedOrigins("*");
    }

    @java.lang.SuppressWarnings("all")
    public WebSocketConfig(final CentralWebSocketHandler centralWebSocketHandler) {
        this.centralWebSocketHandler = centralWebSocketHandler;
    }
}
