package com.laya.game.game.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 雪花算法ID生成器
 * 生成64位长整型唯一ID
 *
 * ID结构：
 * 1 bit（���使用） + 41 bit（时间戳） + 10 bit（机器ID） + 12 bit（序列号）
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
public class IdGenerator {

    private static final Logger logger = LoggerFactory.getLogger(IdGenerator.class);

    // ==================== 常量定义 ====================

    /** 起始时间戳 (2024-01-01 00:00:00) */
    private static final long START_TIMESTAMP = 1704067200000L;

    /** 机器ID所占位数 */
    private static final long WORKER_ID_BITS = 10L;

    /** 序列号所占位数 */
    private static final long SEQUENCE_BITS = 12L;

    /** 最大机器ID (1023) */
    private static final long MAX_WORKER_ID = ~(-1L << WORKER_ID_BITS);

    /** 最大序列号 (4095) */
    private static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BITS);

    /** 机器ID左移位数 */
    private static final long WORKER_ID_SHIFT = SEQUENCE_BITS;

    /** 时间戳左移位数 */
    private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + WORKER_ID_BITS;

    // ==================== 实例变量 ====================

    /** 机器ID (0-1023) */
    private final long workerId;

    /** 上次生成ID的时间戳 */
    private long lastTimestamp = -1L;

    /** 当前序列号 */
    private long sequence = 0L;

    // ==================== 单例模式 ====================

    private static volatile IdGenerator instance;

    /**
     * 私有构造函数
     *
     * @param workerId 机器ID (0-1023)
     */
    private IdGenerator(long workerId) {
        if (workerId < 0 || workerId > MAX_WORKER_ID) {
            throw new IllegalArgumentException(
                String.format("Worker ID must be between 0 and %d", MAX_WORKER_ID)
            );
        }
        this.workerId = workerId;
        logger.info("IdGenerator initialized with workerId: {}", workerId);
    }

    /**
     * 获取单例实例（使用默认workerId=0）
     *
     * @return IdGenerator实例
     */
    public static IdGenerator getInstance() {
        return getInstance(0L);
    }

    /**
     * 获取单例实例
     *
     * @param workerId 机器ID
     * @return IdGenerator实例
     */
    public static IdGenerator getInstance(long workerId) {
        if (instance == null) {
            synchronized (IdGenerator.class) {
                if (instance == null) {
                    instance = new IdGenerator(workerId);
                }
            }
        }
        return instance;
    }

    // ==================== 核心方法 ====================

    /**
     * 生成下一个唯一ID（线程安全）
     *
     * @return 64位长整型ID
     */
    public synchronized long nextId() {
        long timestamp = getCurrentTimestamp();

        // 时钟回拨检测
        if (timestamp < lastTimestamp) {
            long offset = lastTimestamp - timestamp;
            logger.error("Clock moved backwards by {} milliseconds. Refusing to generate ID.", offset);
            throw new RuntimeException(
                String.format("Clock moved backwards. Refusing to generate ID for %d milliseconds", offset)
            );
        }

        // 同一毫秒内，序列号递增
        if (timestamp == lastTimestamp) {
            sequence = (sequence + 1) & MAX_SEQUENCE;

            // 序列号溢出，等待下一毫秒
            if (sequence == 0) {
                timestamp = waitNextMillis(lastTimestamp);
            }
        } else {
            // 不同毫秒，序列号重置
            sequence = 0L;
        }

        lastTimestamp = timestamp;

        // 组装ID：时间戳 + 机器ID + 序列号
        return ((timestamp - START_TIMESTAMP) << TIMESTAMP_SHIFT)
               | (workerId << WORKER_ID_SHIFT)
               | sequence;
    }

    /**
     * 生成字符串格式的ID
     *
     * @return 字符串ID
     */
    public String nextIdString() {
        return String.valueOf(nextId());
    }

    /**
     * 批量生成ID
     *
     * @param count 生成数量
     * @return ID数组
     */
    public long[] nextIds(int count) {
        if (count <= 0) {
            throw new IllegalArgumentException("Count must be positive");
        }

        long[] ids = new long[count];
        for (int i = 0; i < count; i++) {
            ids[i] = nextId();
        }
        return ids;
    }

    // ==================== 辅助方法 ====================

    /**
     * 获取当前时间戳（毫秒）
     *
     * @return 当前时间戳
     */
    private long getCurrentTimestamp() {
        return System.currentTimeMillis();
    }

    /**
     * ���待下一毫秒
     *
     * @param lastTimestamp 上次时间戳
     * @return 下一毫秒的时间戳
     */
    private long waitNextMillis(long lastTimestamp) {
        long timestamp = getCurrentTimestamp();
        while (timestamp <= lastTimestamp) {
            timestamp = getCurrentTimestamp();
        }
        return timestamp;
    }

    // ==================== ID解析方法 ====================

    /**
     * 从ID中解析时间戳
     *
     * @param id 雪花ID
     * @return 时间戳（毫秒）
     */
    public static long parseTimestamp(long id) {
        return (id >> TIMESTAMP_SHIFT) + START_TIMESTAMP;
    }

    /**
     * 从ID中解析机器ID
     *
     * @param id 雪花ID
     * @return 机器ID
     */
    public static long parseWorkerId(long id) {
        return (id >> WORKER_ID_SHIFT) & MAX_WORKER_ID;
    }

    /**
     * 从ID中解析序列号
     *
     * @param id 雪花ID
     * @return 序列号
     */
    public static long parseSequence(long id) {
        return id & MAX_SEQUENCE;
    }

    /**
     * 解析ID详细信息
     *
     * @param id 雪花ID
     * @return 格式化字符串
     */
    public static String parseIdInfo(long id) {
        long timestamp = parseTimestamp(id);
        long workerId = parseWorkerId(id);
        long sequence = parseSequence(id);

        return String.format(
            "ID: %d | Timestamp: %d | WorkerId: %d | Sequence: %d",
            id, timestamp, workerId, sequence
        );
    }

    // ==================== Getter方法 ====================

    public long getWorkerId() {
        return workerId;
    }

    public long getLastTimestamp() {
        return lastTimestamp;
    }

    public long getCurrentSequence() {
        return sequence;
    }
}
