package com.laya.game.game.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.core.type.classreading.CachingMetadataReaderFactory;
import org.springframework.core.type.classreading.MetadataReader;
import org.springframework.core.type.classreading.MetadataReaderFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.ClassUtils;
import jakarta.annotation.PostConstruct;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 配置管理器 (预加载版本)
 * 提供统一的配置查询接口，支持强类型和动态查询
 *
 * <p>核心特性：</p>
 * <ul>
 *   <li>预加载架构：启动时将所有配置转换为强类型对象</li>
 *   <li>极致性能：查询时直接返回对象，无需Jackson转换（0.001ms）</li>
 *   <li>泛型查询接口：支持强类型配置类和动态 Map 访问</li>
 *   <li>线程安全：不可变配置对象 + ConcurrentHashMap 无锁并发读</li>
 *   <li>内存优化：String.intern() 减少重复字符串内存占用</li>
 * </ul>
 *
 * <p>使用示例：</p>
 * <pre>{@code
 * // 强类型查询 (推荐)
 * ItemConfig item = configManager.get(ItemConfig.class, 1001);
 *
 * // 批量查询
 * List<ItemConfig> weapons = configManager.getByField(ItemConfig.class, "type", "weapon");
 *
 * // 动态查询 (可选，需要rawCache)
 * Map<String, Object> raw = configManager.getRaw("items", 1001);
 * }</pre>
 *
 * @author Laya Development Team
 * @version 2.0.0 (预加载优化版)
 * @since 1.0.0
 */
