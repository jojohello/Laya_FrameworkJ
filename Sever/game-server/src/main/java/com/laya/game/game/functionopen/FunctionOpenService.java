package com.laya.game.game.functionopen;

import com.laya.game.game.config.ConfigManager;
import com.laya.game.game.configStruct.FunctionOpenConfig;
import com.laya.game.game.handler.MessageContext;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FunctionOpenService {
    private final ConfigManager configManager;
    private final FunctionOpenRepository repository;
    private final FunctionOpenCondition condition = new SimpleFunctionOpenCondition();

    public FunctionOpenService(ConfigManager configManager, FunctionOpenRepository repository) {
        this.configManager = configManager;
        this.repository = repository;
    }

    public List<FunctionOpenState> getStates(long playerId) {
        return repository.findOpened(playerId);
    }

    public boolean evaluateAndOpen(long playerId, int functionId, Map<String, Object> eventData) {
        FunctionOpenConfig config = configManager.get(FunctionOpenConfig.class, functionId);
        if (config == null || !condition.matches(config, eventData)) return false;
        return repository.open(playerId, functionId);
    }

    public boolean evaluateAndOpen(String userId, long playerId, int functionId, Map<String, Object> eventData,
                                   MessageContext context) {
        boolean opened = evaluateAndOpen(playerId, functionId, eventData);
        if (opened && context != null) sendOpenedPush(userId, functionId, context);
        return opened;
    }

    public void sendOpenedPush(String userId, int functionId, MessageContext context) {
        GameMessage push = new GameMessage();
        push.setMsgId(MessageIds.FUNCTION_OPEN_PUSH);
        push.setUserId(userId);
        push.setData(Map.of("state", new FunctionOpenState(functionId, true,
                System.currentTimeMillis(), 1)));
        context.sendResponse(push);
    }

    public void sendFullState(String userId, long playerId, MessageContext context) {
        Map<String, Object> data = new HashMap<>();
        data.put("functionOpenStates", getStates(playerId));
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.FUNCTION_OPEN_STATES);
        response.setUserId(userId);
        response.setData(data);
        context.sendResponse(response);
    }
}
