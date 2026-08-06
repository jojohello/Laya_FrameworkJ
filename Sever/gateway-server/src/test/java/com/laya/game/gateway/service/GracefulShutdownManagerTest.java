package com.laya.game.gateway.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GracefulShutdownManagerTest {

    @Test
    void shutdownImmediatelyUnregistersAdvertisedGatewayIdentity() {
        CentralServerClient centralClient = mock(CentralServerClient.class);
        when(centralClient.unregisterGateway("127.0.0.1", 8082)).thenReturn(true);
        GracefulShutdownManager manager = new GracefulShutdownManager(centralClient);
        ReflectionTestUtils.setField(manager, "gatewayIp", "127.0.0.1");
        ReflectionTestUtils.setField(manager, "gatewayPort", 8082);

        manager.shutdownNow();

        verify(centralClient).unregisterGateway("127.0.0.1", 8082);
    }
}
