package com.laya.game.game.handler;

import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 消息路由器
 *
 * 负责将消息分发到对应的处理器
 *
 * @author Laya Game Server
 * @since 2025-10-30
 */
@Component
public class MessageRouter {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MessageRouter.class);
    private final Map<Short, MessageHandler> handlers = new HashMap<>();
    private final List<MessageHandler> handlerList;

    /**
     * 构造函数
     * Spring会自动注入所有MessageHandler的实现
     *
     * @param handlerList 处理器列表
     */
    public MessageRouter(List<MessageHandler> handlerList) {
        this.handlerList = handlerList;
    }

    /**
     * 初始化：注册所有处理器
     */
    @PostConstruct
    public void initialize() {
        log.info("========================================");
        log.info("初始化 Message Router...");
        for (MessageHandler handler : handlerList) {
            Short msgId = handler.getMessageId();
            handlers.put(msgId, handler);
            log.info("[OK] 注册Handler: msgId={} ({}), handler={}", msgId, MessageIds.getName(msgId), handler.getClass().getSimpleName());
        }
        log.info("[OK] Message Router 初始化完成，共注册 {} 个处理器", handlers.size());
        log.info("========================================");
    }

    /**
     * 路由消息到对应的处理器
     *
     * @param message 消息
     * @param context 上下文
     * @return 是否成功处理
     */
    public boolean route(GameMessage message, MessageContext context) {
        if (message == null || message.getMsgId() == null) {
            log.warn("消息或消息ID为空，无法路由");
            return false;
        }
        Short msgId = message.getMsgId();
        MessageHandler handler = handlers.get(msgId);
        if (handler == null) {
            log.warn("未找到消息处理器: msgId={} ({})", msgId, MessageIds.getName(msgId));
            sendUnsupportedMessageError(context, msgId);
            return false;
        }
        try {
            log.debug("路由消息: msgId={} ({}) -> handler={}", msgId, MessageIds.getName(msgId), handler.getClass().getSimpleName());
            handler.handle(message, context);
            return true;
        } catch (Exception e) {
            log.error("处理消息异常: msgId={} ({}), handler={}", msgId, MessageIds.getName(msgId), handler.getClass().getSimpleName(), e);
            sendInternalError(context);
            return false;
        }
    }

    /**
     * 发送不支持的消息类型错误
     */
    private void sendUnsupportedMessageError(MessageContext context, Short msgId) {
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("reason", "不支持的消息ID: " + msgId + " (" + MessageIds.getName(msgId) + ")");
        errorData.put("msgId", msgId);
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.ERROR);
        response.setMessage("不支持的消息ID");
        response.setData(errorData);
        context.sendResponse(response);
    }

    /**
     * 发送服务器内部错误
     */
    private void sendInternalError(MessageContext context) {
        Map<String, Object> errorData = new HashMap<>();
        errorData.put("reason", "服务器内部错误");
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.ERROR);
        response.setMessage("服务器内部错误");
        response.setData(errorData);
        context.sendResponse(response);
    }

    /**
     * 获取已注册的处理器数量
     */
    public int getHandlerCount() {
        return handlers.size();
    }

    /**
     * 检查是否支持指定消息ID
     */
    public boolean supportsMessageId(Short msgId) {
        return handlers.containsKey(msgId);
    }
}
