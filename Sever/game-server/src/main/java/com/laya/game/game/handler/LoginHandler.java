package com.laya.game.game.handler;

import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import com.laya.game.game.gateway.GatewayRouteManager;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 登录处理器
 *
 * 处理客户端的登录请求，验证用户凭证并返回会话信息
 *
 * 【重要】userId 的含义：
 *   - userId = 账号ID（Account ID），不是角色ID（Player ID）
 *   - 一个 userId 可以创建多个角色（未来功能）
 *   - 当前阶段：userId 用于路由和账号管理
 *   - Phase 2：将实现 playerId（角色ID），用于游戏业务逻辑
 *
 * 支持两种登录方式：
 *   1. Token 方式（推荐）：客户端已通过 Login Server 认证，携带 userId + token
 *   2. 用户名密码方式（Mock）：直接使用 username + password 登录（仅用于测试）
 *
 * 消息格式：
 *   请求：{"type":"LOGIN","userId":"guest_123","data":{"timestamp":1234567890}}
 *   成功：{"type":"LOGIN_SUCCESS","data":{"userId":"guest_123","sessionToken":"xxx"}}
 *   失败：{"type":"LOGIN_FAILED","data":{"reason":"Invalid credentials"}}
 *
 * 路由更新：
 *   登录成功后，注册路由映射：userId → gatewayId
 *   后续消息通过此映射发送到正确的 Gateway
 *
 * @author Laya Game Server
 * @since 2025-10-30
 */
@Component
public class LoginHandler implements MessageHandler {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LoginHandler.class);
    private final GatewayRouteManager routeManager;

    @Override
    public Short getMessageId() {
        return MessageIds.LOGIN;
    }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        try {
            // 提取登录信息
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) message.getData();
            // 支持两种登录方式：
            // 1. username + password（传统方式）
            // 2. userId（从消息头部获取，客户端已登录后的方式）
            String username = (String) data.get("username");
            String password = (String) data.get("password");
            // 优先从消息头部获取 userId（Gateway 已经提取）
            String userId = message.getUserId();
            if (userId == null || userId.isEmpty()) {
                // 如果消息头部没有，尝试从 data 中获取（兼容旧版本）
                userId = (String) data.get("userId");
            }
            log.info("收到登录请求: username={}, userId={}, gatewayId={}", username, userId, context.getGatewayId());
            // 如果提供了userId和token，直接使用（已通过Central Server认证）
            if (userId != null && !userId.isEmpty()) {
                // TODO: 验证token的有效性
                String sessionToken = generateSessionToken();
                // 注册用户路由：userId → gatewayId
                routeManager.updateUserRoute(userId, context.getGatewayId());
                // 返回登录成功响应
                Map<String, Object> responseData = new HashMap<>();
                responseData.put("userId", userId);
                responseData.put("sessionToken", sessionToken);
                responseData.put("loginTime", System.currentTimeMillis());
                GameMessage response = new GameMessage();
                response.setMsgId(MessageIds.LOGIN_SUCCESS);
                response.setMessage("登录成功");
                response.setData(responseData);
                context.sendResponse(response);
                log.info("登录成功(token方式): userId={}, gatewayId={}", userId, context.getGatewayId());
                return;
            }
            // 否则使用username + password方式
            if (username == null || username.isEmpty()) {
                sendLoginFailed(context, "用户名不能为空");
                return;
            }
            if (password == null || password.isEmpty()) {
                sendLoginFailed(context, "密码不能为空");
                return;
            }
            // Mock验证：任何非空用户名密码都通过
            // TODO: 实际项目中应该查询数据库验证凭证
            String generatedUserId = generateUserId(username);
            String sessionToken = generateSessionToken();
            // 注册用户路由：userId → gatewayId
            routeManager.updateUserRoute(generatedUserId, context.getGatewayId());
            // 返回登录成功响应
            Map<String, Object> responseData = new HashMap<>();
            responseData.put("userId", generatedUserId);
            responseData.put("username", username);
            responseData.put("sessionToken", sessionToken);
            responseData.put("loginTime", System.currentTimeMillis());
            GameMessage response = new GameMessage();
            response.setMsgId(MessageIds.LOGIN_SUCCESS);
            response.setMessage("登录成功");
            response.setData(responseData);
            context.sendResponse(response);
            log.info("登录成功(密码方式): userId={}, username={}, gatewayId={}", generatedUserId, username, context.getGatewayId());
        } catch (Exception e) {
            log.error("登录处理异常", e);
            sendLoginFailed(context, "服务器内部错误");
        }
    }

    /**
     * 发送登录失败响应
     */
    private void sendLoginFailed(MessageContext context, String reason) {
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("reason", reason);
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.LOGIN_FAILED);
        response.setMessage("登录失败");
        response.setData(errorData);
        context.sendResponse(response);
        log.warn("登录失败: reason={}, gatewayId={}", reason, context.getGatewayId());
    }

    /**
     * 生成用户ID
     * Mock实现：基于用户名生成固定ID
     */
    private String generateUserId(String username) {
        // Mock: 使用用户名的hashCode生成固定的userId
        // 实际项目中应该从数据库查询
        return "user_" + Math.abs(username.hashCode());
    }

    /**
     * 生成会话Token
     * Mock实现：生成随机UUID
     */
    private String generateSessionToken() {
        // Mock: 生成随机token
        // 实际项目中应该使用JWT或其他安全token机制
        return UUID.randomUUID().toString();
    }

    @java.lang.SuppressWarnings("all")
    public LoginHandler(final GatewayRouteManager routeManager) {
        this.routeManager = routeManager;
    }
}
