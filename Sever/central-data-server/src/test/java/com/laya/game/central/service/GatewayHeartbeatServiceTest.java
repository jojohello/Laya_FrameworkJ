package com.laya.game.central.service;

import com.laya.game.central.model.GatewayInfo;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;

class GatewayHeartbeatServiceTest {

    @Test
    void gracefulUnregisterIsImmediateAndIdempotent() {
        GatewayHeartbeatService service = new GatewayHeartbeatService();
        service.handleHeartbeat("127.0.0.1", 8082, 3, 2, 0);

        service.unregisterGateway("127.0.0.1", 8082);

        assertEquals(GatewayInfo.GatewayStatus.OFFLINE,
                service.getGateway("127.0.0.1", 8082).getStatus());
        assertDoesNotThrow(() -> service.unregisterGateway("127.0.0.1", 8082));
        assertDoesNotThrow(() -> service.unregisterGateway("127.0.0.2", 8082));
    }
}
