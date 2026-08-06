package com.laya.game.gateway.service;

import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Reports an intentional Gateway shutdown without waiting for heartbeat expiry. */
@Service
public class GracefulShutdownManager {
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(GracefulShutdownManager.class);

    private final CentralServerClient centralServerClient;

    @Value("${laya.gateway.server-ip}")
    private String gatewayIp;

    @Value("${laya.gateway.server-port}")
    private int gatewayPort;

    public GracefulShutdownManager(CentralServerClient centralServerClient) {
        this.centralServerClient = centralServerClient;
    }

    @PreDestroy
    public void onShutdown() {
        if (centralServerClient.unregisterGateway(gatewayIp, gatewayPort)) {
            log.info("Gateway unregistered from Central: {}:{}", gatewayIp, gatewayPort);
        } else {
            // Central's heartbeat timeout remains the fallback for network or shutdown races.
            log.warn("Gateway unregister failed; Central heartbeat timeout will mark {}:{} offline",
                    gatewayIp, gatewayPort);
        }
    }

    public void shutdownNow() {
        onShutdown();
    }
}
