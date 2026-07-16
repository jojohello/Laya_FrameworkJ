package com.laya.game.gateway;

import com.jojohello_laya.common.util.Utf8Console;
import com.laya.game.gateway.gameserver.GameServerConnectionManager;
import com.laya.game.gateway.websocket.GatewayWebSocketHandler;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 网关服务器主启动类
 *
 * 功能职责：
 * 1. 客户端WebSocket连接入口
 * 2. 等待连接链表验证机制
 * 3. 与中心数据服务器协调网关分配
 * 4. 负载均衡和消息路由
 * 5. 心跳检测和断线重连
 * 6. 连接状态管理
 *
 * 端口：8080
 * 协议：WebSocket + HTTP REST API
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@SpringBootApplication(scanBasePackages = {
    "com.laya.game.gateway"
})
@EntityScan(basePackages = {
    "com.laya.game.gateway.model"
})
@EnableCaching
@EnableScheduling
public class GatewayServerApplication {

    @Autowired
    private GameServerConnectionManager gameServerConnectionManager;

    @Autowired
    private GatewayWebSocketHandler gatewayWebSocketHandler;

    /**
     * 初始化：设置Game Server消息转发器
     */
    @PostConstruct
    public void initializeMessageForwarder() {
        gameServerConnectionManager.setMessageForwarder(gatewayWebSocketHandler);
        System.out.println("[OK] Game Server消息转发器已设置");
    }

    public static void main(String[] args) {
        Utf8Console.configure();
        SpringApplication.run(GatewayServerApplication.class, args);
        System.out.println("=================================");
        System.out.println("[START] 网关服务器启动成功!");
        System.out.println("[ADDR] 服务地址: http://localhost:8082");
        System.out.println("[LINK] WebSocket: ws://localhost:8082/ws");
        System.out.println("[HEALTH] 健康检查: http://localhost:8082/actuator/health");
        System.out.println("[METRICS] 监控指标: http://localhost:8082/actuator/metrics");
        System.out.println("=================================");
    }
}
