package com.laya.game.central.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate配置
 *
 * 用于Central Server向Gateway发送HTTP通知
 *
 * @author Laya Game Server Framework
 * @since 2025-11-10
 */
@Configuration
public class RestTemplateConfig {

    /**
     * 创建RestTemplate Bean
     *
     * @return RestTemplate实例
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);  // 连接超时3秒
        factory.setReadTimeout(5000);     // 读取超时5秒
        return new RestTemplate(factory);
    }
}
