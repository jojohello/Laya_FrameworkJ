package com.laya.game.gateway.protocol.payload.gatewaylifecycle;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.List;

/** Generated from Protocol/contracts/gateway-lifecycle/schema.json. Do not edit. */
public final class GatewayLifecyclePayloads {
    private GatewayLifecyclePayloads() {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record GatewayLifecycleRequest(String userId, String gatewayIp, int gatewayPort) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record GatewayRegistrationRequest(String gatewayIp, int gatewayPort) {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record GatewayLifecycleResponse(boolean success, String message) {}

}
