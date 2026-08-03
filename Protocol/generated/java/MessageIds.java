package com.laya.game.protocol;

/**
 * 消息ID定义
 *
 * ⚠️ 此文件由 Protocol/message-ids.yaml 自动生成
 * ⚠️ 请勿手动修改，修改请编辑 message-ids.yaml 后重新生成
 *
 * @generated
 * @version 1.1.0
 */
public class MessageIds {

    // ========== Start包硬编码消息 (101-199) ==========
    public static final short LOGIN = 101;
    public static final short LOGIN_SUCCESS = 102;
    public static final short LOGIN_FAILED = 103;
    public static final short GAME_INIT_REQUEST = 105;
    public static final short GAME_INIT_RESPONSE = 106;

    // ========== 认证类 (1xxx) ==========
    public static final short AUTH = 1001;
    public static final short AUTH_SUCCESS = 1002;
    public static final short AUTH_FAILED = 1003;

    // ========== 心跳类 (2xxx) ==========
    public static final short HEARTBEAT = 2001;
    public static final short HEARTBEAT_RESPONSE = 2002;

    // ========== 游戏逻辑类 (3xxx) ==========
    public static final short GET_PLAYER_INFO = 3010;
    public static final short PLAYER_INFO = 3011;
    public static final short PLAYER_LEVEL_UP_REQUEST = 3012;
    public static final short PLAYER_LEVEL_UP_RESPONSE = 3013;
    public static final short BATTLE_ENTER_REQUEST = 3014;
    public static final short BATTLE_ENTER_RESPONSE = 3015;
    public static final short BATTLE_COMPLETE_REQUEST = 3016;
    public static final short BATTLE_COMPLETE_RESPONSE = 3017;
    public static final short FUNCTION_OPEN_STATES = 4001;
    public static final short FUNCTION_OPEN_PUSH = 4002;
    public static final short GUIDE_PROGRESS_REQUEST = 4101;
    public static final short GUIDE_PROGRESS_RESPONSE = 4102;

    // ========== 背包类 (5xxx) ==========
    public static final short BAG_SNAPSHOT_REQUEST = 5001;
    public static final short BAG_SNAPSHOT_RESPONSE = 5002;

    // ========== 系统类 (9xxx) ==========
    public static final short ERROR = 9001;
    public static final short NOTIFICATION = 9002;
    public static final short KICK = 9004;

    // 私有构造函数（工具类）
    private MessageIds() {}



    /**
     * 根据ID获取消息名称（用于日志）
     *
     * @param id 消息ID
     * @return 消息名称，如果未找到返回 "UNKNOWN(id)"
     */
    public static String getName(short id) {
        switch (id) {
            case 101: return "LOGIN";
            case 102: return "LOGIN_SUCCESS";
            case 103: return "LOGIN_FAILED";
            case 105: return "GAME_INIT_REQUEST";
            case 106: return "GAME_INIT_RESPONSE";
            case 1001: return "AUTH";
            case 1002: return "AUTH_SUCCESS";
            case 1003: return "AUTH_FAILED";
            case 2001: return "HEARTBEAT";
            case 2002: return "HEARTBEAT_RESPONSE";
            case 3010: return "GET_PLAYER_INFO";
            case 3011: return "PLAYER_INFO";
            case 3012: return "PLAYER_LEVEL_UP_REQUEST";
            case 3013: return "PLAYER_LEVEL_UP_RESPONSE";
            case 3014: return "BATTLE_ENTER_REQUEST";
            case 3015: return "BATTLE_ENTER_RESPONSE";
            case 3016: return "BATTLE_COMPLETE_REQUEST";
            case 3017: return "BATTLE_COMPLETE_RESPONSE";
            case 4001: return "FUNCTION_OPEN_STATES";
            case 4002: return "FUNCTION_OPEN_PUSH";
            case 4101: return "GUIDE_PROGRESS_REQUEST";
            case 4102: return "GUIDE_PROGRESS_RESPONSE";
            case 5001: return "BAG_SNAPSHOT_REQUEST";
            case 5002: return "BAG_SNAPSHOT_RESPONSE";
            case 9001: return "ERROR";
            case 9002: return "NOTIFICATION";
            case 9004: return "KICK";
            default: return "UNKNOWN(" + id + ")";
        }
    }
}
