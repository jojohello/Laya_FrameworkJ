package com.laya.game.game.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate配置
 *
 * 用于Game Server向Central Server发送HTTP请求
 * （心跳、注销等）
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
        factory.setConnectTimeout(5000);  // 连接超时5秒
        factory.setReadTimeout(10000);    // 读取超时10秒
        return new RestTemplate(factory);
    }
}
