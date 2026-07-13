#!/usr/bin/env node

/**
 * Laya Game Protocol Code Generator
 *
 * 从 message-ids.yaml 生成 Java 和 TypeScript 代码
 *
 * 使用方法：
 *   node generate.js
 *   npm run generate
 *
 * @author Laya Game Server Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// ========== 配置 ==========
const CONFIG = {
    yamlFile: path.join(__dirname, '..', 'message-ids.yaml'),
    javaOutput: path.join(__dirname, '..', 'generated', 'java', 'MessageIds.java'),
    // TypeScript 输出位置：直接输出到 Logic 包
    tsOutput: path.join(__dirname, '..', '..', 'Client', 'LayaProject', 'src', 'logic', 'common', 'MessageIds.ts'),
    // 备份位置（generated 目录，用于对比）
    tsBackup: path.join(__dirname, '..', 'generated', 'typescript', 'MessageIds.ts'),
    javaPackage: 'com.laya.game.protocol',
};

// ========== 主函数 ==========
function main() {
    console.log('🚀 Laya Protocol Code Generator');
    console.log('================================\n');

    try {
        // 1. 读取 YAML 文件
        console.log('📖 读取配置文件:', CONFIG.yamlFile);
        const yamlContent = fs.readFileSync(CONFIG.yamlFile, 'utf8');
        const config = yaml.load(yamlContent);

        // 2. 解析消息定义
        console.log('✅ 解析成功');
        const messages = parseMessages(config);
        console.log(`📝 找到 ${messages.length} 个消息定义\n`);

        // 3. 生成 Java 代码
        console.log('🔨 生成 Java 代码...');
        const javaCode = generateJavaCode(messages, config.version);
        fs.mkdirSync(path.dirname(CONFIG.javaOutput), { recursive: true });
        fs.writeFileSync(CONFIG.javaOutput, javaCode, 'utf8');
        console.log('✅ 生成完成:', CONFIG.javaOutput);

        // 4. 生成 TypeScript 代码
        console.log('🔨 生成 TypeScript 代码...');
        const tsCode = generateTypeScriptCode(messages, config.version);

        // 输出到 Logic 包
        fs.mkdirSync(path.dirname(CONFIG.tsOutput), { recursive: true });
        fs.writeFileSync(CONFIG.tsOutput, tsCode, 'utf8');
        console.log('✅ 生成完成（Logic 包）:', CONFIG.tsOutput);

        // 备份到 generated 目录
        fs.mkdirSync(path.dirname(CONFIG.tsBackup), { recursive: true });
        fs.writeFileSync(CONFIG.tsBackup, tsCode, 'utf8');
        console.log('✅ 备份完成:', CONFIG.tsBackup);

        console.log('\n================================');
        console.log('🎉 代码生成成功！');
        console.log('\n📋 生成的文件：');
        console.log('  1. Java:', CONFIG.javaOutput);
        console.log('  2. TypeScript (Logic 包):', CONFIG.tsOutput);
        console.log('  3. TypeScript (备份):', CONFIG.tsBackup);
        console.log('\n⚠️ 注意：');
        console.log('  如果修改了 101-199 范围内的消息ID（Start包硬编码），');
        console.log('  必须同步更新: Client/LayaProject/src/start/login/LoginProtocol.ts');
        console.log('\n  当前硬编码的消息：');
        console.log('    - LOGIN (101)');
        console.log('    - LOGIN_SUCCESS (102)');
        console.log('    - LOGIN_FAILED (103)');

    } catch (error) {
        console.error('❌ 错误:', error.message);
        process.exit(1);
    }
}

// ========== 解析消息定义 ==========
function parseMessages(config) {
    const messages = [];
    const entries = Object.entries(config);

    for (const [key, value] of entries) {
        // 跳过 version 等元数据字段
        if (key === 'version' || key.startsWith('_')) {
            continue;
        }

        // 验证消息ID
        if (typeof value !== 'number') {
            throw new Error(`消息 "${key}" 的ID必须是数字，当前值: ${value}`);
        }

        if (value < 0 || value > 65535) {
            throw new Error(`消息 "${key}" 的ID必须在 0-65535 范围内，当前值: ${value}`);
        }

        messages.push({
            name: key,
            id: value
        });
    }

    // 按ID排序
    messages.sort((a, b) => a.id - b.id);

    // 检查ID重复
    const ids = new Set();
    for (const msg of messages) {
        if (ids.has(msg.id)) {
            throw new Error(`消息ID重复: ${msg.id}`);
        }
        ids.add(msg.id);
    }

    return messages;
}

// ========== 生成 Java 代码 ==========
function generateJavaCode(messages, version) {
    const timestamp = new Date().toISOString().split('T')[0];

    let code = `package ${CONFIG.javaPackage};

/**
 * 消息ID定义
 *
 * ⚠️ 此文件由 Protocol/message-ids.yaml 自动生成
 * ⚠️ 请勿手动修改，修改请编辑 message-ids.yaml 后重新生成
 *
 * @generated ${timestamp}
 * @version ${version}
 */
