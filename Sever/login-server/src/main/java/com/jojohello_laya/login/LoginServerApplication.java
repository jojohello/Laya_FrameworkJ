package com.jojohello_laya.login;

import com.jojohello_laya.common.util.Utf8Console;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * 登录服务器主启动类
 *
 * @author laya-game
 */
@SpringBootApplication
@ComponentScan(basePackages = {"com.jojohello_laya.login"})
public class LoginServerApplication {

    public static void main(String[] args) {
        Utf8Console.configure();
        SpringApplication.run(LoginServerApplication.class, args);
        System.out.println("=================================");
        System.out.println("[START] 登录服务器启动成功!");
        System.out.println("[ADDR] 服务地址: http://localhost:8081");
        System.out.println("[CHECK] 健康检查: http://localhost:8081/actuator/health");
        System.out.println("[METRICS] 监控信息: http://localhost:8081/actuator/info");
        System.out.println("=================================");
    }
}
