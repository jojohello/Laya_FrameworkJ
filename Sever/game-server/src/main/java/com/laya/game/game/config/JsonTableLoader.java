package com.laya.game.game.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;
import java.io.File;
import java.io.IOException;
import java.util.*;

/**
 * JSON 配置表加载器
 * 负责扫描配置目录，加载所有 JSON 配置文件
 *
 * <p>功能：</p>
 * <ul>
 *   <li>扫描配置目录（支持 file: 和 classpath: 协议）</li>
 *   <li>读取所有 .json 文件</li>
 *   <li>解析为 List&lt;Map&lt;String, Object&gt;&gt; 格式</li>
 *   <li>验证配置格式（必须包含 id 字段）</li>
 *   <li>错误处理和日志记录</li>
 * </ul>
 *
 * @author Laya Development Team
 * @since 1.0.0
 */
@Component
public class JsonTableLoader {
    @java.lang.SuppressWarnings("all")
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(JsonTableLoader.class);
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private ResourceLoader resourceLoader;
    @Value("${laya.game.config.tables-path}")
    private String tablesPath;

    /**
     * 加载所有配置表
     *
     * @return 配置表映射（表名 -> 配置列表）
     * @throws RuntimeException 如果配置加载失败
     */
    public Map<String, List<Map<String, Object>>> loadAll() {
        log.info("开始加载配置表，路径: {}", tablesPath);
        Map<String, List<Map<String, Object>>> result = new LinkedHashMap<>();
        try {
            // 解析路径
            File configDir = resolveTablesPath();
            if (configDir == null || !configDir.exists() || !configDir.isDirectory()) {
                log.error("配置目录不存在或不是目录: {}", tablesPath);
                throw new RuntimeException("配置目录不存在: " + tablesPath);
            }
            // 扫描所有 JSON 文件
            File[] jsonFiles = configDir.listFiles((dir, name) -> name.endsWith(".json"));
            if (jsonFiles == null || jsonFiles.length == 0) {
                log.warn("配置目录中没有找到 JSON 文件: {}", configDir.getAbsolutePath());
                return result;
            }
            // 加载每个文件
            for (File file : jsonFiles) {
                String tableName = getTableName(file);
                try {
                    List<Map<String, Object>> configs = parseJsonFile(file);
                    result.put(tableName, configs);
                    log.info("加载配置表: {} ({}条配置)", tableName, configs.size());
                } catch (Exception e) {
                    log.error("加载配置表失败: {}", file.getName(), e);
                    throw new RuntimeException("配置加载失败: " + file.getName(), e);
                }
            }
            log.info("配置表加载完成，共{}张表", result.size());
            return result;
        } catch (Exception e) {
            log.error("配置系统初始化失败", e);
            throw new RuntimeException("配置系统初始化失败", e);
        }
    }

    /**
     * 加载单个配置表
     *
     * @param tableName 表名（不含 .json 后缀）
     * @return 配置列表
     * @throws IOException 如果文件读取失败
     */
    public List<Map<String, Object>> loadTable(String tableName) throws IOException {
        File configDir = resolveTablesPath();
        File file = new File(configDir, tableName + ".json");
        if (!file.exists()) {
            log.warn("配置文件不存在: {}", file.getAbsolutePath());
            return Collections.emptyList();
        }
        return parseJsonFile(file);
    }

    /**
     * 解析配置表路径
     * 支持 file: 和 classpath: 协议
     *
     * @return 配置目录的 File 对象
     */
    private File resolveTablesPath() {
        try {
            // 处理 file: 协议
            if (tablesPath.startsWith("file:")) {
                String path = tablesPath.substring(5);
                return new File(path).getAbsoluteFile();
            }
            // 处理 classpath: 协议
            if (tablesPath.startsWith("classpath:")) {
                Resource resource = resourceLoader.getResource(tablesPath);
                return resource.getFile();
            }
            // 默认当作相对路径
            return new File(tablesPath).getAbsoluteFile();
        } catch (Exception e) {
            log.error("解析配置路径失败: {}", tablesPath, e);
            throw new RuntimeException("解析配置路径失败: " + tablesPath, e);
        }
    }

    /**
     * 解析 JSON 文件
     *
     * @param file JSON 文件
     * @return 配置列表
     * @throws IOException 如果文件读取或解析失败
     */
    private List<Map<String, Object>> parseJsonFile(File file) throws IOException {
        // 使用 Jackson TypeReference 解析
        TypeReference<List<Map<String, Object>>> typeRef = new TypeReference<List<Map<String, Object>>>() {
        };
        List<Map<String, Object>> configs = objectMapper.readValue(file, typeRef);
        // 验证配置格式
        validateConfigs(file.getName(), configs);
        return configs;
    }

    /**
     * 验证配置格式
     * 检查每条配置是否包含 id 字段
     *
     * @param fileName 文件名（用于日志）
     * @param configs 配置列表
     */
    private void validateConfigs(String fileName, List<Map<String, Object>> configs) {
        if (configs == null) {
            throw new RuntimeException("配置文件内容为 null: " + fileName);
        }
        Set<Integer> idSet = new HashSet<>();
        for (int i = 0; i < configs.size(); i++) {
            Map<String, Object> config = configs.get(i);
            if (config == null) {
                log.warn("{}: 第{}条配置为 null，已跳过", fileName, i + 1);
                continue;
            }
            // 检查 id 字段。导出工具当前使用 CSV 原字段名，通常是 "ID"。
            Object idObj = getIdValue(config);
            if (idObj == null) {
                log.error("{}: 第{}条配置缺少 id 字段: {}", fileName, i + 1, config);
                throw new RuntimeException(fileName + ": 配置缺少 id 字段");
            }
            // 检查 id 类型
            if (!(idObj instanceof Integer)) {
                log.error("{}: 第{}条配置的 id 字段类型错误（应为 Integer）: {}", fileName, i + 1, idObj);
                throw new RuntimeException(fileName + ": id 字段类型错误");
            }
            int id = (Integer) idObj;
            // 检查 id 重复
            if (idSet.contains(id)) {
                log.warn("{}: 发现重复的 id: {}，后者将覆盖前者", fileName, id);
            }
            idSet.add(id);
        }
    }

    /**
     * 从文件名提取表名
     * 例如：items.json -> items
     *
     * @param file 文件
     * @return 表名
     */
    private String getTableName(File file) {
        String fileName = file.getName();
        int dotIndex = fileName.lastIndexOf('.');
        return dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
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
