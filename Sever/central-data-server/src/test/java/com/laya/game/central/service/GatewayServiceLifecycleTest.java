package com.laya.game.central.service;

import com.laya.game.central.model.GatewayAllocation;
import com.laya.game.central.repository.GatewayAllocationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GatewayServiceLifecycleTest {

    @Test
    void gatewayLoadAcceptsRepositoryAddressAndLongCountTuple() {
        GatewayAllocationRepository repository = mock(GatewayAllocationRepository.class);
        GatewayService service = new GatewayService(repository, mock(RestTemplate.class));
        GatewayService.GatewayConfig config = new GatewayService.GatewayConfig();
        GatewayService.GatewayConfig.GatewayServerInfo gateway = new GatewayService.GatewayConfig.GatewayServerInfo();
        gateway.setIp("127.0.0.1");
        gateway.setPort(8082);
        config.setAvailableGateways(List.of(gateway));
        ReflectionTestUtils.setField(service, "gatewayConfig", config);
        when(repository.findGatewayLoadBalancing(GatewayAllocation.AllocationStatus.CONNECTED))
                .thenReturn(List.<Object[]>of(new Object[]{"127.0.0.1:8082", 1L}));

        List<GatewayService.GatewayLoadInfo> load = assertDoesNotThrow(service::getGatewayLoadInfo);

        assertEquals(1, load.size());
        assertEquals(1, load.get(0).getCurrentLoad());
    }

    @Test
    void allocatedConnectionTransitionsToConnected() {
        GatewayAllocationRepository repository = mock(GatewayAllocationRepository.class);
        GatewayService service = new GatewayService(repository, mock(RestTemplate.class));
        GatewayAllocation allocation = allocation(GatewayAllocation.AllocationStatus.ALLOCATED);
        when(repository.findByUserId("10001")).thenReturn(Optional.of(allocation));

        assertTrue(service.confirmConnection("10001", "127.0.0.1", 8082));
        verify(repository).confirmConnection(eq("10001"), eq(GatewayAllocation.AllocationStatus.ALLOCATED),
                eq(GatewayAllocation.AllocationStatus.CONNECTED), any(LocalDateTime.class));
    }

    @Test
    void repeatedConfirmationIsIdempotentButMismatchedGatewayIsRejected() {
        GatewayAllocationRepository repository = mock(GatewayAllocationRepository.class);
        GatewayService service = new GatewayService(repository, mock(RestTemplate.class));
        when(repository.findByUserId("10001")).thenReturn(Optional.of(allocation(GatewayAllocation.AllocationStatus.CONNECTED)));

        assertTrue(service.confirmConnection("10001", "127.0.0.1", 8082));
        assertFalse(service.confirmConnection("10001", "127.0.0.2", 8082));
        verify(repository, never()).confirmConnection(any(), any(), any(), any());
    }

    @Test
    void repeatedReleaseWithoutAllocationIsIdempotent() {
        GatewayAllocationRepository repository = mock(GatewayAllocationRepository.class);
        GatewayService service = new GatewayService(repository, mock(RestTemplate.class));
        when(repository.findByUserId("10001")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> service.releaseAllocation("10001", "127.0.0.1", 8082));
    }

    private static GatewayAllocation allocation(GatewayAllocation.AllocationStatus status) {
        GatewayAllocation allocation = new GatewayAllocation();
        allocation.setUserId("10001");
        allocation.setGatewayIp("127.0.0.1");
        allocation.setGatewayPort(8082);
        allocation.setStatus(status);
        allocation.setExpiresAt(LocalDateTime.now().plusMinutes(1));
        return allocation;
    }
}