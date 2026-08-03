package com.laya.game.game.handler;

import com.laya.game.game.bag.BagService;
import com.laya.game.game.protocol.payload.bag.BagPayloads;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import org.springframework.stereotype.Component;
import java.util.Map;

@Component
public class BagSnapshotHandler implements MessageHandler {
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(BagSnapshotHandler.class);
    private final BagService bagService;

    public BagSnapshotHandler(BagService bagService) {
        this.bagService = bagService;
    }

    @Override
    public Short getMessageId() {
        return MessageIds.BAG_SNAPSHOT_REQUEST;
    }

    @Override
    public void handle(GameMessage message, MessageContext context) {
        Long playerId = context.getPlayerId();
        if (playerId == null) {
            send(context, new BagPayloads.BagSnapshotResponse(false, null, "player_not_selected"));
            return;
        }
        try {
            Map<?, ?> data = message.getData() instanceof Map<?, ?> map ? map : Map.of();
            if (data.size() != 1 || !data.containsKey("bagType")) {
                send(context, new BagPayloads.BagSnapshotResponse(false, null, "invalid_bag_type"));
                return;
            }
            BagPayloads.BagType bagType = BagPayloads.BagType.fromWire(String.valueOf(data.get("bagType")));
            send(context, new BagPayloads.BagSnapshotResponse(true, bagService.snapshot(playerId, bagType), null));
        } catch (IllegalArgumentException exception) {
            send(context, new BagPayloads.BagSnapshotResponse(false, null, "invalid_bag_type"));
        } catch (RuntimeException exception) {
            log.error("[BAG_SNAPSHOT] Failed to build snapshot: playerId={}", playerId, exception);
            send(context, new BagPayloads.BagSnapshotResponse(false, null, "bag_snapshot_invalid"));
        }
    }

    private void send(MessageContext context, BagPayloads.BagSnapshotResponse data) {
        GameMessage response = new GameMessage();
        response.setMsgId(MessageIds.BAG_SNAPSHOT_RESPONSE);
        response.setData(data);
        context.sendResponse(response);
    }
}
