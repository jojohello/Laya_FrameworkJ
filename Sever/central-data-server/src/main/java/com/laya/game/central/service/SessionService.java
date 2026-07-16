package com.laya.game.central.service;

import com.laya.game.central.model.UserSession;
import com.laya.game.central.repository.UserSessionRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 会话业务服务类
 * 
 * 提供用户会话管理和三要素验证相关的业务逻辑
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Service
public class SessionService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SessionService.class);
    private final UserSessionRepository sessionRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    @Value("${jwt.secret:laya-game-jwt-secret-key-2024-very-long-and-secure}")
    private String jwtSecret;
    @Value("${jwt.expiration:3600}")
    private int jwtExpirationSeconds;
    @Value("${app.session.max-per-user:3}")
    private int maxSessionsPerUser;
    @Value("${app.session.inactive-timeout:1800}")
    private int inactiveTimeoutSeconds;
    @Value("${laya.central.service-auth.shared-secret}")
    private String serviceAuthSecret;

    /**
     * 创建新会话
     */
    @Transactional
    @CacheEvict(value = "sessions", allEntries = true)
    public UserSession createSession(String userId, String loginIp, String platform, String clientVersion, String userAgent) {
        // 检查并清理用户的旧会话
        cleanupUserOldSessions(userId);
        // 生成JWT Token
        long loginTimestamp = System.currentTimeMillis();
        String token = generateJwtToken(userId, loginTimestamp);
        String tokenHash = passwordEncoder.encode(token);
        // 创建会话对象
        UserSession session = new UserSession();
        session.setSessionId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setTokenHash(tokenHash);
        session.setLoginTimestamp(LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(loginTimestamp), java.time.ZoneId.systemDefault()));
        session.setStatus(UserSession.SessionStatus.ACTIVE);
        session.setLoginIp(loginIp);
        session.setPlatform(platform);
        session.setClientVersion(clientVersion);
        session.setUserAgent(userAgent);
        session.setLastActiveTime(LocalDateTime.now());
        session.setExpiresAt(LocalDateTime.now().plusSeconds(jwtExpirationSeconds));
        // 保存会话
        UserSession savedSession = sessionRepository.save(session);
        log.info("Created new session: sessionId={}, userId={}, platform={}", savedSession.getSessionId(), userId, platform);
        return savedSession;
    }

    /**
     * 注册由 Login Server 签发的正式登录会话。
     */
    @Transactional
    @CacheEvict(value = "sessions", allEntries = true)
    public UserSession registerExternalSession(String userId, String token, Long loginTimestamp,
                                               String loginIp, String platform,
                                               String clientVersion, String userAgent) {
        if (userId == null || loginTimestamp == null || !StringUtils.hasText(token)) {
            throw new IllegalArgumentException("Missing external session identity");
        }
        Claims claims = validateJwtToken(token);
        if (claims == null) {
            throw new IllegalArgumentException("Invalid Login Server token");
        }
        String tokenUserId = claims.get("userId", String.class);
        Long tokenTimestamp = claims.get("loginTimestamp", Long.class);
        if (!userId.equals(tokenUserId) || !loginTimestamp.equals(tokenTimestamp)) {
            throw new IllegalArgumentException("Login Server token content mismatch");
        }

        cleanupUserOldSessions(userId);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = claims.getExpiration() == null
                ? now.plusSeconds(jwtExpirationSeconds)
                : LocalDateTime.ofInstant(claims.getExpiration().toInstant(), java.time.ZoneId.systemDefault());

        UserSession session = new UserSession();
        session.setSessionId(UUID.randomUUID().toString());
        session.setUserId(userId);
        session.setTokenHash(passwordEncoder.encode(token));
        session.setLoginTimestamp(LocalDateTime.ofInstant(
                java.time.Instant.ofEpochMilli(loginTimestamp), java.time.ZoneId.systemDefault()));
        session.setStatus(UserSession.SessionStatus.ACTIVE);
        session.setLoginIp(loginIp);
        session.setPlatform(platform);
        session.setClientVersion(clientVersion);
        session.setUserAgent(userAgent);
        session.setLastActiveTime(now);
        session.setExpiresAt(expiresAt);
        session.setCreatedDate(now);
        session.setLastModifiedDate(now);
        UserSession saved = sessionRepository.save(session);
        log.info("Registered Login Server session: sessionId={}, userId={}", saved.getSessionId(), userId);
        return saved;
    }

    /**
     * 三要素验证：验证用户ID、登录时间戳、Token
     */
    @Cacheable(value = "sessions", key = "\'threefactor:\' + #userId + \':\' + #loginTimestamp + \':\' + #token")
    public Optional<UserSession> validateThreeFactors(String userId, Long loginTimestamp, String token) {
        if (userId == null || loginTimestamp == null || !StringUtils.hasText(token)) {
            log.warn("Invalid three factors validation parameters");
            return Optional.empty();
        }
        try {
            // 特殊处理系统服务认证（使用配置化的预共享密钥）
            if ("0".equals(userId) && serviceAuthSecret.equals(token)) {
                log.info("System service authentication successful");
                // 创建一个虚拟的系统会话
                UserSession systemSession = new UserSession();
                systemSession.setUserId("0");
                systemSession.setSessionId("SYSTEM_SERVICE_SESSION");
                systemSession.setTokenHash(passwordEncoder.encode(token));
                systemSession.setLoginTimestamp(LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(loginTimestamp), java.time.ZoneId.systemDefault()));
                systemSession.setExpiresAt(LocalDateTime.now().plusDays(365)); // 系统服务长期有效
                systemSession.setStatus(UserSession.SessionStatus.ACTIVE);
                return Optional.of(systemSession);
            }
            // 验证JWT Token
            Claims claims = validateJwtToken(token);
            if (claims == null) {
                log.warn("Invalid JWT token for user: {}", userId);
                return Optional.empty();
            }
            // 检查Token中的用户ID和时间戳
            String tokenUserId = claims.get("userId", String.class);
            Long tokenTimestamp = claims.get("loginTimestamp", Long.class);
            if (!userId.equals(tokenUserId) || !loginTimestamp.equals(tokenTimestamp)) {
                log.warn("Token content mismatch for user: {}", userId);
                return Optional.empty();
            }
            // 将时间戳转换为LocalDateTime
            LocalDateTime loginDateTime = LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(loginTimestamp), java.time.ZoneId.systemDefault());
            // 查找该用户的所有活跃会话
            List<UserSession> activeSessions = sessionRepository.findByUserIdAndStatus(userId, UserSession.SessionStatus.ACTIVE);
            // 遍历会话，使用BCrypt的matches方法验证Token
            for (UserSession session : activeSessions) {
                // 检查登录时间戳是否匹配
                if (!session.getLoginTimestamp().equals(loginDateTime)) {
                    continue;
                }
                // 使用BCrypt的matches方法验证Token哈希
                if (passwordEncoder.matches(token, session.getTokenHash())) {
                    // 检查会话是否过期
                    if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
                        log.warn("Session expired: sessionId={}", session.getSessionId());
                        expireSession(session.getSessionId());
                        return Optional.empty();
                    }
                    // 更新最后活跃时间
                    updateLastActiveTime(session.getSessionId());
                    log.debug("Three factors validation successful: userId={}, sessionId={}", userId, session.getSessionId());
                    return Optional.of(session);
                }
            }
            log.warn("No matching session found for user: {}", userId);
        } catch (Exception e) {
            log.error("Error during three factors validation for user: {}", userId, e);
        }
        return Optional.empty();
    }

    /**
     * 根据Token查找会话
     */
    @Cacheable(value = "sessions", key = "\'token:\' + #token")
    public Optional<UserSession> findByToken(String token) {
        if (!StringUtils.hasText(token)) {
            return Optional.empty();
        }
        try {
            // 验证JWT Token
            Claims claims = validateJwtToken(token);
            if (claims == null) {
                return Optional.empty();
            }
            // 从Token中提取信息
            String userId = claims.get("userId", String.class);
            Long loginTimestamp = claims.get("loginTimestamp", Long.class);
            return validateThreeFactors(userId, loginTimestamp, token);
        } catch (Exception e) {
            log.error("Error finding session by token", e);
            return Optional.empty();
        }
    }

    /**
     * 获取用户的活跃会话
     */
    public List<UserSession> getUserActiveSessions(String userId) {
        return sessionRepository.findByUserIdAndStatus(userId, UserSession.SessionStatus.ACTIVE);
    }

    /**
     * 更新会话最后活跃时间
     */
    @Transactional
    @CacheEvict(value = "sessions", allEntries = true)
    public void updateLastActiveTime(String sessionId) {
        sessionRepository.updateLastActiveTime(sessionId, LocalDateTime.now());
    }

    /**
     * 续期会话
     */
    @Transactional
    @CacheEvict(value = "sessions", allEntries = true)
    public boolean renewSession(String sessionId) {
        Optional<UserSession> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) {
            return false;
        }
        UserSession session = sessionOpt.get();
        if (session.getStatus() != UserSession.SessionStatus.ACTIVE) {
            return false;
        }
        // 延长过期时间
        session.setExpiresAt(LocalDateTime.now().plusSeconds(jwtExpirationSeconds));
        session.setLastActiveTime(LocalDateTime.now());
        sessionRepository.save(session);
        log.debug("Renewed session: sessionId={}", sessionId);
        return true;
    }

    /**
     * 使会话过期
     */
    @Transactional
    @CacheEvict(value = "sessions", allEntries = true)
    public void expireSession(String sessionId) {
        Optional<UserSession> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            session.setStatus(UserSession.SessionStatus.EXPIRED);
            sessionRepository.save(session);
            log.info("Expired session: sessionId={}, userId={}", sessionId, session.getUserId());
        }
    }

    /**
     * 强制下线用户的所有会话
     */
    @Transactional
    @CacheEvict(value = "sessions", allEntries = true)
    public void forceOfflineUser(String userId, String reason) {
        sessionRepository.forceOfflineUserSessions(userId, UserSession.SessionStatus.ACTIVE, UserSession.SessionStatus.FORCE_LOGOUT, reason);
        log.info("Force offline user: userId={}, reason={}", userId, reason);
    }

    /**
     * 获取会话统计信息
     */
    public SessionStatistics getSessionStatistics() {
        long activeSessions = sessionRepository.countByStatus(UserSession.SessionStatus.ACTIVE);
        long expiredSessions = sessionRepository.countByStatus(UserSession.SessionStatus.EXPIRED);
        long offlineSessions = sessionRepository.countByStatus(UserSession.SessionStatus.FORCE_LOGOUT);
        return new SessionStatistics(activeSessions, expiredSessions, offlineSessions);
    }

    // 每5分钟执行一次
    /**
     * 定时清理过期会话
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cleanupExpiredSessions() {
        LocalDateTime now = LocalDateTime.now();
        // 清理过期会话
        List<UserSession> expiredSessions = sessionRepository.findExpiredSessions(now, UserSession.SessionStatus.ACTIVE);
        if (!expiredSessions.isEmpty()) {
            List<String> sessionIds = expiredSessions.stream().map(UserSession::getSessionId).toList();
            sessionRepository.updateStatusBatch(sessionIds, UserSession.SessionStatus.EXPIRED);
            log.info("Cleaned up {} expired sessions", expiredSessions.size());
        }
        // 清理长时间未活跃的会话
        LocalDateTime inactiveCutoff = now.minusSeconds(inactiveTimeoutSeconds);
        List<UserSession> inactiveSessions = sessionRepository.findInactiveSessions(inactiveCutoff, UserSession.SessionStatus.ACTIVE);
        if (!inactiveSessions.isEmpty()) {
            List<String> sessionIds = inactiveSessions.stream().map(UserSession::getSessionId).toList();
            sessionRepository.updateStatusBatch(sessionIds, UserSession.SessionStatus.EXPIRED);
            log.info("Cleaned up {} inactive sessions", inactiveSessions.size());
        }
        // 删除历史记录
        LocalDateTime cleanupCutoff = now.minusDays(7);
        sessionRepository.cleanupExpiredSessions(cleanupCutoff, Arrays.asList(UserSession.SessionStatus.EXPIRED, UserSession.SessionStatus.LOGOUT));
    }

    /**
     * 生成JWT Token
     */
    private String generateJwtToken(String userId, Long loginTimestamp) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationSeconds * 1000L);
        return Jwts.builder().setSubject(userId).claim("userId", userId).claim("loginTimestamp", loginTimestamp).setIssuedAt(new Date()).setExpiration(expiryDate).signWith(key, SignatureAlgorithm.HS256).compact();
    }

    /**
     * 验证JWT Token
     */
    private Claims validateJwtToken(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
        } catch (Exception e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 清理用户的旧会话
     */
    private void cleanupUserOldSessions(String userId) {
        List<UserSession> activeSessions = sessionRepository.findByUserIdAndStatus(userId, UserSession.SessionStatus.ACTIVE);
        if (activeSessions.size() >= maxSessionsPerUser) {
            // 按创建时间排序，保留最新的几个会话
            activeSessions.sort(Comparator.comparing(UserSession::getCreatedDate).reversed());
            List<UserSession> sessionsToExpire = activeSessions.subList(maxSessionsPerUser - 1, activeSessions.size());
            List<String> sessionIds = sessionsToExpire.stream().map(UserSession::getSessionId).collect(Collectors.toList());
            sessionRepository.updateStatusBatch(sessionIds, UserSession.SessionStatus.EXPIRED);
            log.info("Cleaned up {} old sessions for user: {}", sessionIds.size(), userId);
        }
    }


    /**
     * 会话统计信息类
     */
    public static class SessionStatistics {
        private final long activeSessions;
        private final long expiredSessions;
        private final long offlineSessions;

        public SessionStatistics(long activeSessions, long expiredSessions, long offlineSessions) {
            this.activeSessions = activeSessions;
            this.expiredSessions = expiredSessions;
            this.offlineSessions = offlineSessions;
        }

        // Getters
        public long getActiveSessions() {
            return activeSessions;
        }

        public long getExpiredSessions() {
            return expiredSessions;
        }

        public long getOfflineSessions() {
            return offlineSessions;
        }

        public long getTotalSessions() {
            return activeSessions + expiredSessions + offlineSessions;
        }
    }

    @java.lang.SuppressWarnings("all")
    public SessionService(final UserSessionRepository sessionRepository, final BCryptPasswordEncoder passwordEncoder) {
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
    }
}
