package com.laya.game.central.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Redis配置类
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Configuration
public class RedisConfig {

    /**
     * 配置RedisTemplate Bean
     *
     * @param connectionFactory Redis连接工厂
     * @return RedisTemplate实例
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // 创建支持Java 8时间类型的ObjectMapper
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        // 配置多态类型验证器，允许反序列化我们的模型类
        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
            .allowIfBaseType(Object.class)
            .build();
        objectMapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL);

        // 使用配置好的ObjectMapper创建序列化器
        GenericJackson2JsonRedisSerializer jackson2JsonRedisSerializer =
            new GenericJackson2JsonRedisSerializer(objectMapper);

        // 使用StringRedisSerializer来序列化和反序列化redis的key值
        template.setKeySerializer(new StringRedisSerializer());
        // 使用配置好的Jackson序列化器来序列化和反序列化redis的value值
        template.setValueSerializer(jackson2JsonRedisSerializer);

        // Hash的key也采用StringRedisSerializer的序列化方式
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jackson2JsonRedisSerializer);

        template.afterPropertiesSet();
        return template;
    }
    
    /**
     * 配置BCryptPasswordEncoder Bean
     * 
     * @return BCryptPasswordEncoder实例
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
