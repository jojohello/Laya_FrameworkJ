/**
 * Server-side Config Export Tool
 *
 * 功能：
 * 1. 解析CSV文件的4行表头（Title/Type/Description/UsedSize）
 * 2. 提取UsedSize标记为's'或'cs'的字段
 * 3. 生成服务器端JSON文件（相对路径）
 * 4. 生成Java配置类文件（匹配现有规范）
 *
 * 对接现有config系统：
 * - Java类输出到 configStruct 包
 * - 使用 @JsonProperty + 显式 getter（不依赖 Lombok）
 * - final 字段 + @JsonCreator 构造器
 * - String.intern() 优化重复字符串
 */

const fs = require('fs');
const path = require('path');

// 配置路径（使用相对路径）
const CONFIG = {
    csvDir: path.join(__dirname, '../csv'),
    // JSON输出到 Sever/output/config/tables/ (服务器运行目录)
    jsonOutputDir: path.join(__dirname, '../../Sever/output/config/tables'),
    // Java类输出到 configStruct 包
    javaOutputDir: path.join(__dirname, '../../Sever/game-server/src/main/java/com/laya/game/game/configStruct'),
    javaPackage: 'com.laya.game.game.configStruct'
};

/**
 * 解析CSV文件
 */
function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length < 5) {
        throw new Error(`CSV文件格式错误，至少需要5行（4行表头+1行数据）: ${filePath}`);
    }

    // 解析4行表头
    const titleRow = parseCSVLine(lines[0]);
    const typeRow = parseCSVLine(lines[1]);
    const descriptionRow = parseCSVLine(lines[2]);
    const usedSizeRow = parseCSVLine(lines[3]);

    if (titleRow.length !== typeRow.length ||
        titleRow.length !== descriptionRow.length ||
        titleRow.length !== usedSizeRow.length) {
        throw new Error(`CSV文件表头行列数不一致: ${filePath}`);
    }

    // 构建字段元数据
    const fields = [];
    for (let i = 0; i < titleRow.length; i++) {
        const usedSize = usedSizeRow[i].trim().toLowerCase();
        // 只保留标记为's'或'cs'的字段
        if (usedSize === 's' || usedSize === 'cs') {
            fields.push({
                title: titleRow[i].trim(),
                type: typeRow[i].trim().toLowerCase(),
                description: descriptionRow[i].trim(),
                usedSize: usedSize,
                index: i
            });
        }
    }

    // 解析数据行
    const dataRows = [];
    for (let i = 4; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('//') || line.startsWith('#')) {
            continue; // 跳过空行和注释行
        }

        const values = parseCSVLine(line);
        const rowData = {};

        fields.forEach(field => {
            const value = values[field.index] || '';
            rowData[field.title] = convertValue(value.trim(), field.type);
        });

        dataRows.push(rowData);
    }

    return { fields, dataRows };
}

/**
 * 解析CSV行（处理逗号分隔）
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current);
    return result;
}

/**
 * 转换值类型
 */
function convertValue(value, type) {
    if (!value || value === '') {
        // 返回类型默认值
        switch (type) {
            case 'int': return 0;
            case 'float': return 0.0;
            case 'bool': return false;
            case 'str': return '';
            default: return value;
        }
    }

    switch (type) {
        case 'int':
            return parseInt(value, 10) || 0;
        case 'float':
            return parseFloat(value) || 0.0;
        case 'bool':
            return value.toLowerCase() === 'true' || value === '1';
        case 'str':
        default:
            return value;
    }
}

/**
 * 生成JSON文件
 */
function generateJSON(tableName, data) {
    const outputPath = path.join(CONFIG.jsonOutputDir, `${tableName}.json`);

    // 确保输出目录存在
    fs.mkdirSync(CONFIG.jsonOutputDir, { recursive: true });

    // 写入JSON文件
    fs.writeFileSync(outputPath, `${JSON.stringify(data.dataRows, null, 2)}\n`, 'utf-8');

    console.log(`✓ 生成JSON: ${path.relative(process.cwd(), outputPath)}`);
    return outputPath;
}

