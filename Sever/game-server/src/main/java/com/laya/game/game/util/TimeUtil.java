package com.laya.game.game.util;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * 时间工具类
 * 提供时间格式化、转换、计算等功能
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
public class TimeUtil {

    // ==================== 常用时间格式 ====================

    /** 标准日期时间格式：yyyy-MM-dd HH:mm:ss */
    public static final DateTimeFormatter STANDARD_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /** 日期格式：yyyy-MM-dd */
    public static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /** 时间格式：HH:mm:ss */
    public static final DateTimeFormatter TIME_FORMATTER =
        DateTimeFormatter.ofPattern("HH:mm:ss");

    /** 紧凑格式：yyyyMMddHHmmss */
    public static final DateTimeFormatter COMPACT_FORMATTER =
        DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    /** ISO格式：yyyy-MM-dd'T'HH:mm:ss */
    public static final DateTimeFormatter ISO_FORMATTER =
        DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    /** 默认时区：Asia/Shanghai */
    public static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Shanghai");

    // ==================== 时间获取 ====================

    /**
     * 获取当前时间戳（毫秒）
     *
     * @return 时间戳
     */
    public static long currentTimestamp() {
        return System.currentTimeMillis();
    }

    /**
     * 获取当前时间戳（秒）
     *
     * @return 时间戳（秒）
     */
    public static long currentTimestampSeconds() {
        return System.currentTimeMillis() / 1000;
    }

    /**
     * 获取当前LocalDateTime
     *
     * @return LocalDateTime
     */
    public static LocalDateTime now() {
        return LocalDateTime.now(DEFAULT_ZONE);
    }

    /**
     * 获取当前日期
     *
     * @return LocalDate
     */
    public static LocalDate today() {
        return LocalDate.now(DEFAULT_ZONE);
    }

    // ==================== 格式化方法 ====================

    /**
     * 格式化当前时间为标准格式
     *
     * @return 格式化字符串
     */
    public static String formatNow() {
        return now().format(STANDARD_FORMATTER);
    }

    /**
     * 格式化LocalDateTime为标准格式
     *
     * @param dateTime LocalDateTime
     * @return 格式化字符串
     */
    public static String format(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(STANDARD_FORMATTER);
    }

