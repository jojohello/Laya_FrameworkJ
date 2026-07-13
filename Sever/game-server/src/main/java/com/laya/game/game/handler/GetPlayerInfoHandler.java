package com.laya.game.game.handler;

import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.Map;

/**
 * 获取玩家信息处理器
 *
 * 处理客户端的获取玩家信息请求
 *
 * 【重要】userId 的含义：
 *   - userId = 账号ID（Account ID），不是角色ID（Player ID）
 *   - 当前返回的是账号基础信息（Mock数据）
 *   - Phase 2 实现角色系统后：
 *     * 客户端请求：{"type":"GET_PLAYER_INFO","data":{"playerId":"player_123"}}
 *     * 返回角色详细信息：等级、装备、技能、背包等
 *   - 设计思路：
 *     * 账号信息（userId）：充值记录、VIP等级、封禁状态等
 *     * 角色信息（playerId）：等级、装备、技能、战斗力等
 *
 * 消息格式：
 *   请求：{"type":"GET_PLAYER_INFO","userId":"guest_123","data":{"userId":"guest_123"}}
 *   成功：{"type":"PLAYER_INFO","data":{"userId":"guest_123","level":10,...}}
 *   失败：{"type":"ERROR","data":{"reason":"Player not found"}}
 *
 * @author Laya Game Server
 * @since 2025-10-30
 */
@Component
public class GetPlayerInfoHandler implements MessageHandler {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GetPlayerInfoHandler.class);

    @Override
    public Short getMessageId() {
        return MessageIds.GET_PLAYER_INFO;
    }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        try {
            // 提取请求参数
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) message.getData();
            String requestedUserId = (String) data.get("userId");
            // 如果没有提供userId，使用context中的userId（当前登录用户）
            String userId = (requestedUserId != null && !requestedUserId.isEmpty()) ? requestedUserId : context.getUserId();
            if (userId == null || userId.isEmpty()) {
                sendError(context, "用户ID不能为空");
                return;
            }
            log.info("收到获取玩家信息请求: userId={}, gatewayId={}", userId, context.getGatewayId());
            // 获取玩家信息（Mock实现）
            // TODO: 实际项目中应该从数据库查询玩家信息
            Map<String, Object> playerInfo = getPlayerInfo(userId);
            if (playerInfo == null) {
                sendError(context, "玩家不存在");
                return;
            }
            // 返回玩家信息
            GameMessage response = new GameMessage();
            response.setMsgId(MessageIds.PLAYER_INFO);
            response.setMessage("获取玩家信息成功");
            response.setData(playerInfo);
            context.sendResponse(response);
            log.info("返回玩家信息成功: userId={}", userId);
        } catch (Exception e) {
            log.error("获取玩家信息处理异常", e);
            sendError(context, "服务器内部错误");
        }
    }

    /**
     * 发送错误响应
     */
    private void sendError(MessageContext context, String reason) {
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("reason", reason);
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.ERROR);
        response.setMessage("获取玩家信息失败");
        response.setData(errorData);
        context.sendResponse(response);
        log.warn("获取玩家信息失败: reason={}, gatewayId={}", reason, context.getGatewayId());
    }

    /**
     * 获取玩家信息（Mock实现）
     *
     * @param userId 用户ID
     * @return 玩家信息
     */
    private Map<String, Object> getPlayerInfo(String userId) {
        // Mock: 返回假数据
        // 实际项目中应该从数据库查询
        Map<String, Object> playerInfo = new HashMap<>();
        playerInfo.put("userId", userId);
        playerInfo.put("username", "Player_" + userId.substring(userId.lastIndexOf('_') + 1));
        playerInfo.put("level", 10);
        playerInfo.put("exp", 5000);
        playerInfo.put("gold", 10000);
        playerInfo.put("diamond", 500);
        // 装备信息
        Map<String, Object> equipment = new HashMap<>();
        equipment.put("weapon", "传说之剑");
        equipment.put("armor", "龙鳞铠甲");
        equipment.put("accessory", "幸运项链");
        playerInfo.put("equipment", equipment);
        // 属性信息
        Map<String, Object> stats = new HashMap<>();
        stats.put("hp", 1000);
        stats.put("mp", 500);
        stats.put("attack", 150);
        stats.put("defense", 100);
        stats.put("speed", 80);
        playerInfo.put("stats", stats);
        playerInfo.put("lastLoginTime", System.currentTimeMillis());
        return playerInfo;
    }

    @java.lang.SuppressWarnings("all")
    public GetPlayerInfoHandler() {
    }
}
