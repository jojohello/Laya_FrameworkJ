package com.laya.game.game.handler;

import com.laya.game.game.gateway.GatewayWebSocketHandler;
import com.laya.game.game.protocol.BroadcastRequest;
import com.laya.game.game.protocol.GameMessage;
import java.util.Collections;

/**
 * 消息上下文
 *
 * 封装消息处理所需的上下文信息
 *
 * @author Laya Game Server
 * @since 2025-10-30
 */
public class MessageContext {
    // ========== 身份标识字段（三层ID体系） ==========
    /**
     * 账号ID（Account ID）
     *
     * 含义：用户的账号唯一标识，登录后获得
     * 来源：Login Server 颁发的 JWT Token 中包含
     * 作用：
     *   1. 消息路由：Gateway 通过 userId 路由到 Game Server
     *   2. 账号级操作：充值、封号、账号数据管理
     *   3. 一账号多角色：一个 userId 可以创建多个 playerId（角色）
     *
     * 示例：
     *   - 游客登录：guest_1761815046402
     *   - 微信登录：wx_openid_12345
     *   - 用户名登录：user_67890
     *
     * 注意：登录前为 null，登录成功后由 LoginHandler 设置
     */
    private String userId;
    /**
     * 会话ID（Session ID）
     *
     * 含义：客户端 WebSocket 连接的唯一标识
     * 来源：Gateway 为每个连接生成（通常是 UUID）
     * 作用：
     *   1. 精准路由：Game Server → Gateway → 特定客户端连接
     *   2. 断线重连：客户端可以携带 sessionId 恢复会话
     *   3. 多端登录：同一账号在不同设备上有不同 sessionId
     *
     * 示例：550e8400-e29b-41d4-a716-446655440000
     *
     * 优先级：在 sendResponse() 时，sessionId > userId > gatewayId
     */
    private String sessionId;
    /**
     * 角色ID（Player/Character ID）
     *
     * 含义：Game Server 内部生成的游戏角色唯一标识
     * 来源：首次进入游戏时创建，或从角色列表中选择
     * 作用：
     *   1. 角色级操作：背包、装备、技能、任务等游戏数据
     *   2. 角色切换：一个账号可以有多个角色
     *   3. 业务逻辑：游戏功能主要使用 playerId 而非 userId
     *
     * 当前零/单角色阶段由业务处理器根据已认证 userId 解析一次角色；多角色协议完成后，
     * 应将选择结果绑定到会话上下文，不能接受客户端未经校验地指定 playerId。
     *
     * 设计思路：
     *   - userId: 账号维度（登录、充值、封号）
     *   - playerId: 角色维度（背包、装备、战斗、社交）
     *   - sessionId: 连接维度（消息路由、断线重连）
     */
    /**
     * Gateway ID
     *
     * 含义：Gateway 服务器的唯一标识
     * 来源：Gateway 启动时注册到 Central Server
     * 作用：Game Server 发送消息时指定目标 Gateway
     *
     * 示例：gateway-1, gateway-2
     */
    private String gatewayId;
    /**
     * Gateway 处理器（用于发送响应）
     */
    private GatewayWebSocketHandler gatewayHandler;

    /**
     * 发送响应消息到客户端
     *
     * @param response 响应消息
     */
    public void sendResponse(GameMessage response) {
        if (gatewayHandler != null && gatewayId != null) {
            // 优先级：sessionId > userId > gatewayId
            // - sessionId: 最准确，直接对应客户端 WebSocket 连接
            // - userId: 登录后可用，Gateway 会查找对应的 session
            // - gatewayId: 最后的备选（一般不应该用到）
            String targetId = (sessionId != null) ? sessionId : (userId != null) ? userId : gatewayId;
            BroadcastRequest request = BroadcastRequest.builder().targetUsers(Collections.singletonList(targetId)).message(response).build();
            gatewayHandler.sendToGateway(gatewayId, request);
        }
    }

    /**
     * 创建上下文（用于登录前，没有userId）
     */
    public static MessageContext create(String sessionId, String gatewayId, GatewayWebSocketHandler gatewayHandler) {
        return new MessageContext(null, sessionId, gatewayId, gatewayHandler);
    }

    /**
     * 创建上下文（用于登录后，有userId）
     */
    public static MessageContext create(String userId, String sessionId, String gatewayId, GatewayWebSocketHandler gatewayHandler) {
        return new MessageContext(userId, sessionId, gatewayId, gatewayHandler);
    }

    /**
     * 账号ID（Account ID）
     *
     * 含义：用户的账号唯一标识，登录后获得
     * 来源：Login Server 颁发的 JWT Token 中包含
     * 作用：
     *   1. 消息路由：Gateway 通过 userId 路由到 Game Server
     *   2. 账号级操作：充值、封号、账号数据管理
     *   3. 一账号多角色：一个 userId 可以创建多个 playerId（角色）
     *
     * 示例：
     *   - 游客登录：guest_1761815046402
     *   - 微信登录：wx_openid_12345
     *   - 用户名登录：user_67890
     *
     * 注意：登录前为 null，登录成功后由 LoginHandler 设置
     */
    @java.lang.SuppressWarnings("all")
    public String getUserId() {
        return this.userId;
    }

