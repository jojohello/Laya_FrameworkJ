package com.laya.game.gateway.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class CentralServerClientTest {

    @Test
    void lifecycleCallsUseContractMethodPathAndGatewayIdentity() {
        RestTemplate restTemplate = new RestTemplate();
        MockRestServiceServer server = MockRestServiceServer.bindTo(restTemplate).build();
        CentralServerClient client = new CentralServerClient(restTemplate);
        ReflectionTestUtils.setField(client, "centralServerBaseUrl", "http://central/api/v1");

        String body = "{\"userId\":\"10001\",\"gatewayIp\":\"127.0.0.1\",\"gatewayPort\":8082}";
        server.expect(requestTo("http://central/api/v1/gateway/confirm-connection"))
                .andExpect(method(HttpMethod.PUT))
                .andExpect(content().json(body))
                .andRespond(withSuccess("{\"success\":true,\"message\":\"connection confirmed\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("http://central/api/v1/gateway/release"))
                .andExpect(method(HttpMethod.DELETE))
                .andExpect(content().json(body))
                .andRespond(withSuccess("{\"success\":true,\"message\":\"allocation released\"}", MediaType.APPLICATION_JSON));
        server.expect(requestTo("http://central/api/v1/gateway/unregister"))
                .andExpect(method(HttpMethod.DELETE))
                .andExpect(content().json("{\"gatewayIp\":\"127.0.0.1\",\"gatewayPort\":8082}"))
                .andRespond(withSuccess("{\"success\":true,\"message\":\"gateway unregistered\"}", MediaType.APPLICATION_JSON));

        assertTrue(client.notifyUserConnected("10001", "127.0.0.1", 8082));
        assertTrue(client.notifyUserDisconnected("10001", "127.0.0.1", 8082));
        assertTrue(client.unregisterGateway("127.0.0.1", 8082));
        server.verify();
    }
}
