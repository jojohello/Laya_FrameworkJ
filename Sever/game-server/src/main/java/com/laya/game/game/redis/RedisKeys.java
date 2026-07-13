package com.laya.game.game.redis;

/**
 * Redis Key 生成器
 * 统一管理所有 Redis Key 的命名规范
 *
 * Key 命名规范：
 * - 前缀：game:
 * - 格式：game:{模块}:{实体}:{ID}:{子字段}
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
public class RedisKeys {

    /**
     * 统一前缀
     */
    private static final String PREFIX = "game:";

    // ==================== 玩家相关 ====================

    /**
     * 玩家基本信息
     * 格式：game:player:{userId}
     * 类型：Hash
     *
     * @param userId 用户ID
     * @return Key
     */
    public static String player(String userId) {
        return PREFIX + "player:" + userId;
    }

    /**
     * 玩家位置
     * 格式：game:player:{userId}:position
     * 类型：String (JSON)
     *
     * @param userId 用户ID
     * @return Key
     */
    public static String playerPosition(String userId) {
        return PREFIX + "player:" + userId + ":position";
    }

    /**
     * 玩家背包
     * 格式：game:player:{userId}:inventory
     * 类型：Hash (itemId -> count)
     *
     * @param userId 用户ID
     * @return Key
     */
    public static String playerInventory(String userId) {
        return PREFIX + "player:" + userId + ":inventory";
    }

    // ==================== 房间相关 ====================

    /**
     * 房间信息
     * 格式：game:room:{roomId}
     * 类型：Hash
     *
     * @param roomId 房间ID
     * @return Key
     */
    public static String room(String roomId) {
        return PREFIX + "room:" + roomId;
    }

    /**
     * 房间玩家列表
     * 格式：game:room:{roomId}:players
     * 类型：Set (userId集合)
     *
     * @param roomId 房间ID
     * @return Key
     */
    public static String roomPlayers(String roomId) {
        return PREFIX + "room:" + roomId + ":players";
    }

    // ==================== 路由表相关（核心功能）====================

    /**
     * 用户所在 Gateway 映射
     * 格式：game:user_gateway:{userId}
     * 类型：String (gatewayId)
     *
     * 这是核心路由表！用于查询用户在哪个Gateway上
     *
     * @param userId 用户ID
     * @return Key
     */
    public static String userGateway(String userId) {
        return PREFIX + "user_gateway:" + userId;
    }

    /**
     * Gateway 上的用户列表
     * 格式：game:gateway:{gatewayId}:users
     * 类型：Set (userId集合)
     *
     * 反向索引，查询某个Gateway上有哪些用户
     *
     * @param gatewayId Gateway ID
     * @return Key
     */
    public static String gatewayUsers(String gatewayId) {
        return PREFIX + "gateway:" + gatewayId + ":users";
    }

    // ==================== 索引相关 ====================

    /**
     * 用户所在房间映射
     * 格式：game:user_room:{userId}
     * 类型：String (roomId)
     *
     * @param userId 用户ID
     * @return Key
     */
    public static String userRoom(String userId) {
        return PREFIX + "user_room:" + userId;
    }

    /**
     * 在线玩家集合
     * 格式：game:online_players
     * 类型：Set (userId集合)
     *
     * @return Key
     */
    public static String onlinePlayers() {
        return PREFIX + "online_players";
    }

    // ==================== 会话相关 ====================

    /**
     * 用户会话信息
     * 格式：game:session:{userId}
     * 类型：Hash
     *
     * @param userId 用户ID
     * @return Key
     */
    public static String userSession(String userId) {
        return PREFIX + "session:" + userId;
    }

    // ==================== 统计相关 ====================

    /**
     * 在线人数统计
     * 格式：game:stats:online_count
     * 类型：String (数字)
     *
     * @return Key
     */
    public static String statsOnlineCount() {
        return PREFIX + "stats:online_count";
    }

    /**
     * 活跃房间数统计
     * 格式：game:stats:active_rooms
     * 类型：String (数字)
     *
     * @return Key
     */
    public static String statsActiveRooms() {
        return PREFIX + "stats:active_rooms";
    }

    // ==================== 工具方法 ====================

    /**
     * 根据前缀匹配所有Key（慎用，仅用于调试）
     *
     * @param pattern 匹配模式，如 "game:player:*"
     * @return 匹配模式
     */
    public static String pattern(String pattern) {
        if (pattern.startsWith(PREFIX)) {
            return pattern;
        }
        return PREFIX + pattern;
    }
}
