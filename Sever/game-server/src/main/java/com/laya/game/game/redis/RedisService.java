package com.laya.game.game.redis;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Redis 基础服务
 * 封装常用的 Redis 操作
 *
 * @author Laya Game Server
 * @since 2025-10-29
 */
@Service
public class RedisService {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RedisService.class);
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // ==================== String 操作 ====================
    /**
     * 设置键值
     *
     * @param key 键
     * @param value 值
     */
    public void set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
        } catch (Exception e) {
            log.error("Redis set 操作失败: key={}", key, e);
            throw e;
        }
    }

    /**
     * 设置键值（带过期时间）
     *
     * @param key 键
     * @param value 值
     * @param timeout 过期时间
     * @param unit 时间单位
     */
    public void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            redisTemplate.opsForValue().set(key, value, timeout, unit);
        } catch (Exception e) {
            log.error("Redis set 操作失败: key={}, timeout={}", key, timeout, e);
            throw e;
        }
    }

    /**
     * 获取键值
     *
     * @param key 键
     * @param clazz 值的类型
     * @return 值，如果不存在返回null
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            return value != null ? (T) value : null;
        } catch (Exception e) {
            log.error("Redis get 操作失败: key={}", key, e);
            return null;
        }
    }

    /**
     * 获取字符串值
     *
     * @param key 键
     * @return 字符串值
     */
    public String getString(String key) {
        return get(key, String.class);
    }

    /**
     * 删除键
     *
     * @param key 键
     * @return 是否删除成功
     */
    public boolean delete(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.delete(key));
        } catch (Exception e) {
            log.error("Redis delete 操作失败: key={}", key, e);
            return false;
        }
    }

    /**
     * 判断键是否存在
     *
     * @param key 键
     * @return 是否存在
     */
    public boolean exists(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.error("Redis exists 操作失败: key={}", key, e);
            return false;
        }
    }

    // ==================== Hash 操作 ====================
    /**
     * 设置 Hash 字段值
     *
     * @param key 键
     * @param field 字段
     * @param value 值
     */
    public void hSet(String key, String field, Object value) {
        try {
            redisTemplate.opsForHash().put(key, field, value);
        } catch (Exception e) {
            log.error("Redis hSet 操作失败: key={}, field={}", key, field, e);
            throw e;
        }
    }

    /**
     * 获取 Hash 字段值
     *
     * @param key 键
     * @param field 字段
     * @param clazz 值的类型
     * @return 值，如果不存在返回null
     */
    @SuppressWarnings("unchecked")
    public <T> T hGet(String key, String field, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForHash().get(key, field);
            return value != null ? (T) value : null;
        } catch (Exception e) {
            log.error("Redis hGet 操作失败: key={}, field={}", key, field, e);
            return null;
        }
    }

    /**
     * 获取 Hash 所有字段
     *
     * @param key 键
     * @return 所有字段的Map
     */
    public Map<Object, Object> hGetAll(String key) {
        try {
            return redisTemplate.opsForHash().entries(key);
        } catch (Exception e) {
            log.error("Redis hGetAll 操作失败: key={}", key, e);
            return Map.of();
        }
    }

    /**
     * 删除 Hash 字段
     *
     * @param key 键
     * @param fields 字段列表
     * @return 删除的字段数量
     */
    public long hDelete(String key, String... fields) {
        try {
            return redisTemplate.opsForHash().delete(key, (Object[]) fields);
        } catch (Exception e) {
            log.error("Redis hDelete 操作失败: key={}, fields={}", key, fields, e);
            return 0;
        }
    }

    /**
     * 判断 Hash 字段是否存在
     *
     * @param key 键
     * @param field 字段
     * @return 是否存在
     */
    public boolean hExists(String key, String field) {
        try {
            return redisTemplate.opsForHash().hasKey(key, field);
        } catch (Exception e) {
            log.error("Redis hExists 操作失败: key={}, field={}", key, field, e);
            return false;
        }
    }

    // ==================== Set 操作 ====================
    /**
     * 添加元素到 Set
     *
     * @param key 键
     * @param values 值列表
     * @return 添加的元素数量
     */
    public long sAdd(String key, Object... values) {
        try {
            Long count = redisTemplate.opsForSet().add(key, values);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Redis sAdd 操作失败: key={}", key, e);
            return 0;
        }
    }

    /**
     * 获取 Set 所有成员
     *
     * @param key 键
     * @return 所有成员
     */
    public Set<Object> sMembers(String key) {
        try {
            return redisTemplate.opsForSet().members(key);
        } catch (Exception e) {
            log.error("Redis sMembers 操作失败: key={}", key, e);
            return Set.of();
        }
    }

    /**
     * 从 Set 移除元素
     *
     * @param key 键
     * @param values 值列表
     * @return 移除的元素数量
     */
    public long sRemove(String key, Object... values) {
        try {
            Long count = redisTemplate.opsForSet().remove(key, values);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Redis sRemove 操作失败: key={}", key, e);
            return 0;
        }
    }

    /**
     * 判断元素是否在 Set 中
     *
     * @param key 键
     * @param value 值
     * @return 是否存在
     */
    public boolean sIsMember(String key, Object value) {
        try {
            return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, value));
        } catch (Exception e) {
            log.error("Redis sIsMember 操作失败: key={}, value={}", key, value, e);
            return false;
        }
    }

    /**
     * 获取 Set 大小
     *
     * @param key 键
     * @return Set大小
     */
    public long sSize(String key) {
        try {
            Long size = redisTemplate.opsForSet().size(key);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("Redis sSize 操作失败: key={}", key, e);
            return 0;
        }
    }

    // ==================== 过期时间操作 ====================
    /**
     * 设置键的过期时间
     *
     * @param key 键
     * @param timeout 过期时间
     * @param unit 时间单位
     * @return 是否设置成功
     */
    public boolean expire(String key, long timeout, TimeUnit unit) {
        try {
            return Boolean.TRUE.equals(redisTemplate.expire(key, timeout, unit));
        } catch (Exception e) {
            log.error("Redis expire 操作失败: key={}, timeout={}", key, timeout, e);
            return false;
        }
    }

    /**
     * 获取键的过期时间
     *
     * @param key 键
     * @param unit 时间单位
     * @return 过期时间，-1表示永不过期，-2表示键不存在
     */
    public Long getExpire(String key, TimeUnit unit) {
        try {
            return redisTemplate.getExpire(key, unit);
        } catch (Exception e) {
            log.error("Redis getExpire 操作失败: key={}", key, e);
            return -2L;
        }
    }

    /**
     * 获取键的过期时间（秒）
     *
     * @param key 键
     * @return 过期时间（秒）
     */
    public Long getExpire(String key) {
        return getExpire(key, TimeUnit.SECONDS);
    }

    // ==================== 批量操作 ====================
    /**
     * 批量删除键
     *
     * @param keys 键列表
     * @return 删除的键数量
     */
    public long deleteMultiple(String... keys) {
        try {
            Long count = redisTemplate.delete(Set.of(keys));
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Redis deleteMultiple 操作失败", e);
            return 0;
        }
    }
}