/**
 * 生成Java配置类（匹配现有规范）
 */
function generateJavaClass(tableName, data) {
    const className = `${tableName}Config`;
    const outputPath = path.join(CONFIG.javaOutputDir, `${className}.java`);

    // 确保输出目录存在
    fs.mkdirSync(CONFIG.javaOutputDir, { recursive: true });

    // 检查是否有必填字段（非 nullable）
    const requiredFields = data.fields.filter(f =>
        f.title.toLowerCase() === 'id' ||
        (f.type !== 'int' && f.type !== 'float' && f.type !== 'bool')
    );

    // 生成字段声明
    const fieldDeclarations = data.fields.map(field => {
        const javaType = mapJavaType(field.type, field.title);
        const fieldName = field.title;
        const isRequired = field.title.toLowerCase() === 'id' || field.type === 'str';

        return `    /**
     * ${field.description}
     */
    @JsonProperty("${fieldName}")
    private final ${javaType} ${fieldName};`;
    }).join('\n\n');

    // 生成构造器参数
    const constructorParams = data.fields.map(field => {
        const javaType = mapJavaType(field.type, field.title);
        const fieldName = field.title;
        return `            @JsonProperty("${fieldName}") ${javaType} ${fieldName}`;
    }).join(',\n');

    // 生成构造器字段赋值
    const constructorAssignments = data.fields.map(field => {
        const fieldName = field.title;
        const javaType = mapJavaType(field.type, field.title);

        // 判断是否需要 intern()
        if (javaType === 'String' && shouldIntern(fieldName)) {
            return `        this.${fieldName} = ${fieldName} != null ? ${fieldName}.intern() : null;`;
        } else {
            return `        this.${fieldName} = ${fieldName};`;
        }
    }).join('\n');

    // 生成toString方法
    const toStringFields = data.fields.slice(0, Math.min(5, data.fields.length))
        .map(f => `${f.title}=%s`)
        .join(', ');
    const toStringArgs = data.fields.slice(0, Math.min(5, data.fields.length))
        .map(f => f.title)
        .join(', ');

    const getterMethods = data.fields.map(field => {
        const javaType = mapJavaType(field.type, field.title);
        const fieldName = field.title;
        const getterName = `get${fieldName.charAt(0).toUpperCase()}${fieldName.slice(1)}`;
        return `    public ${javaType} ${getterName}() {
        return ${fieldName};
    }`;
    }).join('\n\n');

    // 生成Java类代码
    const javaCode = `package ${CONFIG.javaPackage};

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;

/**
 * ${tableName} 配置类
 * 自动生成，请勿手动修改
 *
 * <p>对应JSON文件: config/tables/${tableName}.json</p>
 *
 * <p>性能优化：</p>
 * <ul>
 *   <li>使用 final 保证不可变性，线程安全</li>
 *   <li>String interning 减少内存占用（重复字符串）</li>
 * </ul>
 *
 * @author Laya Development Team (Auto Generated)
 * @since 1.0.0
 */
public class ${className} implements Serializable {

    private static final long serialVersionUID = 1L;

${fieldDeclarations}

    /**
     * 构造函数（Jackson反序列化使用）
     * <p>String类型使用intern()进行字符串池化，减少内存占用</p>
     */
    @JsonCreator
    public ${className}(
${constructorParams}) {
${constructorAssignments}
    }

${getterMethods}

    @Override
    public String toString() {
        return String.format("${className}{${toStringFields}}",
                ${toStringArgs});
    }
}
`;

    // 写入Java文件
    fs.writeFileSync(outputPath, javaCode, 'utf-8');

    console.log(`✓ 生成Java类: ${path.relative(process.cwd(), outputPath)}`);
    return outputPath;
}

/**
 * 映射Java类型（根据字段名判断是否nullable）
 */
