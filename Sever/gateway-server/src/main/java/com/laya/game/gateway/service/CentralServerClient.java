package com.laya.game.gateway.service;

import com.laya.game.gateway.protocol.payload.gatewaylifecycle.GatewayLifecyclePayloads.GatewayLifecycleRequest;
import com.laya.game.gateway.protocol.payload.gatewaylifecycle.GatewayLifecyclePayloads.GatewayLifecycleResponse;
import com.laya.game.gateway.protocol.payload.gatewaylifecycle.GatewayLifecyclePayloads.GatewayRegistrationRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.List;
import java.util.Map;

/**
 * 中心数据服务器HTTP客户端
 *
 * 负责与中心数据服务器进行HTTP通信
 * 包括三要素验证、用户信息查询等功能
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Service
public class CentralServerClient {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CentralServerClient.class);
    private final RestTemplate restTemplate;
    @Value("${laya.gateway.central-server.base-url:http://localhost:8083/api/v1}")
    private String centralServerBaseUrl;

    /**
     * 验证用户三要素（userId + loginTimestamp + token）
     */
    public boolean validateThreeFactors(String userId, Long loginTimestamp, String token) {
        try {
            String url = centralServerBaseUrl + "/sessions/validate";
            // 构建请求体
            Map<String, Object> requestBody = Map.of("userId", userId, "loginTimestamp", loginTimestamp, "token", token);
            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            // 发送请求
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, request, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null) {
                    Boolean success = (Boolean) responseBody.get("success");
                    if (Boolean.TRUE.equals(success)) {
                        log.info("Three factors validation successful for user {}", userId);
                        return true;
                    } else {
                        String message = (String) responseBody.get("message");
                        log.warn("Three factors validation failed for user {}: {}", userId, message);
                    }
                }
            } else {
                log.warn("Three factors validation request failed for user {}: HTTP {}", userId, response.getStatusCode());
            }
        } catch (Exception e) {
            log.error("Error validating three factors for user {}: {}", userId, e.getMessage(), e);
        }
        return false;
    }

    /**
     * 获取用户信息
     */
    public Map<String, Object> getUserInfo(String userId) {
        try {
            String url = centralServerBaseUrl + "/users/" + userId;
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, null, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null) {
                    Boolean success = (Boolean) responseBody.get("success");
                    if (Boolean.TRUE.equals(success)) {
                        return responseBody;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error getting user info for user {}: {}", userId, e.getMessage(), e);
        }
        return null;
    }

    /**
     * 通知中心服务器用户连接成功
     */
    public boolean notifyUserConnected(String userId, String gatewayIp, Integer gatewayPort) {
        try {
            String url = centralServerBaseUrl + "/gateway/confirm-connection";
            GatewayLifecycleRequest requestBody = new GatewayLifecycleRequest(userId, gatewayIp, gatewayPort);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<GatewayLifecycleRequest> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<GatewayLifecycleResponse> response = restTemplate.exchange(url, HttpMethod.PUT, request, GatewayLifecycleResponse.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                GatewayLifecycleResponse responseBody = response.getBody();
                if (responseBody != null && responseBody.success()) {
                    log.info("Central server notified of user {} connection", userId);
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Error notifying central server of user {} connection: {}", userId, e.getMessage(), e);
        }
        return false;
    }

    /**
     * 通知中心服务器用户断开连接
     */
    public boolean notifyUserDisconnected(String userId, String gatewayIp, Integer gatewayPort) {
        try {
            String url = centralServerBaseUrl + "/gateway/release";
            GatewayLifecycleRequest requestBody = new GatewayLifecycleRequest(userId, gatewayIp, gatewayPort);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<GatewayLifecycleRequest> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<GatewayLifecycleResponse> response = restTemplate.exchange(url, HttpMethod.DELETE, request, GatewayLifecycleResponse.class);
            if (response.getStatusCode() == HttpStatus.OK) {
                GatewayLifecycleResponse responseBody = response.getBody();
                if (responseBody != null && responseBody.success()) {
                    log.info("Central server notified of user {} disconnection", userId);
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Error notifying central server of user {} disconnection: {}", userId, e.getMessage(), e);
        }
        return false;
    }

    /** Notifies Central immediately during graceful Gateway shutdown. */
    public boolean unregisterGateway(String gatewayIp, Integer gatewayPort) {
        try {
            String url = centralServerBaseUrl + "/gateway/unregister";
            GatewayRegistrationRequest requestBody = new GatewayRegistrationRequest(gatewayIp, gatewayPort);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<GatewayRegistrationRequest> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<GatewayLifecycleResponse> response = restTemplate.exchange(
                    url, HttpMethod.DELETE, request, GatewayLifecycleResponse.class);
            GatewayLifecycleResponse body = response.getBody();
            return response.getStatusCode() == HttpStatus.OK && body != null && body.success();
        } catch (Exception e) {
            log.error("Error unregistering gateway {}:{}: {}", gatewayIp, gatewayPort, e.getMessage());
            return false;
        }
    }

    /**
     * 向中心服务器发送心跳（携带负载信息）
     */
    public boolean sendHeartbeat(String gatewayIp, Integer gatewayPort, Integer activeConnections, Integer authenticatedUsers, Integer waitingReconnections) {
        try {
            String url = centralServerBaseUrl + "/gateway/heartbeat";
            Map<String, Object> requestBody = Map.of("gatewayIp", gatewayIp, "gatewayPort", gatewayPort, "timestamp", System.currentTimeMillis(), "activeConnections", activeConnections, "authenticatedUsers", authenticatedUsers, "waitingReconnections", waitingReconnections);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, request, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null) {
                    Boolean success = (Boolean) responseBody.get("success");
                    if (Boolean.TRUE.equals(success)) {
                        return true;
                    }
                }
            }
            log.warn("Heartbeat failed: HTTP {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("Error sending heartbeat to central server: {}", e.getMessage());
        }
        return false;
    }

    /**
     * 获取Game Server列表
     */
    public List<Map<String, Object>> getGameServerList() {
        try {
            String url = centralServerBaseUrl + "/game-server/list";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, null, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (response.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> responseBody = response.getBody();
                if (responseBody != null) {
                    Boolean success = (Boolean) responseBody.get("success");
                    if (Boolean.TRUE.equals(success)) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> data = (List<Map<String, Object>>) responseBody.get("data");
                        log.debug("查询到 {} 个Game Server", data != null ? data.size() : 0);
                        return data;
                    }
                }
            }
            log.warn("查询Game Server列表失败: HTTP {}", response.getStatusCode());
        } catch (Exception e) {
            log.error("查询Game Server列表异常: {}", e.getMessage());
        }
        return null;
    }

    /**
     * 检查中心服务器连接状态
     */
    public boolean isConnected() {
        try {
            String url = centralServerBaseUrl + "/health";
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, null, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }

    @java.lang.SuppressWarnings("all")
    public CentralServerClient(final RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
}
