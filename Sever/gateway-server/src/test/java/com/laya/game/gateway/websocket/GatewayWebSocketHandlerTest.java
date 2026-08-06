package com.laya.game.gateway.websocket;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.laya.game.gateway.gameserver.GameServerConnectionManager;
import com.laya.game.gateway.model.ClientSession;
import com.laya.game.gateway.protocol.MessageIds;
import com.laya.game.gateway.service.CentralServerClient;
import com.laya.game.gateway.service.WaitingConnectionService;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class GatewayWebSocketHandlerTest {

    @SuppressWarnings("unchecked")
    @Test
    void authenticationForwardsTrustedRoutingAndReleasesCurrentConnection() throws Exception {
        ObjectMapper objectMapper = new ObjectMapper();
        WaitingConnectionService waitingService = mock(WaitingConnectionService.class);
        CentralServerClient centralClient = mock(CentralServerClient.class);
        GameServerConnectionManager gameServerManager = mock(GameServerConnectionManager.class);
        WebSocketSession socket = mock(WebSocketSession.class);
        List<TextMessage> clientMessages = new ArrayList<>();
        when(socket.getId()).thenReturn("session-1");
        when(socket.isOpen()).thenReturn(true);
        doAnswer(invocation -> {
            clientMessages.add((TextMessage) invocation.getArgument(0));
            return null;
        }).when(socket).sendMessage(any());
        when(waitingService.checkWaitingConnection("trusted-user")).thenReturn(true);
        when(centralClient.validateThreeFactors("trusted-user", 123456L, "secret-token")).thenReturn(true);
        when(centralClient.notifyUserConnected("trusted-user", "127.0.0.1", 8082)).thenReturn(true);
        when(gameServerManager.forwardToGameServer(any())).thenReturn(true);

        GatewayWebSocketHandler handler = new GatewayWebSocketHandler(
                waitingService, centralClient, gameServerManager, objectMapper);
        ReflectionTestUtils.setField(handler, "gatewayIp", "127.0.0.1");
        ReflectionTestUtils.setField(handler, "gatewayPort", 8082);
        ReflectionTestUtils.setField(handler, "gatewayIdValue", "gateway-1");
        Map<String, ClientSession> sessions =
                (Map<String, ClientSession>) ReflectionTestUtils.getField(handler, "sessions");
        sessions.put("session-1", new ClientSession(
                "session-1", socket, "remote", LocalDateTime.now(), false, null));

        GatewayWebSocketHandler.WebSocketMessage auth = new GatewayWebSocketHandler.WebSocketMessage(
                MessageIds.AUTH, "auth", Map.of(
                        "userId", "trusted-user",
                        "loginTimestamp", 123456L,
                        "token", "secret-token"));
        handler.handleMessage(socket, new TextMessage(objectMapper.writeValueAsString(auth)));

        assertEquals(1, handler.getOnlineUserCount());
        assertEquals(MessageIds.AUTH_SUCCESS,
                objectMapper.readTree(clientMessages.get(0).getPayload()).path("msgId").shortValue());
        verify(waitingService).removeFromWaitingList("trusted-user");

        GatewayWebSocketHandler.WebSocketMessage business = new GatewayWebSocketHandler.WebSocketMessage(
                (short) 3001, "business", Map.of(
                        "userId", "spoofed-user",
                        "sessionId", "spoofed-session",
                        "gatewayId", "spoofed-gateway",
                        "action", "load"));
        business.setUserId("spoofed-top-level-user");
        handler.handleMessage(socket, new TextMessage(objectMapper.writeValueAsString(business)));

        org.mockito.ArgumentCaptor<String> forwarded = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(gameServerManager).forwardToGameServer(forwarded.capture());
        JsonNode routed = objectMapper.readTree(forwarded.getValue());
        assertEquals("trusted-user", routed.path("userId").asText());
        assertEquals("trusted-user", routed.path("data").path("userId").asText());
        assertEquals("session-1", routed.path("data").path("sessionId").asText());
        assertEquals("gateway-1", routed.path("data").path("gatewayId").asText());
        assertEquals("load", routed.path("data").path("action").asText());

        handler.afterConnectionClosed(socket, CloseStatus.NORMAL);
        assertEquals(0, handler.getOnlineUserCount());
        verify(centralClient).notifyUserDisconnected("trusted-user", "127.0.0.1", 8082);
    }

    @SuppressWarnings("unchecked")
    @Test
    void configuredHeartbeatTimeoutClosesAndReleasesStaleConnection() throws Exception {
        CentralServerClient centralClient = mock(CentralServerClient.class);
        WebSocketSession socket = mock(WebSocketSession.class);
        when(socket.isOpen()).thenReturn(true);
        GatewayWebSocketHandler handler = new GatewayWebSocketHandler(
                mock(WaitingConnectionService.class), centralClient,
                mock(GameServerConnectionManager.class), new ObjectMapper());
        ReflectionTestUtils.setField(handler, "gatewayIp", "127.0.0.1");
        ReflectionTestUtils.setField(handler, "gatewayPort", 8082);
        ReflectionTestUtils.setField(handler, "heartbeatTimeout", 15000L);

        ClientSession stale = new ClientSession(
                "stale", socket, "remote", LocalDateTime.now().minusSeconds(16), true, "trusted-user");
        Map<String, ClientSession> sessions =
                (Map<String, ClientSession>) ReflectionTestUtils.getField(handler, "sessions");
        Map<String, String> userSessions =
                (Map<String, String>) ReflectionTestUtils.getField(handler, "userToSessionMap");
        sessions.put("stale", stale);
        userSessions.put("trusted-user", "stale");

        ReflectionTestUtils.invokeMethod(handler, "checkHeartbeat", "stale");

        assertFalse(sessions.containsKey("stale"));
        assertFalse(userSessions.containsKey("trusted-user"));
        verify(socket).close(any(CloseStatus.class));
        verify(centralClient).notifyUserDisconnected("trusted-user", "127.0.0.1", 8082);
    }

    @SuppressWarnings("unchecked")
    @Test
    void replacedSessionCleanupCannotReleaseCurrentConnection() {
        CentralServerClient centralClient = mock(CentralServerClient.class);
        GatewayWebSocketHandler handler = new GatewayWebSocketHandler(
                mock(WaitingConnectionService.class), centralClient,
                mock(GameServerConnectionManager.class), new ObjectMapper());

        Map<String, ClientSession> sessions = (Map<String, ClientSession>) ReflectionTestUtils.getField(handler, "sessions");
        Map<String, String> userSessions = (Map<String, String>) ReflectionTestUtils.getField(handler, "userToSessionMap");
        ClientSession oldSession = new ClientSession("old", mock(WebSocketSession.class), "remote", LocalDateTime.now(), true, "10001");
        sessions.put("old", oldSession);
        userSessions.put("10001", "new");

        ReflectionTestUtils.invokeMethod(handler, "cleanupSession", "old");

        assertFalse(sessions.containsKey("old"));
        assertEquals("new", userSessions.get("10001"));
        verifyNoInteractions(centralClient);
    }
}