function mapJavaType(csvType, fieldName) {
    const lowerFieldName = fieldName.toLowerCase();

    // id 字段必须是基础类型
    if (lowerFieldName === 'id') {
        return 'int';
    }

    // 其他字段根据类型判断
    switch (csvType) {
        case 'int':
            // 可能为空的字段用包装类型
            if (lowerFieldName.includes('optional') ||
                lowerFieldName.includes('attack') ||
                lowerFieldName.includes('defense') ||
                lowerFieldName.includes('heal')) {
                return 'Integer';
            }
            return 'int';

        case 'float':
            // 可能为空的字段用包装类型
            if (lowerFieldName.includes('optional')) {
                return 'Double';
            }
            return 'float';

        case 'bool':
            return 'boolean';

        case 'str':
        default:
            return 'String';
    }
}

/**
 * 判断字段是否应该使用 String.intern()
 * 重复度高的字符串字段需要池化
 */
function shouldIntern(fieldName) {
    const lowerFieldName = fieldName.toLowerCase();

    // 以下字段通常重复度高，需要intern
    const internFields = [
        'type', 'rarity', 'quality', 'category',
        'grade', 'rank', 'status', 'state'
    ];

    return internFields.some(field => lowerFieldName.includes(field));
}

/**
 * 处理单个CSV文件
 */
function processCSVFile(csvFilePath) {
    const fileName = path.basename(csvFilePath, '.csv');

    console.log(`\n处理文件: ${fileName}.csv`);

    try {
        // 解析CSV
        const data = parseCSV(csvFilePath);

        if (data.fields.length === 0) {
            console.warn(`  ⚠ 警告: 没有标记为's'或'cs'的字段，跳过该表`);
            return false;
        }

        console.log(`  - 提取到 ${data.fields.length} 个服务器字段`);
        console.log(`  - 解析到 ${data.dataRows.length} 条数据`);

        // 生成JSON
        generateJSON(fileName, data);

        // 生成Java类
        generateJavaClass(fileName, data);

        return true;
    } catch (error) {
        console.error(`✗ 处理失败: ${error.message}`);
        return false;
    }
}

/**
 * 主函数
 */
function main() {
    console.log('=== 服务器端配置导出工具 ===');
    console.log('版本: 2.0.0');
    console.log('对接系统: ConfigManager + JsonTableLoader\n');

    // 检查CSV目录
    if (!fs.existsSync(CONFIG.csvDir)) {
        console.error(`错误: CSV目录不存在: ${CONFIG.csvDir}`);
        process.exit(1);
    }

    // 获取所有CSV文件
    const csvFiles = fs.readdirSync(CONFIG.csvDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => path.join(CONFIG.csvDir, file));

    if (csvFiles.length === 0) {
        console.log('没有找到CSV文件');
        return;
    }

    console.log(`找到 ${csvFiles.length} 个CSV文件\n`);

    // 处理每个CSV文件
    let successCount = 0;
    let failCount = 0;

    csvFiles.forEach(csvFile => {
        if (processCSVFile(csvFile)) {
            successCount++;
        } else {
            failCount++;
        }
    });

    // 输出统计
    console.log('\n=== 导出完成 ===');
    console.log(`成功: ${successCount} 个`);
    console.log(`失败: ${failCount} 个`);

    // 输出相对路径
    const relativeJsonPath = path.relative(process.cwd(), CONFIG.jsonOutputDir);
    const relativeJavaPath = path.relative(process.cwd(), CONFIG.javaOutputDir);

    console.log(`\nJSON输出目录: ${relativeJsonPath}`);
    console.log(`Java输出目录: ${relativeJavaPath}`);

    console.log('\n提示:');
    console.log('  1. JSON文件路径（配置到application.properties）:');
    console.log(`     laya.game.config.tables-path=file:${relativeJsonPath.replace(/\\/g, '/')}/`);
    console.log('  2. ConfigManager会自动扫描并加载 configStruct 包下的配置类');
    console.log('  3. 类名映射规则: TestConfig → Test.json');
}

// 运行主函数
if (require.main === module) {
    main();
}

module.exports = { parseCSV, generateJSON, generateJavaClass };
