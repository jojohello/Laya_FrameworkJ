package com.laya.game.game.protocol;

import java.io.Serializable;

/**
 * Game Server 统一消息格式
 *
 * 架构设计（分层协议）：
 * - 路由层字段（type, userId）放在消息顶层 → Gateway 直接读取，无需解析 data
 * - 业务层数据放在 data 字段中 → Game Server 处理
 * - 性能优化：
 *   1. Gateway 不需要反序列化 data，只读取顶层字段
 *   2. 移除 token 字段，减少消息体积（每条消息节约 ~40 字节）
 *   3. WebSocket 是长连接，Gateway 已维护连接状态，不需要每次验证
 *
 * 路由机制：
 * - Gateway 通过 userId 查找对应的 Game Server
 * - Game Server 通过 userId 查找对应的 Gateway
 * - 双向路由只需要 userId
 *
 * 消息格式：
 * {
 *   "type": "LOGIN",
 *   "userId": "guest_123",     // 路由信息（顶层）
 *   "message": "描述信息",
 *   "data": {
 *     // 业务数据
 *   }
 * }
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
public class GameMessage implements Serializable {
    private static final long serialVersionUID = 1L;
    // ========== 消息头部（路由层） ==========
    // Gateway 读取这些字段进行路由，无需解析 data 字段
    /**
     * 消息ID（统一使用数字）
     *
     * 作用：标识消息的业务类型，Game Server 根据 msgId 分发到对应 Handler
     * 类型：short（2字节，范围 0-65535）
     * 示例：2001 (HEARTBEAT), 101 (LOGIN), 3010 (GET_PLAYER_INFO)
     *
     * 优势：
     *   - 性能更优：整数比较比字符串快 ~10倍
     *   - 网络节省：2字节 vs "HEARTBEAT"的9字节
     *   - 类型安全：编译时检查，避免拼写错误
     */
    private Short msgId;
    /**
     * 账号ID（Account ID）- 可选字段
     *
     * 含义：用户的账号唯一标识（详细说明见 MessageContext.userId）
     * 作用：
     *   1. 消息路由：Gateway 通过 userId 查找对应的 Game Server
     *   2. 反向路由：Game Server 通过 userId 找到对应的 Gateway
     *   3. 日志追踪：定位到具体账号
     *
     * 示例：guest_1761815046402, user_12345
     *
     * 注意事项：
     *   - 登录前消息（LOGIN, AUTH）：userId 可能为 null
     *   - 登录后消息：userId 必填
     *   - 不要与 playerId（角色ID）混淆：userId 是账号，playerId 是角色
     */
    private String userId;
    /**
     * 消息描述（可选）
     *
     * 作用：用于日志记录和调试，客户端可以填写便于排查问题
     * 示例："用户点击登录按钮", "玩家移动到坐标(100,200)"
     */
    private String message;
    // ========== 消息数据（业务层） ==========
    /**
     * 业务数据
     * 可以是 Map, POJO, 或其他JSON可序列化对象
     */
    private Object data;

    /**
     * 便捷构造方法
     *
     * @param msgId 消息ID
     * @param message 消息描述
     * @param data 消息数据
     * @return GameMessage实例
     */
    public static GameMessage of(Short msgId, String message, Object data) {
        GameMessage msg = new GameMessage();
        msg.setMsgId(msgId);
        msg.setMessage(message);
        msg.setData(data);
        return msg;
    }

    /**
     * 便捷构造方法（无描述）
     *
     * @param msgId 消息ID
     * @param data 消息数据
     * @return GameMessage实例
     */
    public static GameMessage of(Short msgId, Object data) {
        return of(msgId, null, data);
    }

    @Override
    public String toString() {
        return "GameMessage{" + "msgId=" + msgId + " (" + MessageIds.getName(msgId != null ? msgId : (short) 0) + ")" + ", userId=\'" + userId + '\'' + ", message=\'" + message + '\'' + ", data=" + data + '}';
    }

    /**
     * 消息ID（统一使用数字）
     *
     * 作用：标识消息的业务类型，Game Server 根据 msgId 分发到对应 Handler
     * 类型：short（2字节，范围 0-65535）
     * 示例：2001 (HEARTBEAT), 101 (LOGIN), 3010 (GET_PLAYER_INFO)
     *
     * 优势：
     *   - 性能更优：整数比较比字符串快 ~10倍
     *   - 网络节省：2字节 vs "HEARTBEAT"的9字节
     *   - 类型安全：编译时检查，避免拼写错误
     */
    @java.lang.SuppressWarnings("all")
    public Short getMsgId() {
        return this.msgId;
    }

    /**
     * 账号ID（Account ID）- 可选字段
     *
     * 含义：用户的账号唯一标识（详细说明见 MessageContext.userId）
     * 作用：
     *   1. 消息路由：Gateway 通过 userId 查找对应的 Game Server
     *   2. 反向路由：Game Server 通过 userId 找到对应的 Gateway
     *   3. 日志追踪：定位到具体账号
     *
     * 示例：guest_1761815046402, user_12345
     *
     * 注意事项：
     *   - 登录前消息（LOGIN, AUTH）：userId 可能为 null
     *   - 登录后消息：userId 必填
     *   - 不要与 playerId（角色ID）混淆：userId 是账号，playerId 是角色
     */
    @java.lang.SuppressWarnings("all")
    public String getUserId() {
        return this.userId;
    }

    /**
     * 消息描述（可选）
     *
     * 作用：用于日志记录和调试，客户端可以填写便于排查问题
     * 示例："用户点击登录按钮", "玩家移动到坐标(100,200)"
     */
    @java.lang.SuppressWarnings("all")
    public String getMessage() {
        return this.message;
    }

    /**
     * 业务数据
     * 可以是 Map, POJO, 或其他JSON可序列化对象
     */
    @java.lang.SuppressWarnings("all")
    public Object getData() {
        return this.data;
    }

    /**
     * 消息ID（统一使用数字）
     *
     * 作用：标识消息的业务类型，Game Server 根据 msgId 分发到对应 Handler
     * 类型：short（2字节，范围 0-65535）
     * 示例：2001 (HEARTBEAT), 101 (LOGIN), 3010 (GET_PLAYER_INFO)
     *
     * 优势：
     *   - 性能更优：整数比较比字符串快 ~10倍
     *   - 网络节省：2字节 vs "HEARTBEAT"的9字节
     *   - 类型安全：编译时检查，避免拼写错误
     */
    @java.lang.SuppressWarnings("all")
    public void setMsgId(final Short msgId) {
        this.msgId = msgId;
    }

    /**
     * 账号ID（Account ID）- 可选字段
     *
     * 含义：用户的账号唯一标识（详细说明见 MessageContext.userId）
     * 作用：
     *   1. 消息路由：Gateway 通过 userId 查找对应的 Game Server
     *   2. 反向路由：Game Server 通过 userId 找到对应的 Gateway
     *   3. 日志追踪：定位到具体账号
     *
     * 示例：guest_1761815046402, user_12345
     *
     * 注意事项：
     *   - 登录前消息（LOGIN, AUTH）：userId 可能为 null
     *   - 登录后消息：userId 必填
     *   - 不要与 playerId（角色ID）混淆：userId 是账号，playerId 是角色
     */
    @java.lang.SuppressWarnings("all")
    public void setUserId(final String userId) {
        this.userId = userId;
    }

    /**
     * 消息描述（可选）
     *
     * 作用：用于日志记录和调试，客户端可以填写便于排查问题
     * 示例："用户点击登录按钮", "玩家移动到坐标(100,200)"
     */
    @java.lang.SuppressWarnings("all")
    public void setMessage(final String message) {
        this.message = message;
    }

    /**
     * 业务数据
     * 可以是 Map, POJO, 或其他JSON可序列化对象
     */
    @java.lang.SuppressWarnings("all")
    public void setData(final Object data) {
        this.data = data;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public boolean equals(final java.lang.Object o) {
        if (o == this) return true;
        if (!(o instanceof GameMessage)) return false;
        final GameMessage other = (GameMessage) o;
        if (!other.canEqual((java.lang.Object) this)) return false;
        final java.lang.Object this$msgId = this.getMsgId();
        final java.lang.Object other$msgId = other.getMsgId();
        if (this$msgId == null ? other$msgId != null : !this$msgId.equals(other$msgId)) return false;
        final java.lang.Object this$userId = this.getUserId();
        final java.lang.Object other$userId = other.getUserId();
        if (this$userId == null ? other$userId != null : !this$userId.equals(other$userId)) return false;
        final java.lang.Object this$message = this.getMessage();
        final java.lang.Object other$message = other.getMessage();
        if (this$message == null ? other$message != null : !this$message.equals(other$message)) return false;
        final java.lang.Object this$data = this.getData();
        final java.lang.Object other$data = other.getData();
        if (this$data == null ? other$data != null : !this$data.equals(other$data)) return false;
        return true;
    }

    @java.lang.SuppressWarnings("all")
    protected boolean canEqual(final java.lang.Object other) {
        return other instanceof GameMessage;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("all")
    public int hashCode() {
        final int PRIME = 59;
        int result = 1;
        final java.lang.Object $msgId = this.getMsgId();
        result = result * PRIME + ($msgId == null ? 43 : $msgId.hashCode());
        final java.lang.Object $userId = this.getUserId();
        result = result * PRIME + ($userId == null ? 43 : $userId.hashCode());
        final java.lang.Object $message = this.getMessage();
        result = result * PRIME + ($message == null ? 43 : $message.hashCode());
        final java.lang.Object $data = this.getData();
        result = result * PRIME + ($data == null ? 43 : $data.hashCode());
        return result;
    }

    @java.lang.SuppressWarnings("all")
    public GameMessage() {
    }

    @java.lang.SuppressWarnings("all")
    public GameMessage(final Short msgId, final String userId, final String message, final Object data) {
        this.msgId = msgId;
        this.userId = userId;
        this.message = message;
        this.data = data;
    }
}