public class MessageIds {

`;

    // 按分类分组
    const groups = groupMessagesByCategory(messages);

    for (const [category, msgs] of Object.entries(groups)) {
        code += `    // ========== ${category} ==========\n`;
        for (const msg of msgs) {
            code += `    public static final short ${msg.name} = ${msg.id};\n`;
        }
        code += '\n';
    }

    code += `    // 私有构造函数（工具类）
    private MessageIds() {}

    /**
     * 根据ID获取消息名称（用于日志）
     *
     * @param id 消息ID
     * @return 消息名称，如果未找到返回 "UNKNOWN(id)"
     */
    public static String getName(short id) {
        switch (id) {
`;

    for (const msg of messages) {
        code += `            case ${msg.id}: return "${msg.name}";\n`;
    }

    code += `            default: return "UNKNOWN(" + id + ")";
        }
    }
}
`;

    return code;
}

// ========== 生成 TypeScript 代码 ==========
function generateTypeScriptCode(messages, version) {
    const timestamp = new Date().toISOString().split('T')[0];

    let code = `/**
 * 消息ID定义
 *
 * ⚠️ 此文件由 Protocol/message-ids.yaml 自动生成
 * ⚠️ 请勿手动修改，修改请编辑 message-ids.yaml 后重新生成
 *
 * @generated ${timestamp}
 * @version ${version}
 */

`;

    // 按分类分组
    const groups = groupMessagesByCategory(messages);

    // 导出常量
    for (const [category, msgs] of Object.entries(groups)) {
        code += `// ========== ${category} ==========\n`;
        for (const msg of msgs) {
            code += `export const ${msg.name} = ${msg.id};\n`;
        }
        code += '\n';
    }

    // 导出对象
    code += `/**
 * 所有消息ID（用于类型检查和遍历）
 */
export const MessageIds = {
`;

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        code += `    ${msg.name}`;
        if (i < messages.length - 1) {
            code += ',';
        }
        code += '\n';
    }

    code += `} as const;

/**
 * 消息ID类型
 */
export type MessageId = typeof MessageIds[keyof typeof MessageIds];

/**
 * 根据ID获取消息名称（用于日志）
 *
 * @param id 消息ID
 * @returns 消息名称，如果未找到返回 "UNKNOWN(id)"
 */
export function getMessageName(id: number): string {
    switch (id) {
`;

    for (const msg of messages) {
        code += `        case ${msg.id}: return "${msg.name}";\n`;
    }

    code += `        default: return \`UNKNOWN(\${id})\`;
    }
}

/**
 * 根据消息名称获取ID（用于解析服务器消息）
 *
 * @param name 消息名称
 * @returns 消息ID，如果未找到返回 null
 */
export function getMessageId(name: string): number | null {
    switch (name) {
`;

    for (const msg of messages) {
        code += `        case "${msg.name}": return ${msg.id};\n`;
    }

    code += `        default: return null;
    }
}

/**
 * 检查是否是有效的消息ID
 *
 * @param id 消息ID
 * @returns 是否有效
 */
export function isValidMessageId(id: number): boolean {
    return getMessageName(id) !== \`UNKNOWN(\${id})\`;
}
`;

    return code;
}

// ========== 按分类分组消息 ==========
function groupMessagesByCategory(messages) {
    const groups = {
        'Start包硬编码消息 (101-199)': [],
        '认证类 (1xxx)': [],
        '心跳类 (2xxx)': [],
        '游戏逻辑类 (3xxx)': [],
        '背包类 (5xxx)': [],
        '系统类 (9xxx)': [],
        '其他': []
    };

    for (const msg of messages) {
        const id = msg.id;
        if (id >= 101 && id < 200) {
            groups['Start包硬编码消息 (101-199)'].push(msg);
        } else if (id >= 1000 && id < 2000) {
            groups['认证类 (1xxx)'].push(msg);
        } else if (id >= 2000 && id < 3000) {
            groups['心跳类 (2xxx)'].push(msg);
        } else if (id >= 3000 && id < 5000) {
            groups['游戏逻辑类 (3xxx)'].push(msg);
        } else if (id >= 5000 && id < 9000) {
            groups['背包类 (5xxx)'].push(msg);
        } else if (id >= 9000 && id < 10000) {
            groups['系统类 (9xxx)'].push(msg);
        } else {
            groups['其他'].push(msg);
        }
    }

    // 移除空分组
    for (const [key, value] of Object.entries(groups)) {
        if (value.length === 0) {
            delete groups[key];
        }
    }

    return groups;
}

// ========== 运行 ==========
if (require.main === module) {
    main();
}

module.exports = { parseMessages, generateJavaCode, generateTypeScriptCode };
