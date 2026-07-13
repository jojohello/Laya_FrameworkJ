package com.laya.game.game.redis;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis 配置类
 * 配置 RedisTemplate 和序列化方式
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
@Configuration
public class RedisConfig {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RedisConfig.class);

    /**
     * 配置 RedisTemplate
     * 使用 GenericJackson2JsonRedisSerializer 进行序列化
     *
     * @param factory Redis连接工厂
     * @return RedisTemplate实例
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        log.info("初始化 RedisTemplate...");
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        // 配置 Jackson 序列化器
        GenericJackson2JsonRedisSerializer jacksonSerializer = createJacksonSerializer();
        // String 序列化器
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        // Key 使用 String 序列化
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        // Value 使用 JSON 序列化
        template.setValueSerializer(jacksonSerializer);
        template.setHashValueSerializer(jacksonSerializer);
        template.afterPropertiesSet();
        log.info("[OK] RedisTemplate 初始化完成");
        return template;
    }

    /**
     * 创建 Jackson 序列化器
     */
    private GenericJackson2JsonRedisSerializer createJacksonSerializer() {
        // 配置 ObjectMapper
        ObjectMapper objectMapper = new ObjectMapper();
        // 设置所有字段可见
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        // 启用默认类型
        objectMapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);
        return new GenericJackson2JsonRedisSerializer(objectMapper);
    }
}