    /**
     * 格式化LocalDateTime为指定格式
     *
     * @param dateTime LocalDateTime
     * @param formatter 格式化器
     * @return 格式化字符串
     */
    public static String format(LocalDateTime dateTime, DateTimeFormatter formatter) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(formatter);
    }

    /**
     * 格式化时间戳为标准格式
     *
     * @param timestamp 时间戳（毫秒）
     * @return 格式化字符串
     */
    public static String formatTimestamp(long timestamp) {
        LocalDateTime dateTime = timestampToLocalDateTime(timestamp);
        return format(dateTime);
    }

    /**
     * 格式化时间戳为指定格式
     *
     * @param timestamp 时间戳（毫秒）
     * @param formatter 格式化器
     * @return 格式化字符串
     */
    public static String formatTimestamp(long timestamp, DateTimeFormatter formatter) {
        LocalDateTime dateTime = timestampToLocalDateTime(timestamp);
        return format(dateTime, formatter);
    }

    /**
     * 格式化Date为标准格式
     *
     * @param date Date对象
     * @return 格式化字符串
     */
    public static String formatDate(Date date) {
        if (date == null) {
            return "";
        }
        LocalDateTime dateTime = dateToLocalDateTime(date);
        return format(dateTime);
    }

    // ==================== 解析方法 ====================

    /**
     * 解析标准格式字符串为LocalDateTime
     *
     * @param dateTimeStr 时间字符串
     * @return LocalDateTime
     */
    public static LocalDateTime parse(String dateTimeStr) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeStr, STANDARD_FORMATTER);
    }

    /**
     * 解析指定格式字符串为LocalDateTime
     *
     * @param dateTimeStr 时间字符串
     * @param formatter 格式化器
     * @return LocalDateTime
     */
    public static LocalDateTime parse(String dateTimeStr, DateTimeFormatter formatter) {
        if (dateTimeStr == null || dateTimeStr.isEmpty()) {
            return null;
        }
        return LocalDateTime.parse(dateTimeStr, formatter);
    }

    // ==================== 转换方法 ====================

    /**
     * LocalDateTime转时间戳
     *
     * @param dateTime LocalDateTime
     * @return 时间戳（毫秒）
     */
    public static long toTimestamp(LocalDateTime dateTime) {
        if (dateTime == null) {
            return 0;
        }
        return dateTime.atZone(DEFAULT_ZONE).toInstant().toEpochMilli();
    }

    /**
     * 时间戳转LocalDateTime
     *
     * @param timestamp 时间戳（毫秒）
     * @return LocalDateTime
     */
    public static LocalDateTime timestampToLocalDateTime(long timestamp) {
        return LocalDateTime.ofInstant(
            Instant.ofEpochMilli(timestamp),
            DEFAULT_ZONE
        );
    }

    /**
     * Date转LocalDateTime
     *
     * @param date Date对象
     * @return LocalDateTime
     */
    public static LocalDateTime dateToLocalDateTime(Date date) {
        if (date == null) {
            return null;
        }
        return LocalDateTime.ofInstant(date.toInstant(), DEFAULT_ZONE);
    }

    /**
     * LocalDateTime转Date
     *
     * @param dateTime LocalDateTime
     * @return Date对象
     */
    public static Date toDate(LocalDateTime dateTime) {
        if (dateTime == null) {
            return null;
        }
        return Date.from(dateTime.atZone(DEFAULT_ZONE).toInstant());
    }

    // ==================== 计算方法 ====================

    /**
     * 计算两个时间之间的秒数差
     *
     * @param start 开始时间
     * @param end 结束时间
     * @return 秒数差
     */
    public static long secondsBetween(LocalDateTime start, LocalDateTime end) {
        return ChronoUnit.SECONDS.between(start, end);
    }

    /**
     * 计算两个时间之间的分钟差
     *
     * @param start 开始时间
     * @param end 结束时间
     * @return 分钟差
     */
    public static long minutesBetween(LocalDateTime start, LocalDateTime end) {
        return ChronoUnit.MINUTES.between(start, end);
    }

    /**
     * 计算两个时间之间的小时差
     *
     * @param start 开始时间
     * @param end 结束时间
     * @return 小时差
     */
    public static long hoursBetween(LocalDateTime start, LocalDateTime end) {
        return ChronoUnit.HOURS.between(start, end);
    }

    /**
     * 计算两个时间之间的天数差
     *
     * @param start 开始时间
     * @param end 结束时间
     * @return 天数差
     */
    public static long daysBetween(LocalDateTime start, LocalDateTime end) {
        return ChronoUnit.DAYS.between(start, end);
    }

    /**
     * 判断是否为同一天
     *
     * @param time1 时间1
     * @param time2 时间2
     * @return 是否为同一天
     */
    public static boolean isSameDay(LocalDateTime time1, LocalDateTime time2) {
        if (time1 == null || time2 == null) {
            return false;
        }
        return time1.toLocalDate().equals(time2.toLocalDate());
    }

    /**
     * 判断时间戳是否为今天
     *
     * @param timestamp 时间戳（毫秒）
     * @return 是否为今天
     */
    public static boolean isToday(long timestamp) {
        LocalDateTime dateTime = timestampToLocalDateTime(timestamp);
        return isSameDay(dateTime, now());
    }

    /**
     * 获取当天开始时间（00:00:00）
     *
     * @return LocalDateTime
     */
    public static LocalDateTime startOfDay() {
        return today().atStartOfDay();
    }

    /**
     * 获取当天结束时间（23:59:59）
     *
     * @return LocalDateTime
     */
    public static LocalDateTime endOfDay() {
        return today().atTime(23, 59, 59);
    }

    /**
     * 添加秒数
     *
     * @param dateTime 原时间
     * @param seconds 秒数
     * @return 新时间
     */
    public static LocalDateTime plusSeconds(LocalDateTime dateTime, long seconds) {
        return dateTime.plusSeconds(seconds);
    }

    /**
     * 添加分钟
     *
     * @param dateTime 原时间
     * @param minutes 分钟数
     * @return 新时间
     */
    public static LocalDateTime plusMinutes(LocalDateTime dateTime, long minutes) {
        return dateTime.plusMinutes(minutes);
    }

    /**
     * 添加小时
     *
     * @param dateTime 原时间
     * @param hours 小时数
     * @return 新时间
     */
    public static LocalDateTime plusHours(LocalDateTime dateTime, long hours) {
        return dateTime.plusHours(hours);
    }

    /**
     * 添加天数
     *
     * @param dateTime 原时间
     * @param days 天数
     * @return 新时间
     */
    public static LocalDateTime plusDays(LocalDateTime dateTime, long days) {
        return dateTime.plusDays(days);
    }

    // ==================== 业务方法 ====================

    /**
     * 判断时间是否过期
     *
     * @param expiryTime 过期时间
     * @return 是否过期
     */
    public static boolean isExpired(LocalDateTime expiryTime) {
        if (expiryTime == null) {
            return true;
        }
        return now().isAfter(expiryTime);
    }

    /**
     * 判断时间戳是否过期
     *
     * @param expiryTimestamp 过期时间戳（毫秒）
     * @return 是否过期
     */
    public static boolean isExpired(long expiryTimestamp) {
        return currentTimestamp() > expiryTimestamp;
    }

    /**
     * 获取过期时间（当前时间+ttl秒）
     *
     * @param ttlSeconds TTL（秒）
     * @return 过期时间
     */
    public static LocalDateTime getExpiryTime(long ttlSeconds) {
        return now().plusSeconds(ttlSeconds);
    }

    /**
     * 获取过期时间戳（当前时间戳+ttl毫秒）
     *
     * @param ttlMillis TTL（毫秒）
     * @return 过期时间戳
     */
    public static long getExpiryTimestamp(long ttlMillis) {
        return currentTimestamp() + ttlMillis;
    }
}
