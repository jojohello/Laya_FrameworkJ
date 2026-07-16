package com.laya.game.game;

import com.jojohello_laya.common.util.Utf8Console;
import com.laya.game.game.config.ConfigManager;
import com.laya.game.game.configStruct.TestConfig;
import com.laya.game.game.gateway.GatewayRouteManager;
import com.laya.game.game.gateway.GatewayWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;
import java.util.Map;

/**
 * Game Server 启动类
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class GameServerApplication {

    private static final Logger logger = LoggerFactory.getLogger(GameServerApplication.class);

    @Autowired
    private ConfigManager configManager;

    @Autowired
    private GatewayRouteManager gatewayRouteManager;

    @Autowired
    private GatewayWebSocketHandler gatewayWebSocketHandler;

    /**
     * 初始化Gateway路由管理器
     * 解决循环依赖问题：RouteManager需要Handler发送消息
     */
    @PostConstruct
    public void initGatewayComponents() {
        // 将GatewayWebSocketHandler注入到RouteManager（避免循环依赖）
        gatewayRouteManager.setGatewayHandler(gatewayWebSocketHandler);
        logger.info("[OK] Gateway组件初始化完成：RouteManager ↔ WebSocketHandler 已关联");
    }

    /**
     * 配置系统测试
     * 在 Spring 容器启动完成后执行
     */
    @PostConstruct
    public void testConfigSystem() {
        logger.info("========================================");
        logger.info("开始测试配置系统...");

        try {
            // 测试1: 强类型查询
            logger.info("【测试1】强类型查询 TestConfig(1001)");
            TestConfig test1 = configManager.get(TestConfig.class, 1001);
            if (test1 != null) {
                logger.info("  测试数据名称: {}", test1.getName());
                logger.info("  等级: {}", test1.getLevel());
                logger.info("  生命值: {}", test1.getHp());
                logger.info("  攻击力: {}", test1.getAttack());
                logger.info("  防御力: {}", test1.getDefense());
                logger.info("  移动速度: {}", test1.getSpeed());
                logger.info("  技能ID列表: {}", test1.getSkillIds());
                logger.info("  掉落物品列表: {}", test1.getDropItems());
            } else {
                logger.warn("  未找到测试数据 1001");
            }

            // 测试2: 字段查询 - 所有等级为10的测试数据
            logger.info("【测试2】字段查询 - 所有等级为10的测试数据");
            List<TestConfig> level10Tests = configManager.getByField(TestConfig.class, "level", 10);
            logger.info("  找到 {} 条等级为10的测试数据", level10Tests.size());
            for (TestConfig test : level10Tests) {
                logger.info("    - {}: {} (等级: {}, HP: {})", test.getID(), test.getName(), test.getLevel(), test.getHp());
            }

            // 测试3: 查询所有测试数据
            logger.info("【测试3】查询所有测试数据");
            List<TestConfig> allTests = configManager.getAll(TestConfig.class);
            logger.info("  测试数据总数: {} 条", allTests.size());

            // 测试4: 动态查询（无类型）
            logger.info("【测试4】动态查询 getRaw(\"tests\", 1001)");
            Map<String, Object> rawTest = configManager.getRaw("tests", 1001);
            if (rawTest != null) {
                logger.info("  原始数据: ID={}, name={}, level={}",
                        rawTest.get("ID"), rawTest.get("name"), rawTest.get("level"));
            }

            // 测试5: 配置统计信息
            logger.info("【测试5】配置统计信息");
            Map<String, Object> stats = configManager.getStatistics();
            logger.info("  配置表数量: {}", stats.get("tableCount"));
            logger.info("  配置项总数: {}", stats.get("configCount"));
            logger.info("  对象缓存大小: {}", stats.get("objectCacheSize"));
            logger.info("  索引缓存大小: {}", stats.get("indexCacheSize"));

            logger.info("配置系统测试完成！✓");
            logger.info("========================================");

        } catch (Exception e) {
            logger.error("配置系统测试失败！", e);
        }
    }

    public static void main(String[] args) {
        Utf8Console.configure();
        try {
            ConfigurableApplicationContext context = SpringApplication.run(GameServerApplication.class, args);
            Environment env = context.getEnvironment();

            String protocol = "http";
            String serverPort = env.getProperty("server.port", "8084");
            String contextPath = env.getProperty("server.servlet.context-path", "/");
            String hostAddress = "localhost";

            try {
                hostAddress = InetAddress.getLocalHost().getHostAddress();
            } catch (UnknownHostException e) {
                logger.warn("Failed to get host address, using 'localhost'", e);
            }

            logger.info("\n----------------------------------------------------------\n\t" +
                    "Application '{}' is running! Access URLs:\n\t" +
                    "Local: \t\t{}://localhost:{}{}\n\t" +
                    "External: \t{}://{}:{}{}\n\t" +
                    "Health: \t{}://localhost:{}/actuator/health\n\t" +
                    "Profile(s): \t{}\n" +
                    "----------------------------------------------------------",
                env.getProperty("spring.application.name", "game-server"),
                protocol, serverPort, contextPath,
                protocol, hostAddress, serverPort, contextPath,
                protocol, serverPort,
                env.getActiveProfiles().length == 0 ? "default" : String.join(", ", env.getActiveProfiles())
            );

        } catch (Exception e) {
            logger.error("Failed to start Game Server Application", e);
            System.exit(1);
        }
    }
}
