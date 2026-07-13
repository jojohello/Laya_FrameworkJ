package com.laya.game.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * HTTP客户端配置
 *
 * 配置RestTemplate用于与中心数据服务器通信
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Configuration
public class HttpConfig {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HttpConfig.class);
    @Value("${laya.gateway.http.connect-timeout:5000}")
    private int connectTimeout;
    @Value("${laya.gateway.http.read-timeout:10000}")
    private int readTimeout;

    /**
     * 配置RestTemplate
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);
        RestTemplate restTemplate = new RestTemplate(factory);
        log.info("RestTemplate configured: connectTimeout={}, readTimeout={}", connectTimeout, readTimeout);
        return restTemplate;
    }
}
