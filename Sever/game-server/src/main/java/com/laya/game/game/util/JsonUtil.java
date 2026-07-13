package com.laya.game.game.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

/**
 * JSON工具类
 * 基于Jackson提供JSON序列化/反序列化功能
 *
 * @author Laya Game Server Framework
 * @version 1.0.0
 */
public class JsonUtil {

    private static final Logger logger = LoggerFactory.getLogger(JsonUtil.class);

    private static final ObjectMapper objectMapper;

    static {
        objectMapper = new ObjectMapper();

        // 注册Java 8时间模块
        objectMapper.registerModule(new JavaTimeModule());

        // 序列化配置
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);

        // 反序列化配置
        objectMapper.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
        objectMapper.disable(DeserializationFeature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE);

        logger.info("JsonUtil initialized with ObjectMapper");
    }

    // ==================== 序列化方法 ====================

    /**
     * 对象转JSON字符串
     *
     * @param obj 对象
     * @return JSON字符串
     */
    public static String toJson(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize object to JSON: {}", obj.getClass().getName(), e);
            return null;
        }
    }

    /**
     * 对象转格式化的JSON字符串（带缩进）
     *
     * @param obj 对象
     * @return 格式化的JSON字符串
     */
    public static String toJsonPretty(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize object to pretty JSON: {}", obj.getClass().getName(), e);
            return null;
        }
    }

    /**
     * 对象转JSON字节数组
     *
     * @param obj 对象
     * @return JSON字节数组
     */
    public static byte[] toJsonBytes(Object obj) {
        if (obj == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsBytes(obj);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize object to JSON bytes: {}", obj.getClass().getName(), e);
            return null;
        }
    }

    // ==================== 反序列化方法 ====================

    /**
     * JSON字符串转对象
     *
     * @param json JSON字符串
     * @param clazz 目标类型
     * @param <T> 泛型类型
     * @return 对象
     */
    public static <T> T fromJson(String json, Class<T> clazz) {
        if (json == null || json.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(json, clazz);
        } catch (JsonProcessingException e) {
            logger.error("Failed to deserialize JSON to {}: {}", clazz.getName(), json, e);
            return null;
        }
    }

    /**
     * JSON字符串转对象（使用TypeReference处理泛型）
     *
     * @param json JSON字符串
     * @param typeReference 类型引用
     * @param <T> 泛型类型
     * @return 对象
     */
    public static <T> T fromJson(String json, TypeReference<T> typeReference) {
        if (json == null || json.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(json, typeReference);
        } catch (JsonProcessingException e) {
            logger.error("Failed to deserialize JSON with TypeReference: {}", json, e);
            return null;
        }
    }

    /**
     * JSON字节数组转对象
     *
     * @param jsonBytes JSON字节数组
     * @param clazz 目标类型
     * @param <T> 泛型类型
     * @return 对象
     */
    public static <T> T fromJsonBytes(byte[] jsonBytes, Class<T> clazz) {
        if (jsonBytes == null || jsonBytes.length == 0) {
            return null;
        }

        try {
            return objectMapper.readValue(jsonBytes, clazz);
        } catch (IOException e) {
            logger.error("Failed to deserialize JSON bytes to {}", clazz.getName(), e);
            return null;
        }
    }

    // ==================== 文件操作 ====================

    /**
     * 从文件读取JSON并转换为对象
     *
     * @param file 文件
     * @param clazz 目标类型
     * @param <T> 泛型类型
     * @return 对象
     */
    public static <T> T fromJsonFile(File file, Class<T> clazz) {
        if (file == null || !file.exists()) {
            logger.warn("JSON file not found: {}", file);
            return null;
        }

        try {
            return objectMapper.readValue(file, clazz);
        } catch (IOException e) {
            logger.error("Failed to read JSON from file: {}", file.getAbsolutePath(), e);
            return null;
        }
    }

    /**
     * 从文件读取JSON并转换为对象（使用TypeReference）
     *
     * @param file 文件
     * @param typeReference 类型引用
     * @param <T> 泛型类型
     * @return 对象
     */
    public static <T> T fromJsonFile(File file, TypeReference<T> typeReference) {
        if (file == null || !file.exists()) {
            logger.warn("JSON file not found: {}", file);
            return null;
        }

        try {
            return objectMapper.readValue(file, typeReference);
        } catch (IOException e) {
            logger.error("Failed to read JSON from file: {}", file.getAbsolutePath(), e);
            return null;
        }
    }

    /**
     * 从输入流读取JSON并转换为对象
     *
     * @param inputStream 输入流
     * @param clazz 目标类型
     * @param <T> 泛型类型
     * @return 对象
     */
    public static <T> T fromJsonStream(InputStream inputStream, Class<T> clazz) {
        if (inputStream == null) {
            return null;
        }

        try {
            return objectMapper.readValue(inputStream, clazz);
        } catch (IOException e) {
            logger.error("Failed to read JSON from input stream", e);
            return null;
        }
    }

    /**
     * 将对象写入JSON文件
     *
     * @param obj 对象
     * @param file 文件
     * @return 是否成功
     */
    public static boolean toJsonFile(Object obj, File file) {
        if (obj == null || file == null) {
            return false;
        }

        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, obj);
            return true;
        } catch (IOException e) {
            logger.error("Failed to write JSON to file: {}", file.getAbsolutePath(), e);
            return false;
        }
    }

    // ==================== 常用类型转换 ====================

    /**
     * JSON字符串转List
     *
     * @param json JSON字符串
     * @param elementClass 元素类型
     * @param <T> 泛型类型
     * @return List对象
     */
    public static <T> List<T> toList(String json, Class<T> elementClass) {
        if (json == null || json.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(
                json,
                objectMapper.getTypeFactory().constructCollectionType(List.class, elementClass)
            );
        } catch (JsonProcessingException e) {
            logger.error("Failed to deserialize JSON to List<{}>: {}", elementClass.getName(), json, e);
            return null;
        }
    }

    /**
     * JSON字符串转Map
     *
     * @param json JSON字符串
     * @return Map对象
     */
    public static Map<String, Object> toMap(String json) {
        if (json == null || json.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            logger.error("Failed to deserialize JSON to Map: {}", json, e);
            return null;
        }
    }

    /**
     * JSON字符串转Map（指定值类型）
     *
     * @param json JSON字符串
     * @param valueClass 值类型
     * @param <V> 值泛型类型
     * @return Map对象
     */
    public static <V> Map<String, V> toMap(String json, Class<V> valueClass) {
        if (json == null || json.isEmpty()) {
            return null;
        }

        try {
            return objectMapper.readValue(
                json,
                objectMapper.getTypeFactory().constructMapType(Map.class, String.class, valueClass)
            );
        } catch (JsonProcessingException e) {
            logger.error("Failed to deserialize JSON to Map<String, {}>: {}", valueClass.getName(), json, e);
            return null;
        }
    }

    // ==================== 工具方法 ====================

    /**
     * 判断字符串是否为有效的JSON
     *
     * @param json JSON字符串
     * @return 是否有效
     */
    public static boolean isValidJson(String json) {
        if (json == null || json.isEmpty()) {
            return false;
        }

        try {
            objectMapper.readTree(json);
            return true;
        } catch (JsonProcessingException e) {
            return false;
        }
    }

    /**
     * 对象深拷贝
     *
     * @param obj 原对象
     * @param clazz 目标类型
     * @param <T> 泛型类型
     * @return 拷贝后的对象
     */
    public static <T> T deepCopy(Object obj, Class<T> clazz) {
        if (obj == null) {
            return null;
        }

        String json = toJson(obj);
        return fromJson(json, clazz);
    }

    /**
     * 获取ObjectMapper实例
     *
     * @return ObjectMapper
     */
    public static ObjectMapper getObjectMapper() {
        return objectMapper;
    }
}
