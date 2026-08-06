package com.laya.game.central.controller;

import com.laya.game.central.service.GatewayHeartbeatService;
import com.laya.game.central.service.GatewayService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GatewayControllerContractTest {

    private GatewayService gatewayService;
    private GatewayHeartbeatService heartbeatService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        gatewayService = mock(GatewayService.class);
        heartbeatService = mock(GatewayHeartbeatService.class);
        GatewayController controller = new GatewayController(gatewayService, heartbeatService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void confirmRouteUsesPutAndGeneratedPayloadShape() throws Exception {
        when(gatewayService.confirmConnection("10001", "127.0.0.1", 8082)).thenReturn(true);

        mockMvc.perform(put("/api/v1/gateway/confirm-connection")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("connection confirmed"));
    }

    @Test
    void releaseRouteUsesDeleteAndGeneratedPayloadShape() throws Exception {
        mockMvc.perform(delete("/api/v1/gateway/release")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("allocation released"));

        verify(gatewayService).releaseAllocation("10001", "127.0.0.1", 8082);
    }

    @Test
    void unregisterRouteMarksGatewayOfflineWithGeneratedPayload() throws Exception {
        mockMvc.perform(delete("/api/v1/gateway/unregister")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"gatewayIp\":\"127.0.0.1\",\"gatewayPort\":8082}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("gateway unregistered"));

        verify(heartbeatService).unregisterGateway("127.0.0.1", 8082);
    }

    private static String requestBody() {
        return "{\"userId\":\"10001\",\"gatewayIp\":\"127.0.0.1\",\"gatewayPort\":8082}";
    }
}
