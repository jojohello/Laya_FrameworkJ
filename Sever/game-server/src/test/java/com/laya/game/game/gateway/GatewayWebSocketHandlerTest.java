package com.laya.game.game.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laya.game.game.handler.MessageRouter;
import com.laya.game.game.protocol.BroadcastRequest;
import com.laya.game.game.protocol.GameMessage;
import com.laya.game.game.protocol.MessageIds;
import com.laya.game.game.wallet.WalletInitData;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

class GatewayWebSocketHandlerTest {

    @Test
    void outboundGameInitUsesValidJsonForNumericCurrencyIds() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        GatewayWebSocketHandler handler =
                new GatewayWebSocketHandler(null, null, null, objectMapper, null);

        GameMessage message = new GameMessage();
        message.setMsgId(MessageIds.GAME_INIT_RESPONSE);
        message.setUserId("user-1");
        message.setData(Map.of(
                "sections", Map.of(
                        "wallet", new WalletInitData(Map.of(1001, "0"))
                )
        ));

        String json = handler.serializeOutbound(BroadcastRequest.toUser("user-1", message));
        JsonNode root = objectMapper.readTree(json);

        assertEquals("0", root.path("message")
                .path("data")
                .path("sections")
                .path("wallet")
                .path("balances")
                .path("1001")
                .asText());
        assertFalse(json.contains("{1001:"));
    }
}
