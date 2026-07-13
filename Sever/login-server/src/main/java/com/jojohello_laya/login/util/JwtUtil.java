package com.jojohello_laya.login.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * JWT工具类
 * 
 * @author laya-game
 */
@Component
public class JwtUtil {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JwtUtil.class);
    @Value("${jwt.secret}")
    private String secret;
    @Value("${jwt.expiration}")
    private long expiration;
    @Value("${jwt.issuer}")
    private String issuer;

    /**
     * 生成JWT Token
     * 
     * @param userId 用户ID
     * @param loginTimestamp 登录时间戳
     * @return JWT Token
     */
    public String generateToken(String userId, long loginTimestamp) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            Map<String, Object> claims = new HashMap<>();
            claims.put("userId", userId);
            claims.put("loginTimestamp", loginTimestamp);
            return Jwts.builder().setClaims(claims).setIssuer(issuer).setIssuedAt(new Date()).setExpiration(new Date(System.currentTimeMillis() + expiration * 1000)).signWith(key, SignatureAlgorithm.HS256).compact();
        } catch (Exception e) {
            log.error("生成JWT Token失败", e);
            throw new RuntimeException("Token生成失败", e);
        }
    }

    /**
     * 验证JWT Token
     * 
     * @param token JWT Token
     * @return 验证结果
     */
    public boolean validateToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT Token验证失败: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 从Token中获取用户ID
     * 
     * @param token JWT Token
     * @return 用户ID
     */
    public String getUserIdFromToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
            return claims.get("userId", String.class);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("从Token获取用户ID失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 从Token中获取登录时间戳
     * 
     * @param token JWT Token
     * @return 登录时间戳
     */
    public Long getLoginTimestampFromToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
            return claims.get("loginTimestamp", Long.class);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("从Token获取登录时间戳失败: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 检查Token是否过期
     * 
     * @param token JWT Token
     * @return true if expired, false otherwise
     */
    public boolean isTokenExpired(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            Claims claims = Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
            return claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("检查Token过期失败: {}", e.getMessage());
            return true;
        }
    }
}