@Service
public class ConfigManager {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ConfigManager.class);
    // ==================== 双层缓存 ====================
    /**
     * L1 缓存：原始数据 (可选，用于getRaw支持)
     * 结构：tableName -> id -> Map<String, Object>
     * 例如：{"items" -> {1001 -> {id:1001, name:"铁剑", ...}}}
     */
    private final ConcurrentHashMap<String, ConcurrentHashMap<Integer, Map<String, Object>>> rawCache = new ConcurrentHashMap<>();
    /**
     * L2 缓存：预加载的强类型对象 (核心缓存)
     * 结构：Class<?> -> id -> Object
     * 例如：{ItemConfig.class -> {1001 -> ItemConfig对象}}
     * <p>启动时预加载所有配置，查询时直接返回，无需转换</p>
     */
    private final ConcurrentHashMap<Class<?>, ConcurrentHashMap<Integer, Object>> typedCache = new ConcurrentHashMap<>();
    /**
     * L3 缓存：字段索引
     * 结构：indexKey -> fieldValue -> List<id>
     * 例如：{"ItemConfig:type" -> {"weapon" -> [1001, 1002, 1003]}}
     * <p>延迟构建：首次 getByField 查询时才构建索引</p>
     */
    private final ConcurrentHashMap<String, Map<Object, List<Integer>>> indexCache = new ConcurrentHashMap<>();
    // ==================== 依赖注入 ====================
    @Autowired
    private JsonTableLoader loader;
    @Autowired
    private ObjectMapper objectMapper;

    // ==================== 初始化 ====================
    /**
     * Spring 启动时初始化配置系统
     * 加载所有配置表并预转换为强类型对象
     */
    @PostConstruct
    public void init() {
        long startTime = System.currentTimeMillis();
        log.info("========================================");
        log.info("配置系统开始初始化（预加载模式）...");
        try {
            // Step 1: 加载原始数据到 rawCache
            loadAllRawConfigs();
            // Step 2: 预加载转换为强类型对象到 typedCache
            preloadTypedConfigs();
            long elapsed = System.currentTimeMillis() - startTime;
            int tableCount = typedCache.size();
            int configCount = typedCache.values().stream().mapToInt(Map::size).sum();
            log.info("配置系统初始化完成:");
            log.info("  - 配置表数量: {} 张", tableCount);
            log.info("  - 配置项数量: {} 条", configCount);
            log.info("  - 耗时: {} ms", elapsed);
            log.info("========================================");
        } catch (Exception e) {
            log.error("配置系统初始化失败！", e);
            throw new RuntimeException("配置系统初始化失败", e);
        }
    }

    /**
     * 加载所有配置表的原始数据
     */
    private void loadAllRawConfigs() {
        // 使用 JsonTableLoader 加载所有配置
        Map<String, List<Map<String, Object>>> allConfigs = loader.loadAll();
        rawCache.clear();
        // 构建 id 索引并存入 rawCache
        for (Map.Entry<String, List<Map<String, Object>>> entry : allConfigs.entrySet()) {
            String tableName = entry.getKey();
            List<Map<String, Object>> configs = entry.getValue();
            // 构建 id -> config 映射
            ConcurrentHashMap<Integer, Map<String, Object>> indexedConfigs = new ConcurrentHashMap<>();
            for (Map<String, Object> config : configs) {
                Object idObj = getIdValue(config);
                if (idObj instanceof Integer) {
                    int id = (Integer) idObj;
                    indexedConfigs.put(id, config);
                }
            }
            rawCache.put(tableName, indexedConfigs);
        }
    }

    private ConcurrentHashMap<Integer, Map<String, Object>> buildRawTable(List<Map<String, Object>> configs) {
        ConcurrentHashMap<Integer, Map<String, Object>> indexedConfigs = new ConcurrentHashMap<>();
        for (Map<String, Object> config : configs) {
            Object idObj = getIdValue(config);
            if (idObj instanceof Integer) {
                int id = (Integer) idObj;
                indexedConfigs.put(id, config);
            }
        }
        return indexedConfigs;
    }

    /**
     * 预加载所有配置为强类型对象
     * 自动扫描 configStruct 包下的所有配置类并预加载
     */
    private void preloadTypedConfigs() {
        log.info("开始自动扫描配置类...");
        // 自动扫描 configStruct 包下的所有 Config 类
        List<Class<?>> configClasses = scanConfigClasses();
        log.info("扫描到 {} 个配置类", configClasses.size());
        // 逐个预加载
        for (Class<?> configClass : configClasses) {
            try {
                loadConfigTable(configClass);
            } catch (Exception e) {
                log.error("配置表加载失败: {}", configClass.getSimpleName(), e);
                throw new RuntimeException("配置表加载失败: " + configClass.getSimpleName(), e);
            }
        }
        log.info("预加载完成，共 {} 张表", typedCache.size());
    }

    /**
     * 扫描 configStruct 包下的所有配置类
     * 使用 Spring 的 ResourcePatternResolver 扫描
     * 支持 JAR 和文件系统两种运行环境
     *
     * @return 配置类列表
     */
    private List<Class<?>> scanConfigClasses() {
        List<Class<?>> classes = new ArrayList<>();
        String packageName = "com.laya.game.game.configStruct";
        String packageSearchPath = "classpath*:" + ClassUtils.convertClassNameToResourcePath(packageName) + "/**/*.class";
        try {
            ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            MetadataReaderFactory metadataReaderFactory = new CachingMetadataReaderFactory(resolver);
            Resource[] resources = resolver.getResources(packageSearchPath);
            for (Resource resource : resources) {
                if (!resource.isReadable()) {
                    continue;
                }
                try {
                    MetadataReader metadataReader = metadataReaderFactory.getMetadataReader(resource);
                    String className = metadataReader.getClassMetadata().getClassName();
                    // 只加载以 "Config" 结尾的类
                    if (className.endsWith("Config")) {
                        Class<?> clazz = Class.forName(className);
                        classes.add(clazz);
                        log.debug("发现配置类: {}", clazz.getSimpleName());
                    }
                } catch (Exception e) {
                    log.warn("读取类元数据失败: {}", resource, e);
                }
            }
        } catch (Exception e) {
            log.error("扫描配置类失败", e);
            throw new RuntimeException("扫描配置类失败", e);
        }
        return classes;
    }

    /**
     * 加载单张配置表
     *
     * @param configClass 配置类
     * @param <T> 配置类型
     */
    private <T> void loadConfigTable(Class<T> configClass) {
        String tableName = getTableName(configClass);
        Map<Integer, Map<String, Object>> rawTable = rawCache.get(tableName);
        if (rawTable == null || rawTable.isEmpty()) {
            log.warn("配置表为空或不存在: {}", tableName);
            return;
        }
        ConcurrentHashMap<Integer, Object> typedTable = new ConcurrentHashMap<>();
        int successCount = 0;
        int failCount = 0;
        // 转换所有配置为强类型对象
        for (Map.Entry<Integer, Map<String, Object>> entry : rawTable.entrySet()) {
            int id = entry.getKey();
            Map<String, Object> rawData = entry.getValue();
            try {
                T typedObject = objectMapper.convertValue(rawData, configClass);
                typedTable.put(id, typedObject);
                successCount++;
            } catch (Exception e) {
                log.error("配置转换失败: {} id={}", tableName, id, e);
                failCount++;
            }
        }
        typedCache.put(configClass, typedTable);
        log.info("预加载配置表: {} ({} 条成功, {} 条失败)", tableName, successCount, failCount);
        if (failCount > 0) {
            throw new RuntimeException(String.format("配置表 %s 有 %d 条配置转换失败", tableName, failCount));
        }
    }

    /**
     * 重新加载所有配置表。
     *
     * <p>适用于策划只修改已有表数值的热更场景。新增表、删除表、修改字段结构时，
     * 仍然需要重新导出 Java 配置类并重新编译/重启服务器。</p>
     */
    public synchronized void reloadAll() {
        long startTime = System.currentTimeMillis();
        log.info("开始重新加载所有配置表...");

        ConcurrentHashMap<String, ConcurrentHashMap<Integer, Map<String, Object>>> oldRawCache = new ConcurrentHashMap<>(rawCache);
        ConcurrentHashMap<Class<?>, ConcurrentHashMap<Integer, Object>> oldTypedCache = new ConcurrentHashMap<>(typedCache);
        ConcurrentHashMap<String, Map<Object, List<Integer>>> oldIndexCache = new ConcurrentHashMap<>(indexCache);

        try {
            rawCache.clear();
            typedCache.clear();
            indexCache.clear();

            loadAllRawConfigs();
            preloadTypedConfigs();

            long elapsed = System.currentTimeMillis() - startTime;
            log.info("所有配置表重新加载完成，配置表数量={}, 配置项数量={}, 耗时={}ms",
                    typedCache.size(),
                    typedCache.values().stream().mapToInt(Map::size).sum(),
                    elapsed);
        } catch (Exception e) {
            rawCache.clear();
            rawCache.putAll(oldRawCache);
            typedCache.clear();
            typedCache.putAll(oldTypedCache);
            indexCache.clear();
            indexCache.putAll(oldIndexCache);
            log.error("重新加载所有配置表失败，已恢复旧缓存", e);
            throw new RuntimeException("重新加载所有配置表失败", e);
        }
    }

    /**
     * 重新加载单张配置表。
     *
     * @param configClass 配置类
     */
    public synchronized <T> void reloadTable(Class<T> configClass) {
        String tableName = getTableName(configClass);
        log.info("开始重新加载配置表: {}", tableName);

        ConcurrentHashMap<Integer, Map<String, Object>> oldRawTable = rawCache.get(tableName);
        ConcurrentHashMap<Integer, Object> oldTypedTable = typedCache.get(configClass);
        ConcurrentHashMap<String, Map<Object, List<Integer>>> oldIndexCache = new ConcurrentHashMap<>(indexCache);

        try {
            List<Map<String, Object>> configs = loader.loadTable(tableName);
            ConcurrentHashMap<Integer, Map<String, Object>> newRawTable = buildRawTable(configs);
            rawCache.put(tableName, newRawTable);

            loadConfigTable(configClass);
            clearIndexCache(configClass);

            log.info("配置表重新加载完成: {} ({}条配置)", tableName, newRawTable.size());
        } catch (Exception e) {
            if (oldRawTable != null) {
                rawCache.put(tableName, oldRawTable);
            } else {
                rawCache.remove(tableName);
            }

            if (oldTypedTable != null) {
                typedCache.put(configClass, oldTypedTable);
            } else {
                typedCache.remove(configClass);
            }

            indexCache.clear();
            indexCache.putAll(oldIndexCache);
            log.error("配置表重新加载失败，已恢复旧缓存: {}", tableName, e);
            throw new RuntimeException("配置表重新加载失败: " + tableName, e);
        }
    }

    // ==================== 泛型查询接口 ====================
    /**
     * 按 ID 查询配置（强类型）
     * 性能：~0.001ms (预加载后直接返回，无转换开销)
     *
     * @param configClass 配置类（如 ItemConfig.class）
     * @param id 配置ID
     * @param <T> 配置类型
     * @return 配置对象，不存在则返回 null
     * @throws IllegalArgumentException 如果配置表未注册
     */
    public <T> T get(Class<T> configClass, int id) {
        ConcurrentHashMap<Integer, Object> table = typedCache.get(configClass);
        if (table == null) {
            throw new IllegalArgumentException("配置表未注册: " + configClass.getSimpleName() + "，请在 CONFIG_CLASSES 中添加");
        }
        @SuppressWarnings("unchecked")
        T result = (T) table.get(id);
        return result;
    }

    /**
     * 查询所有配置（强类型）
     *
     * @param configClass 配置类
     * @param <T> 配置类型
     * @return 配置列表
     */
    public <T> List<T> getAll(Class<T> configClass) {
        ConcurrentHashMap<Integer, Object> table = typedCache.get(configClass);
        if (table == null || table.isEmpty()) {
            return Collections.emptyList();
        }
        @SuppressWarnings("unchecked")
        List<T> result = table.values().stream().map(obj -> (T) obj).collect(Collectors.toList());
        return result;
    }

    /**
     * 按字段值查询配置（强类型）
     * 使用延迟构建的字段索引，避免全表扫描
     *
     * @param configClass 配置类
     * @param field 字段名
     * @param value 字段值
     * @param <T> 配置类型
     * @return 匹配的配置列表
     */
    public <T> List<T> getByField(Class<T> configClass, String field, Object value) {
        String indexKey = configClass.getSimpleName() + ":" + field;
        // 检查索引缓存
        Map<Object, List<Integer>> fieldIndex = indexCache.get(indexKey);
        if (fieldIndex == null) {
            // 延迟构建索引（首次查询时）
            fieldIndex = buildFieldIndexFromTyped(configClass, field);
            indexCache.put(indexKey, fieldIndex);
            log.debug("构建字段索引: {}", indexKey);
        }
        List<Integer> ids = fieldIndex.get(value);
        if (ids == null || ids.isEmpty()) {
            return Collections.emptyList();
        }
        return ids.stream().map(id -> get(configClass, id)).filter(Objects::nonNull).collect(Collectors.toList());
    }

    /**
     * 按 ID 查询原始数据（动态查询，无类型）
     *
     * @param tableName 表名（如 "items"）
     * @param id 配置ID
     * @return 原始配置 Map，不存在则返回 null
     */
    public Map<String, Object> getRaw(String tableName, int id) {
        Map<Integer, Map<String, Object>> table = rawCache.get(tableName);
        return table != null ? table.get(id) : null;
    }

    /**
     * 查询所有原始数据（动态查询）
     *
     * @param tableName 表名
     * @return 所有配置的 Map 列表
     */
    public List<Map<String, Object>> getAllRaw(String tableName) {
        Map<Integer, Map<String, Object>> table = rawCache.get(tableName);
        if (table == null || table.isEmpty()) {
            return Collections.emptyList();
        }
        return new ArrayList<>(table.values());
    }

    // ==================== 工具方法 ====================
    /**
     * 从配置类名推导表名
     * 规则：XxxConfig -> Xxx
     * 例如：ItemConfig -> Item, MonsterConfig -> Monster
     *
     * @param configClass 配置类
     * @return 表名
     */
    private String getTableName(Class<?> configClass) {
        String className = configClass.getSimpleName();
        // 去掉 "Config" 后缀
        if (className.endsWith("Config")) {
            className = className.substring(0, className.length() - 6);
        }
        return className;
    }

    /**
     * 从强类型对象构建字段索引
     * 使用反射���取字段值，为指定字段建立 value -> ids 的映射
     *
     * @param configClass 配置类
     * @param field 字段名
     * @return 字段索引 Map
     */
    private <T> Map<Object, List<Integer>> buildFieldIndexFromTyped(Class<T> configClass, String field) {
        Map<Object, List<Integer>> index = new HashMap<>();
        ConcurrentHashMap<Integer, Object> table = typedCache.get(configClass);
        if (table == null) {
            return index;
        }
        for (Map.Entry<Integer, Object> entry : table.entrySet()) {
            int id = entry.getKey();
            Object configObj = entry.getValue();
            try {
                // 使用反射获取字段值
                java.lang.reflect.Field fieldObj = configClass.getDeclaredField(field);
                fieldObj.setAccessible(true);
                Object fieldValue = fieldObj.get(configObj);
                if (fieldValue != null) {
                    index.computeIfAbsent(fieldValue, k -> new ArrayList<>()).add(id);
                }
            } catch (NoSuchFieldException e) {
                log.error("字段不存在: {}.{}", configClass.getSimpleName(), field);
                throw new IllegalArgumentException("字段不存在: " + field);
            } catch (IllegalAccessException e) {
                log.error("字段访问失败: {}.{}", configClass.getSimpleName(), field);
                throw new RuntimeException("字段访问失败: " + field, e);
            }
        }
        return index;
    }

    // ==================== 统计信息 ====================
    /**
     * 获取配置统计信息
     *
     * @return 统计信息 Map
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("tableCount", typedCache.size());
        stats.put("configCount", typedCache.values().stream().mapToInt(Map::size).sum());
        stats.put("indexCacheSize", indexCache.size());
        stats.put("rawCacheSize", rawCache.size());
        // 各表配置数量
        Map<String, Integer> tableSizes = new LinkedHashMap<>();
        typedCache.forEach((configClass, table) -> tableSizes.put(configClass.getSimpleName(), table.size()));
        stats.put("tableSizes", tableSizes);
        return stats;
    }

    /**
     * 清除字段索引缓存
     *
     * @param configClass 配置类（可选，null 则清除所有）
     */
    public void clearIndexCache(Class<?> configClass) {
        if (configClass == null) {
            indexCache.clear();
            log.info("已清除所有索引缓存");
        } else {
            // 清除特定表的索引缓存
            String prefix = configClass.getSimpleName() + ":";
            indexCache.keySet().removeIf(key -> key.startsWith(prefix));
            log.info("已清除配置表 {} 的索引缓存", configClass.getSimpleName());
        }
    }

    private Object getIdValue(Map<String, Object> config) {
        Object idObj = config.get("id");
        if (idObj != null) {
            return idObj;
        }
        idObj = config.get("ID");
        if (idObj != null) {
            return idObj;
        }
        idObj = config.get("Id");
        if (idObj != null) {
            return idObj;
        }
        return config.get("iD");
    }
}
