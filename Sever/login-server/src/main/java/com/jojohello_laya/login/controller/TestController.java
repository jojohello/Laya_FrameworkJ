package com.jojohello_laya.login.controller;

import com.jojohello_laya.login.entity.User;
import com.jojohello_laya.login.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

/**
 * 测试控制器
 *
 * @author laya-game
 */
@RestController
@RequestMapping("/api/test")
public class TestController {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TestController.class);
    private final UserService userService;

    /**
     * 测试数据库连接
     */
    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> testDatabase() {
        Map<String, Object> result = new HashMap<>();
        try {
            // 统计用户数量
            long totalUsers = userService.countUsers();
            long guestUsers = userService.countUsersByType(User.ThirdPartyType.GUEST);
            long wechatUsers = userService.countUsersByType(User.ThirdPartyType.WECHAT);
            long qqUsers = userService.countUsersByType(User.ThirdPartyType.QQ);
            result.put("success", true);
            result.put("message", "数据库连接正常");
            result.put("totalUsers", totalUsers);
            result.put("guestUsers", guestUsers);
            result.put("wechatUsers", wechatUsers);
            result.put("qqUsers", qqUsers);
            log.info("数据库测试成功: totalUsers={}, guestUsers={}, wechatUsers={}, qqUsers={}", totalUsers, guestUsers, wechatUsers, qqUsers);
        } catch (Exception e) {
            log.error("数据库测试失败", e);
            result.put("success", false);
            result.put("message", "数据库连接失败: " + e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * 创建测试用户
     */
    @PostMapping("/user")
    public ResponseEntity<Map<String, Object>> createTestUser(@RequestParam String type) {
        Map<String, Object> result = new HashMap<>();
        try {
            User.ThirdPartyType thirdPartyType;
            String thirdPartyUserId;
            switch (type.toLowerCase()) {
            case "guest":
                thirdPartyType = User.ThirdPartyType.GUEST;
                thirdPartyUserId = "test_device_" + System.currentTimeMillis();
                break;
            case "wechat":
                thirdPartyType = User.ThirdPartyType.WECHAT;
                thirdPartyUserId = "wx_openid_test_" + System.currentTimeMillis();
                break;
            case "qq":
                thirdPartyType = User.ThirdPartyType.QQ;
                thirdPartyUserId = "qq_unionid_test_" + System.currentTimeMillis();
                break;
            default:
                result.put("success", false);
                result.put("message", "不支持的第三方类型: " + type);
                return ResponseEntity.badRequest().body(result);
            }
            User user = userService.findOrCreateUser(thirdPartyUserId, thirdPartyType, "Test Device", "web", "1.0.0", "{\"test\": true}");
            result.put("success", true);
            result.put("message", "测试用户创建成功");
            result.put("user", Map.of("userId", user.getUserId(), "nickname", user.getNickname(), "thirdPartyType", user.getThirdPartyType(), "createdTime", user.getCreatedTime()));
            log.info("测试用户创建成功: userId={}, type={}", user.getUserId(), type);
        } catch (Exception e) {
            log.error("创建测试用户失败", e);
            result.put("success", false);
            result.put("message", "创建测试用户失败: " + e.getMessage());
        }
        return ResponseEntity.ok(result);
    }

    /**
     * 获取系统信息
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        Map<String, Object> result = new HashMap<>();
        result.put("service", "Login Server");
        result.put("version", "1.0.0");
        result.put("database", "MySQL");
        result.put("cache", "Redis");
        result.put("authentication", "JWT");
        result.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(result);
    }

    @java.lang.SuppressWarnings("all")
    public TestController(final UserService userService) {
        this.userService = userService;
    }
}
