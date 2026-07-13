package com.laya.game.central;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
// import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
// import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;
// import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 中心数据服务器主启动类
 * 
 * 功能职责：
 * 1. 用户账号数据管理
 * 2. 三要素验证服务 (账号+登录时间戳+Token)
 * 3. 网关分配管理
 * 4. 用户会话状态管理
 * 5. 强制下线逻辑处理
 * 6. 数据持久化服务
 * 
 * 端口：8083
 * 协议：HTTP REST API + WebSocket
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@SpringBootApplication(scanBasePackages = {
    "com.laya.game.central",
    "com.laya.game.common"
})
@EntityScan(basePackages = {
    "com.laya.game.central.model",
    "com.laya.game.common.model"
})
@EnableCaching
@EnableScheduling
public class CentralDataServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(CentralDataServerApplication.class, args);
        System.out.println("=================================");
        System.out.println("[START] 中心数据服务器启动成功!");
        System.out.println("[ADDR] 服务地址: http://localhost:8083");
        System.out.println("[LINK] API文档: http://localhost:8083/api/central/swagger-ui.html");
        System.out.println("[HEALTH] 健康检查: http://localhost:8083/api/central/actuator/health");
        System.out.println("=================================");
    }
}
