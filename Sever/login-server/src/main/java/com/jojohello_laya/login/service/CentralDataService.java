package com.jojohello_laya.login.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jojohello_laya.login.config.CentralServerConfig;
import com.jojohello_laya.login.entity.LoginRecord;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * 中心数据服务器HTTP通信服务
 * 
 * @author laya-game
 */
@Service
public class CentralDataService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(CentralDataService.class);
    private final CentralServerConfig config;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final CentralWebSocketClient webSocketClient;

    /**
     * 存储登录记录到中心服务器
     */
    public boolean storeLoginRecord(LoginRecord record) {
        try {
            log.info("正在向中心服务器存储登录记录: userId={}, loginTimestamp={}", record.getUserId(), record.getLoginTimestamp());
            String url = config.getUrl() + "/api/login/store";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<LoginRecord> request = new HttpEntity<>(record, headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, request, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("登录记录存储成功: userId={}", record.getUserId());
                return true;
            } else {
                log.warn("登录记录存储失败，状态码: {}", response.getStatusCode());
                return false;
            }
        } catch (HttpClientErrorException e) {
            log.error("存储登录记录客户端错误: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (HttpServerErrorException e) {
            log.error("存储登录记录服务器错误: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (ResourceAccessException e) {
            log.error("存储登录记录网络错误: {}", e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("存储登录记录异常: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 从中心服务器获取登录记录
     */
    public LoginRecord getLoginRecord(String token) {
        try {
            log.debug("正在从中心服务器获取登录记录");
            String url = config.getUrl() + "/api/login/get?token=" + token;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<?> request = new HttpEntity<>(headers);
            ResponseEntity<LoginRecord> response = restTemplate.exchange(url, HttpMethod.GET, request, LoginRecord.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.debug("登录记录获取成功");
                return response.getBody();
            } else {
                log.warn("登录记录获取失败，状态码: {}", response.getStatusCode());
                return null;
            }
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                log.debug("登录记录不存在");
            } else {
                log.error("获取登录记录客户端错误: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            }
            return null;
        } catch (HttpServerErrorException e) {
            log.error("获取登录记录服务器错误: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return null;
        } catch (ResourceAccessException e) {
            log.error("获取登录记录网络错误: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("获取登录记录异常: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 异步存储登录记录
     */
    public CompletableFuture<Boolean> storeLoginRecordAsync(LoginRecord record) {
        return CompletableFuture.supplyAsync(() -> storeLoginRecord(record));
    }

    /**
     * 异步获取登录记录
     */
    public CompletableFuture<LoginRecord> getLoginRecordAsync(String token) {
        return CompletableFuture.supplyAsync(() -> getLoginRecord(token));
    }

    /**
     * 获取游戏服务器信息
     */
    public Map<String, Object> getGameServerInfo() {
        // 检查WebSocket连接状态
        if (!webSocketClient.isConnected()) {
            log.warn("WebSocket未连接到中心服务器，无法获取游戏服信息");
            return Map.of("success", false, "message", "登录服务器未连接到中心服务器", "servers", Map.of());
        }
        try {
            log.debug("正在从中心服务器获取游戏服信息");
            String url = config.getUrl() + "/api/gameserver/list";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<?> request = new HttpEntity<>(headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, request, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.debug("游戏服信息获取成功");
                return response.getBody();
            } else {
                log.warn("游戏服信息获取失败，状态码: {}", response.getStatusCode());
                return Map.of("success", false, "message", "获取游戏服信息失败", "servers", Map.of());
            }
        } catch (Exception e) {
            log.error("获取游戏服信息异常: {}", e.getMessage(), e);
            return Map.of("success", false, "message", "获取游戏服信息异常: " + e.getMessage(), "servers", Map.of());
        }
    }

    /**
     * 向中心服务器发送账号验证信息
     */
    public boolean sendAccountVerification(String userId, String token, String sessionKey) {
        try {
            log.info("正在向中心服务器发送账号验证信息: userId={}", userId);
            Map<String, Object> verificationData = Map.of("userId", userId, "token", token, "sessionKey", sessionKey, "timestamp", System.currentTimeMillis(), "serverType", "LOGIN_SERVER");
            // 优先使用WebSocket发送
            if (webSocketClient.isConnected()) {
                CentralWebSocketClient.WSMessage message = new CentralWebSocketClient.WSMessage("ACCOUNT_VERIFICATION", "Account verification from login server", verificationData);
                webSocketClient.sendMessage(message);
                log.info("通过WebSocket发送账号验证信息成功: userId={}", userId);
                return true;
            }
            // 备用HTTP方式
            String url = config.getUrl() + "/api/account/verify";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(verificationData, headers);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.POST, request, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("通过HTTP发送账号验证信息成功: userId={}", userId);
                return true;
            } else {
                log.warn("发送账号验证信息失败，状态码: {}", response.getStatusCode());
                return false;
            }
        } catch (Exception e) {
            log.error("发送账号验证信息异常: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * 获取网关分配信息
     * 先调用分配接口，再查询分配结果
     */
    public Map<String, Object> getGatewayAssignment(String userId) {
        try {
            log.debug("正在为用户分配网关: userId={}", userId);
            // 1. 先调用分配接口
            String allocateUrl = config.getUrl() + "/api/v1/gateway/allocate";
            Map<String, Object> allocateRequest = Map.of("userId", userId);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(allocateRequest, headers);
            ResponseEntity<Map<String, Object>> allocateResponse = restTemplate.exchange(allocateUrl, HttpMethod.POST, request, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (!allocateResponse.getStatusCode().is2xxSuccessful()) {
                log.warn("网关分配失败，状态码: {}", allocateResponse.getStatusCode());
                return Map.of("success", false, "message", "网关分配失败");
            }
            // 2. 再查询分配结果
            String queryUrl = config.getUrl() + "/api/v1/gateway/user/" + userId;
            HttpEntity<?> queryRequest = new HttpEntity<>(headers);
            ResponseEntity<Map<String, Object>> queryResponse = restTemplate.exchange(queryUrl, HttpMethod.GET, queryRequest, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            if (queryResponse.getStatusCode() == HttpStatus.OK && queryResponse.getBody() != null) {
                log.debug("网关分配信息获取成功: userId={}", userId);
                return queryResponse.getBody();
            } else {
                log.warn("网关分配查询失败，状态码: {}", queryResponse.getStatusCode());
                return Map.of("success", false, "message", "获取网关分配失败");
            }
        } catch (Exception e) {
            log.error("获取网关分配信息异常: {}", e.getMessage(), e);
            return Map.of("success", false, "message", "获取网关分配异常: " + e.getMessage());
        }
    }

    /**
     * 检查中心服务器连接状态
     */
    public Map<String, Object> checkConnectionStatus() {
        Map<String, Object> status = Map.of("websocket", webSocketClient.getConnectionStatus(), "http", checkHttpConnection(), "timestamp", System.currentTimeMillis());
        log.debug("中心服务器连接状态: {}", status);
        return status;
    }

    /**
     * 检查HTTP连接状态
     */
    private Map<String, Object> checkHttpConnection() {
        try {
            String url = config.getUrl() + "/api/health";
            long startTime = System.currentTimeMillis();
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(url, HttpMethod.GET, null, new ParameterizedTypeReference<Map<String, Object>>() {
            });
            long responseTime = System.currentTimeMillis() - startTime;
            return Map.of("connected", response.getStatusCode() == HttpStatus.OK, "responseTime", responseTime, "serverUrl", config.getUrl());
        } catch (Exception e) {
            return Map.of("connected", false, "error", e.getMessage(), "serverUrl", config.getUrl());
        }
    }

    @java.lang.SuppressWarnings("all")
    public CentralDataService(final CentralServerConfig config, final RestTemplate restTemplate, final ObjectMapper objectMapper, final CentralWebSocketClient webSocketClient) {
        this.config = config;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.webSocketClient = webSocketClient;
    }
}
