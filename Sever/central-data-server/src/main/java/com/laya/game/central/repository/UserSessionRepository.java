package com.laya.game.central.repository;

import com.laya.game.central.model.UserSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.ArrayList;

/**
 * 用户会话数据访问层
 * 
 * 提供用户会话相关的Redis操作，支持三要素验证
 * 
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
@Repository
public class UserSessionRepository {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String SESSION_KEY_PREFIX = "session:";
    private static final String USER_SESSIONS_KEY_PREFIX = "user_sessions:";
    private static final String TOKEN_HASH_KEY_PREFIX = "token_hash:";
    private static final long DEFAULT_TIMEOUT = 24; // 24小时

    /**
     * 保存会话
     */
    public UserSession save(UserSession session) {
        String sessionKey = SESSION_KEY_PREFIX + session.getSessionId();
        String userSessionsKey = USER_SESSIONS_KEY_PREFIX + session.getUserId();
        String tokenHashKey = TOKEN_HASH_KEY_PREFIX + session.getTokenHash();
        
        // 保存会话对象
        redisTemplate.opsForValue().set(sessionKey, session, DEFAULT_TIMEOUT, TimeUnit.HOURS);
        
        // 添加到用户会话集合
        redisTemplate.opsForSet().add(userSessionsKey, session.getSessionId());
        redisTemplate.expire(userSessionsKey, DEFAULT_TIMEOUT, TimeUnit.HOURS);
        
        // 建立token hash到session id的映射
        redisTemplate.opsForValue().set(tokenHashKey, session.getSessionId(), DEFAULT_TIMEOUT, TimeUnit.HOURS);
        
        return session;
    }

    /**
     * 根据会话ID查找会话
     */
    public Optional<UserSession> findById(String sessionId) {
        String sessionKey = SESSION_KEY_PREFIX + sessionId;
        UserSession session = (UserSession) redisTemplate.opsForValue().get(sessionKey);
        return Optional.ofNullable(session);
    }

    /**
     * 根据用户ID查找活跃会话
     */
    public List<UserSession> findByUserIdAndStatus(String userId, UserSession.SessionStatus status) {
        String userSessionsKey = USER_SESSIONS_KEY_PREFIX + userId;
        Set<Object> sessionIds = redisTemplate.opsForSet().members(userSessionsKey);
        
        if (sessionIds == null || sessionIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return sessionIds.stream()
                .map(sessionId -> findById((String) sessionId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(session -> session.getStatus() == status)
                .collect(Collectors.toList());
    }

    /**
     * 根据Token哈希查找会话
     */
    public Optional<UserSession> findByTokenHash(String tokenHash) {
        String tokenHashKey = TOKEN_HASH_KEY_PREFIX + tokenHash;
        String sessionId = (String) redisTemplate.opsForValue().get(tokenHashKey);
        
        if (sessionId == null) {
            return Optional.empty();
        }
        
        return findById(sessionId);
    }

    /**
     * 根据用户ID和Token哈希查找会话（三要素验证的一部分）
     */
    public Optional<UserSession> findByUserIdAndTokenHash(String userId, String tokenHash) {
        Optional<UserSession> sessionOpt = findByTokenHash(tokenHash);
        
        if (sessionOpt.isPresent() && sessionOpt.get().getUserId().equals(userId)) {
            return sessionOpt;
        }
        
        return Optional.empty();
    }

    /**
     * 三要素验证：根据用户ID、登录时间戳、Token哈希查找会话
     */
    public Optional<UserSession> findByThreeFactors(
            String userId,
            LocalDateTime loginTimestamp,
            String tokenHash,
            UserSession.SessionStatus status
    ) {
        Optional<UserSession> sessionOpt = findByUserIdAndTokenHash(userId, tokenHash);
        
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            if (session.getLoginTimestamp().equals(loginTimestamp) && session.getStatus() == status) {
                return sessionOpt;
            }
        }
        
        return Optional.empty();
    }

    /**
     * 查找用户的所有会话
     */
    public List<UserSession> findByUserIdOrderByCreatedTimeDesc(String userId) {
        String userSessionsKey = USER_SESSIONS_KEY_PREFIX + userId;
        Set<Object> sessionIds = redisTemplate.opsForSet().members(userSessionsKey);
        
        if (sessionIds == null || sessionIds.isEmpty()) {
            return new ArrayList<>();
        }
        
        return sessionIds.stream()
                .map(sessionId -> findById((String) sessionId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .sorted((s1, s2) -> s2.getCreatedTime().compareTo(s1.getCreatedTime()))
                .collect(Collectors.toList());
    }

    /**
     * 删除会话
     */
    public void delete(UserSession session) {
        String sessionKey = SESSION_KEY_PREFIX + session.getSessionId();
        String userSessionsKey = USER_SESSIONS_KEY_PREFIX + session.getUserId();
        String tokenHashKey = TOKEN_HASH_KEY_PREFIX + session.getTokenHash();
        
        redisTemplate.delete(sessionKey);
        redisTemplate.opsForSet().remove(userSessionsKey, session.getSessionId());
        redisTemplate.delete(tokenHashKey);
    }

    /**
     * 根据会话ID删除
     */
    public void deleteById(String sessionId) {
        Optional<UserSession> sessionOpt = findById(sessionId);
        if (sessionOpt.isPresent()) {
            delete(sessionOpt.get());
        }
    }

    /**
     * 检查会话是否存在
     */
    public boolean existsById(String sessionId) {
        String sessionKey = SESSION_KEY_PREFIX + sessionId;
        return Boolean.TRUE.equals(redisTemplate.hasKey(sessionKey));
    }

    /**
     * 批量更新会话状态
     */
    public void updateStatusBatch(List<String> sessionIds, UserSession.SessionStatus status) {
        for (String sessionId : sessionIds) {
            Optional<UserSession> sessionOpt = findById(sessionId);
            if (sessionOpt.isPresent()) {
                UserSession session = sessionOpt.get();
                session.setStatus(status);
                save(session);
            }
        }
    }

    /**
     * 清理过期会话
     */
    public List<UserSession> cleanupExpiredSessions(LocalDateTime cutoffTime, List<UserSession.SessionStatus> statuses) {
        List<UserSession> expiredSessions = new ArrayList<>();
        
        // 这里需要遍历所有会话来查找过期的
        // 由于Redis没有直接的方式来查询所有会话，我们需要维护一个全局会话集合
        // 或者通过其他方式来实现
        
        return expiredSessions;
    }

    /**
     * 查找过期会话
     */
    public List<UserSession> findExpiredSessions(LocalDateTime cutoffTime, UserSession.SessionStatus status) {
        List<UserSession> expiredSessions = new ArrayList<>();
        
        // 这里需要遍历所有会话来查找过期的
        // 由于Redis没有直接的方式来查询所有会话，我们需要维护一个全局会话集合
        // 或者通过其他方式来实现
        
        return expiredSessions;
    }

    /**
     * 查找不活跃会话
     */
    public List<UserSession> findInactiveSessions(LocalDateTime cutoffTime, UserSession.SessionStatus status) {
        List<UserSession> inactiveSessions = new ArrayList<>();
        
        // 这里需要遍历所有会话来查找不活跃的
        // 由于Redis没有直接的方式来查询所有会话，我们需要维护一个全局会话集合
        // 或者通过其他方式来实现
        
        return inactiveSessions;
    }

    /**
     * 根据状态统计会话数量
     */
    public long countByStatus(UserSession.SessionStatus status) {
        // 这里需要遍历所有会话来统计指定状态的数量
        // 由于Redis没有直接的方式来查询所有会话，我们需要维护一个全局会话集合
        // 或者通过其他方式来实现
        return 0;
    }

    /**
     * 更新会话最后活跃时间
     */
    public void updateLastActiveTime(String sessionId, LocalDateTime lastActiveTime) {
        Optional<UserSession> sessionOpt = findById(sessionId);
        if (sessionOpt.isPresent()) {
            UserSession session = sessionOpt.get();
            session.setLastActiveTime(lastActiveTime);
            save(session);
        }
    }

    /**
     * 强制用户会话下线
     */
    public void forceOfflineUserSessions(String userId, UserSession.SessionStatus fromStatus, UserSession.SessionStatus toStatus, String reason) {
        List<UserSession> sessions = findByUserIdAndStatus(userId, fromStatus);
        for (UserSession session : sessions) {
            session.setStatus(toStatus);
            // 这里可以设置下线原因，如果UserSession模型有相关字段的话
            save(session);
        }
    }

    /**
     * 清理旧记录
     */
    public void cleanupOldRecords(LocalDateTime cutoffTime) {
        // 这里需要遍历所有会话来清理旧记录
        // 由于Redis没有直接的方式来查询所有会话，我们需要维护一个全局会话集合
        // 或者通过其他方式来实现
    }
}
