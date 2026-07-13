package com.laya.game.central.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Spring Security配置类
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF保护
            .csrf(AbstractHttpConfigurer::disable)
            // 禁用CORS
            .cors(AbstractHttpConfigurer::disable)
            // 配置授权规则
            .authorizeHttpRequests(auth -> auth
                // 允许所有请求（开发阶段，后续可以根据需要调整）
                .anyRequest().permitAll())
            // 禁用session管理（使用JWT）
            .sessionManagement(AbstractHttpConfigurer::disable)
            // 禁用HTTP Basic认证
            .httpBasic(AbstractHttpConfigurer::disable)
            // 禁用表单登录
            .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }

    /**
     * 密码编码器
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    /**
     * BCrypt密码编码器
     */
    @Bean
    public BCryptPasswordEncoder bCryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
