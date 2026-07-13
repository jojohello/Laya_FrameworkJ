package com.jojohello_laya.login.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate配置类
 * 
 * @author laya-game
 */
@Configuration
public class RestTemplateConfig {
    private final CentralServerConfig centralServerConfig;

    /**
     * 配置RestTemplate Bean
     */
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.setRequestFactory(clientHttpRequestFactory());
        return restTemplate;
    }

    /**
     * 配置HTTP请求工厂
     */
    @Bean
    public ClientHttpRequestFactory clientHttpRequestFactory() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // 设置连接超时时间
        factory.setConnectTimeout((int) centralServerConfig.getConnectionTimeout());
        // 设置读取超时时间
        factory.setReadTimeout((int) centralServerConfig.getTimeout());
        return factory;
    }

    @java.lang.SuppressWarnings("all")
    public RestTemplateConfig(final CentralServerConfig centralServerConfig) {
        this.centralServerConfig = centralServerConfig;
    }
}