    /**
     * 会话ID（Session ID）
     *
     * 含义：客户端 WebSocket 连接的唯一标识
     * 来源：Gateway 为每个连接生成（通常是 UUID）
     * 作用：
     *   1. 精准路由：Game Server → Gateway → 特定客户端连接
     *   2. 断线重连：客户端可以携带 sessionId 恢复会话
     *   3. 多端登录：同一账号在不同设备上有不同 sessionId
     *
     * 示例：550e8400-e29b-41d4-a716-446655440000
     *
     * 优先级：在 sendResponse() 时，sessionId > userId > gatewayId
     */
    @java.lang.SuppressWarnings("all")
    public String getSessionId() {
        return this.sessionId;
    }

    /**
     * Gateway ID
     *
     * 含义：Gateway 服务器的唯一标识
     * 来源：Gateway 启动时注册到 Central Server
     * 作用：Game Server 发送消息时指定目标 Gateway
     *
     * 示例：gateway-1, gateway-2
     */
    @java.lang.SuppressWarnings("all")
    public String getGatewayId() {
        return this.gatewayId;
    }

    /**
     * Gateway 处理器（用于发送响应）
     */
    @java.lang.SuppressWarnings("all")
    public GatewayWebSocketHandler getGatewayHandler() {
        return this.gatewayHandler;
    }

    /**
     * 账号ID（Account ID）
     *
     * 含义：用户的账号唯一标识，登录后获得
     * 来源：Login Server 颁发的 JWT Token 中包含
     * 作用：
     *   1. 消息路由：Gateway 通过 userId 路由到 Game Server
     *   2. 账号级操作：充值、封号、账号数据管理
     *   3. 一账号多角色：一个 userId 可以创建多个 playerId（角色）
     *
     * 示例：
     *   - 游客登录：guest_1761815046402
     *   - 微信登录：wx_openid_12345
     *   - 用户名登录：user_67890
     *
     * 注意：登录前为 null，登录成功后由 LoginHandler 设置
     */
    @java.lang.SuppressWarnings("all")
    public void setUserId(final String userId) {
        this.userId = userId;
    }

    /**
     * 会话ID（Session ID）
     *
     * 含义：客户端 WebSocket 连接的唯一标识
     * 来源：Gateway 为每个连接生成（通常是 UUID）
     * 作用：
     *   1. 精准路由：Game Server → Gateway → 特定客户端连接
     *   2. 断线重连：客户端可以携带 sessionId 恢复会话
     *   3. 多端登录：同一账号在不同设备上有不同 sessionId
     *
     * 示例：550e8400-e29b-41d4-a716-446655440000
     *
     * 优先级：在 sendResponse() 时，sessionId > userId > gatewayId
     */
    @java.lang.SuppressWarnings("all")
    public void setSessionId(final String sessionId) {
        this.sessionId = sessionId;
    }

    /**
     * Gateway ID
     *
     * 含义：Gateway 服务器的唯一标识
     * 来源：Gateway 启动时注册到 Central Server
     * 作用：Game Server 发送消息时指定目标 Gateway
     *
     * 示例：gateway-1, gateway-2
     */
    @java.lang.SuppressWarnings("all")
    public void setGatewayId(final String gatewayId) {
        this.gatewayId = gatewayId;
    }

    /**
     * Gateway 处理器（用于发送响应）
     */
    @java.lang.SuppressWarnings("all")
    public void setGatewayHandler(final GatewayWebSocketHandler gatewayHandler) {
        this.gatewayHandler = gatewayHandler;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof MessageContext)) return false;
        final MessageContext other = (MessageContext) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$userId = this.getUserId();
        final java.lang.Object other$userId = other.getUserId();
        if (this$userId == null ? other$userId != null : !this$userId.equals(other$userId)) return false;
        final java.lang.Object this$sessionId = this.getSessionId();
        final java.lang.Object other$sessionId = other.getSessionId();
        if (this$sessionId == null ? other$sessionId != null : !this$sessionId.equals(other$sessionId)) return false;
        final java.lang.Object this$gatewayId = this.getGatewayId();
        final java.lang.Object other$gatewayId = other.getGatewayId();
        if (this$gatewayId == null ? other$gatewayId != null : !this$gatewayId.equals(other$gatewayId)) return false;
        final java.lang.Object this$gatewayHandler = this.getGatewayHandler();
        final java.lang.Object other$gatewayHandler = other.getGatewayHandler();
        if (this$gatewayHandler == null ? other$gatewayHandler != null : !this$gatewayHandler.equals(other$gatewayHandler)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof MessageContext;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $userId = this.getUserId();
        result = result * PRIME + ($userId == null ? 43 : $userId.hashCode());
        final java.lang.Object $sessionId = this.getSessionId();
        result = result * PRIME + ($sessionId == null ? 43 : $sessionId.hashCode());
        final java.lang.Object $gatewayId = this.getGatewayId();
        result = result * PRIME + ($gatewayId == null ? 43 : $gatewayId.hashCode());
        final java.lang.Object $gatewayHandler = this.getGatewayHandler();
        result = result * PRIME + ($gatewayHandler == null ? 43 : $gatewayHandler.hashCode());
        return result;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public java.lang.String toString() {
        return "MessageContext(userId=" + this.getUserId() + ", sessionId=" + this.getSessionId() + ", gatewayId=" + this.getGatewayId() + ", gatewayHandler=" + this.getGatewayHandler() + ")";
    }

    @java.lang.SuppressWarnings("all")
    public MessageContext() {
    }

    @java.lang.SuppressWarnings("all")
    public MessageContext(final String userId, final String sessionId, final String gatewayId, final GatewayWebSocketHandler gatewayHandler) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.gatewayId = gatewayId;
        this.gatewayHandler = gatewayHandler;
    }
}
