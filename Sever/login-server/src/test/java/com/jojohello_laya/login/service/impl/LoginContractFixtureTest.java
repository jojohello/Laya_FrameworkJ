package com.jojohello_laya.login.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jojohello_laya.login.protocol.payload.login.LoginPayloads.LoginRequest;
import com.jojohello_laya.login.protocol.payload.login.LoginPayloads.LoginResponse;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LoginContractFixtureTest {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Path fixtureRoot = Path.of("..", "..", "Protocol", "contracts", "login", "fixtures");

    @Test
    void parsesCanonicalRequests() throws Exception {
        assertRoundTrip("wechat-request.json", LoginRequest.class);
        assertRoundTrip("developer-request.json", LoginRequest.class);
    }

    @Test
    void parsesCanonicalResponses() throws Exception {
        assertRoundTrip("success-response.json", LoginResponse.class);
        assertRoundTrip("error-response.json", LoginResponse.class);
    }

    private <T> void assertRoundTrip(String fileName, Class<T> type) throws Exception {
        String json = Files.readString(fixtureRoot.resolve(fileName));
        JsonNode expected = objectMapper.readTree(json);
        T payload = objectMapper.readValue(json, type);
        assertEquals(expected, objectMapper.valueToTree(payload));
    }
}
