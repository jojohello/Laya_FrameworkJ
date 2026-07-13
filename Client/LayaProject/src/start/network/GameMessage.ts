// jojohello 2025-10-30
// 游戏消息接口定义

/**
 * 游戏消息基础接口
 *
 * 架构设计（统一分层协议）：
 * - 路由层字段（msgId, userId）放在消息顶层 → Gateway 直接读取，无需解析 data
 * - 业务层数据放在 data 字段中 → Game Server 处理
 * - 性能优化：
 *   1. Gateway 不需要反序列化 data，只读取顶层字段
 *   2. 使用 number 类型的 msgId（更高效，类型安全）
 *   3. WebSocket 是长连接，Gateway 已知道连接归属，不需要每次验证
 *
 * 统一格式：
 * {
 *   msgId: 2001,              // number: 消息ID（HEARTBEAT）
 *   userId: "guest_123",      // string: 用户ID（路由用）
 *   data: { ... }             // any: 业务数据
 * }
 */
export interface GameMessage {
    // ========== 消息头部（路由层）==========
    /**
     * 消息ID（统一使用数字）
     *
     * 类型：number（对应服务器端的 short，范围 0-65535）
     * 示例：2001 (HEARTBEAT), 101 (LOGIN), 3010 (GET_PLAYER_INFO)
     *
     * 优势：
     *   - 性能更优：整数比较比字符串快 ~10倍
     *   - 网络节省：占用更少字节
     *   - 类型安全：编译时检查，避免拼写错误
     */
    msgId: number;

    /**
     * 用户ID（可选，用于路由）
     * Gateway 通过 userId 路由到对应的 Game Server
     * Game Server 通过 userId 路由回对应的 Gateway
     */
    userId?: string;

    /**
     * 消息描述（可选，用于调试）
     */
    message?: string;

    // ========== 消息数据（业务层）==========
    /**
     * 业务数据（可选）
     */
    data?: any;
}

/**
 * 创建游戏消息的工厂方法
 */
export function createGameMessage(
    msgId: number,
    data?: any,
    message?: string,
    userId?: string
): GameMessage {
    return {
        msgId,
        userId,
        message,
        data
    };
}
