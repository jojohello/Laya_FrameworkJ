#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const repoRoot = path.resolve(__dirname, '..', '..');
const contractsRoot = path.join(repoRoot, 'Protocol', 'contracts');
const checkOnly = process.argv.includes('--check');

function fail(message) {
    throw new Error(message);
}

function pascalCase(value) {
    return value.split(/[^A-Za-z0-9]+/).filter(Boolean)
        .map(part => part[0].toUpperCase() + part.slice(1)).join('');
}

function loadSchemas() {
    if (!fs.existsSync(contractsRoot)) return [];
    return fs.readdirSync(contractsRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(contractsRoot, entry.name, 'schema.json'))
        .filter(file => fs.existsSync(file))
        .map(file => ({ file, schema: JSON.parse(fs.readFileSync(file, 'utf8')) }));
}

function validateSchema(schema, file) {
    const allowedRoot = new Set(['schemaVersion', 'feature', 'targets', 'clientModule', 'startModule', 'definitions', 'fixtures', 'bindings', 'httpBindings']);
    for (const key of Object.keys(schema)) if (!allowedRoot.has(key)) fail(`${file}: unsupported root key ${key}`);
    if (schema.schemaVersion !== 1) fail(`${file}: schemaVersion must be 1`);
    if (!/^[a-z][a-z0-9-]*$/.test(schema.feature || '')) fail(`${file}: invalid feature`);
    if (!Array.isArray(schema.targets) || schema.targets.length === 0) fail(`${file}: targets required`);
    for (const target of schema.targets) if (!['client', 'start', 'game', 'gateway', 'login'].includes(target)) fail(`${file}: unsupported target ${target}`);
    if (schema.targets.includes('client') && !/^[a-z][A-Za-z0-9]*$/.test(schema.clientModule || '')) fail(`${file}: clientModule required`);
    if (schema.targets.includes('start') && !/^[a-z][A-Za-z0-9]*$/.test(schema.startModule || '')) fail(`${file}: startModule required`);
    if (!schema.definitions || typeof schema.definitions !== 'object') fail(`${file}: definitions required`);
    for (const [name, definition] of Object.entries(schema.definitions)) {
        if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) fail(`${file}: invalid definition name ${name}`);
        validateNode(definition, schema, `${file}#/definitions/${name}`, true);
    }
    if (!schema.fixtures || typeof schema.fixtures !== 'object') fail(`${file}: fixtures required`);
    for (const [fixture, type] of Object.entries(schema.fixtures)) {
        if (!schema.definitions[type]) fail(`${file}: fixture ${fixture} references unknown ${type}`);
    }
    const messageConfig = yaml.load(fs.readFileSync(path.join(repoRoot, 'Protocol', 'message-ids.yaml'), 'utf8'));
    const bindings = schema.bindings || [];
    const httpBindings = schema.httpBindings || [];
    if (!Array.isArray(bindings)) fail(`${file}: bindings must be an array`);
    if (!Array.isArray(httpBindings)) fail(`${file}: httpBindings must be an array`);
    if (bindings.length === 0 && httpBindings.length === 0) fail(`${file}: bindings or httpBindings required`);
    for (const [index, binding] of bindings.entries()) {
        const keys = new Set(['message', 'path', 'type']);
        for (const key of Object.keys(binding)) if (!keys.has(key)) fail(`${file}: binding ${index} unsupported key ${key}`);
        if (!messageConfig[binding.message]) fail(`${file}: binding ${index} unknown message ${binding.message}`);
        const scope = messageConfig[binding.message].scope;
        if (scope === 'game' && !schema.targets.includes('game')) fail(`${file}: binding ${index} requires game target`);
        if (scope === 'gateway' && !schema.targets.includes('gateway')) fail(`${file}: binding ${index} requires gateway target`);
        if (typeof binding.path !== 'string' || !binding.path) fail(`${file}: binding ${index} path required`);
        if (!schema.definitions[binding.type]) fail(`${file}: binding ${index} unknown type ${binding.type}`);
    }
    for (const [index, binding] of httpBindings.entries()) {
        const keys = new Set(['method', 'path', 'request', 'response']);
        for (const key of Object.keys(binding)) if (!keys.has(key)) fail(`${file}: httpBinding ${index} unsupported key ${key}`);
        if (!['GET', 'POST', 'PUT', 'DELETE'].includes(binding.method)) fail(`${file}: httpBinding ${index} invalid method`);
        if (typeof binding.path !== 'string' || !binding.path.startsWith('/')) fail(`${file}: httpBinding ${index} invalid path`);
        if (!schema.definitions[binding.request]) fail(`${file}: httpBinding ${index} unknown request ${binding.request}`);
        if (!schema.definitions[binding.response]) fail(`${file}: httpBinding ${index} unknown response ${binding.response}`);
    }
}

function validateNode(node, schema, location, definition = false) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) fail(`${location}: node must be an object`);
    if (node.$ref) {
        if (Object.keys(node).length !== 1) fail(`${location}: $ref cannot have siblings`);
        if (!schema.definitions[node.$ref]) fail(`${location}: unknown ref ${node.$ref}`);
        return;
    }
    const allowed = new Set(['type', 'additionalProperties', 'required', 'properties', 'items',
        'minimum', 'maximum', 'not', 'pattern', 'minItems', 'minLength', 'maxLength', 'javaType', 'rules', 'enum']);
    for (const key of Object.keys(node)) if (!allowed.has(key)) fail(`${location}: unsupported keyword ${key}`);
    if (!['object', 'array', 'string', 'integer', 'boolean'].includes(node.type)) fail(`${location}: unsupported type`);
    if (definition && node.type !== 'object' && !(node.type === 'string' && Array.isArray(node.enum))) {
        fail(`${location}: top-level definitions must be objects or string enums`);
    }
    if (node.enum !== undefined) {
        if (node.type !== 'string' || !Array.isArray(node.enum) || node.enum.length === 0) {
            fail(`${location}: enum must be a non-empty string enum`);
        }
        const values = new Set();
        for (const value of node.enum) {
            if (typeof value !== 'string' || !/^[a-z][a-z0-9_]*$/.test(value)) fail(`${location}: invalid enum value ${value}`);
            if (values.has(value)) fail(`${location}: duplicate enum value ${value}`);
            values.add(value);
        }
    }
    if (node.type === 'object') {
        if (node.additionalProperties !== false) fail(`${location}: additionalProperties must be false`);
        if (!node.properties || typeof node.properties !== 'object') fail(`${location}: properties required`);
        const required = new Set(node.required || []);
        for (const field of required) if (!Object.hasOwn(node.properties, field)) fail(`${location}: unknown required field ${field}`);
        for (const [field, child] of Object.entries(node.properties)) {
            if (!/^[a-z][A-Za-z0-9]*$/.test(field)) fail(`${location}: invalid field ${field}`);
            validateNode(child, schema, `${location}/properties/${field}`);
        }
        for (const [index, rule] of (node.rules || []).entries()) {
            const ruleKeys = new Set(['when', 'required', 'forbidden']);
            for (const key of Object.keys(rule)) if (!ruleKeys.has(key)) fail(`${location}/rules/${index}: unsupported key ${key}`);
            if (!rule.when || !Object.hasOwn(node.properties, rule.when.field) || !Object.hasOwn(rule.when, 'equals')) {
                fail(`${location}/rules/${index}: invalid when`);
            }
            if (Object.keys(rule.when).some(key => !['field', 'equals'].includes(key))) fail(`${location}/rules/${index}: unsupported when key`);
            if ((rule.required || []).length + (rule.forbidden || []).length === 0) fail(`${location}/rules/${index}: empty rule`);
            for (const field of [...(rule.required || []), ...(rule.forbidden || [])]) {
                if (!Object.hasOwn(node.properties, field)) fail(`${location}/rules/${index}: unknown field ${field}`);
            }
        }
    }
    if (node.type === 'array') {
        if (!node.items) fail(`${location}: array items required`);
        validateNode(node.items, schema, `${location}/items`);
    }
    if (node.type === 'integer' && !['int', 'long'].includes(node.javaType)) fail(`${location}: integer javaType required`);
}

function javaType(node) {
    if (node.$ref) return node.$ref;
    if (node.type === 'array') return `List<${javaType(node.items)}>`;
    if (node.type === 'string') return 'String';
    if (node.type === 'boolean') return 'boolean';
    if (node.type === 'integer') return node.javaType;
    fail(`unsupported Java node ${JSON.stringify(node)}`);
}

function tsType(node) {
    if (node.$ref) return node.$ref;
    if (node.type === 'array') return `${tsType(node.items)}[]`;
    if (node.type === 'string') return 'string';
    if (node.type === 'boolean') return 'boolean';
    if (node.type === 'integer') return 'number';
    fail(`unsupported TypeScript node ${JSON.stringify(node)}`);
}

function generateJava(schema, packageName = `com.laya.game.game.protocol.payload.${schema.feature.replace(/-/g, '')}`) {
    const featureClass = `${pascalCase(schema.feature)}Payloads`;
    let code = `package ${packageName};\n\n`
        + `import com.fasterxml.jackson.annotation.JsonCreator;\nimport com.fasterxml.jackson.annotation.JsonInclude;\nimport com.fasterxml.jackson.annotation.JsonValue;\nimport java.util.List;\n\n`
        + `/** Generated from Protocol/contracts/${schema.feature}/schema.json. Do not edit. */\n`
        + `public final class ${featureClass} {\n    private ${featureClass}() {}\n\n`;
    for (const [name, definition] of Object.entries(schema.definitions)) {
        if (definition.type === 'string' && definition.enum) {
            const constants = definition.enum.map(value => `        ${pascalCase(value).replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()}("${value}")`).join(',\n');
            code += `    public enum ${name} {\n${constants};\n\n`
                + `        private final String wireValue;\n\n`
                + `        ${name}(String wireValue) { this.wireValue = wireValue; }\n\n`
                + `        @JsonValue\n        public String wireValue() { return wireValue; }\n\n`
                + `        @JsonCreator\n        public static ${name} fromWire(String value) {\n`
                + `            for (${name} candidate : values()) {\n`
                + `                if (candidate.wireValue.equals(value)) return candidate;\n`
                + `            }\n`
                + `            throw new IllegalArgumentException("unknown ${name}: " + value);\n`
                + `        }\n    }\n\n`;
            continue;
        }
        const required = new Set(definition.required || []);
        const fields = Object.entries(definition.properties).map(([field, node]) => {
            let type = javaType(node);
            if (!required.has(field) && type === 'boolean') type = 'Boolean';
            if (!required.has(field) && type === 'int') type = 'Integer';
            if (!required.has(field) && type === 'long') type = 'Long';
            return `${type} ${field}`;
        });
        code += `    @JsonInclude(JsonInclude.Include.NON_NULL)\n`
            + `    public record ${name}(${fields.join(', ')}) {}\n\n`;
    }
    return code + '}\n';
}

function tsCheck(node, expression) {
    if (node.$ref) return `is${node.$ref}(${expression})`;
    if (node.type === 'boolean') return `typeof ${expression} === "boolean"`;
    if (node.type === 'string') {
        const checks = [`typeof ${expression} === "string"`];
        if (node.enum) checks.push(`${JSON.stringify(node.enum)}.includes(${expression})`);
        if (node.minLength !== undefined) checks.push(`${expression}.length >= ${node.minLength}`);
        if (node.maxLength !== undefined) checks.push(`${expression}.length <= ${node.maxLength}`);
        if (node.pattern) checks.push(`new RegExp(${JSON.stringify(node.pattern)}).test(${expression})`);
        return checks.join(' && ');
    }
    if (node.type === 'integer') {
        const checks = [`Number.isSafeInteger(${expression})`];
        if (node.minimum !== undefined) checks.push(`${expression} >= ${node.minimum}`);
        if (node.maximum !== undefined) checks.push(`${expression} <= ${node.maximum}`);
        if (node.not !== undefined) checks.push(`${expression} !== ${node.not}`);
        return checks.join(' && ');
    }
    if (node.type === 'array') return `Array.isArray(${expression})${node.minItems ? ` && ${expression}.length >= ${node.minItems}` : ''} && ${expression}.every(item => ${tsCheck(node.items, 'item')})`;
    fail(`unsupported validator node ${JSON.stringify(node)}`);
}

function generateTypeScript(schema) {
    let code = `/** Generated from Protocol/contracts/${schema.feature}/schema.json. Do not edit. */\n\n`
        + `function isRecord(value: unknown): value is Record<string, any> {\n`
        + `    return typeof value === "object" && value !== null && !Array.isArray(value);\n}\n\n`
        + `function hasOnlyKeys(value: Record<string, any>, keys: readonly string[]): boolean {\n`
        + `    return Object.keys(value).every(key => keys.includes(key));\n}\n\n`;
    for (const [name, definition] of Object.entries(schema.definitions)) {
        if (definition.type === 'string' && definition.enum) {
            code += `export enum ${name} {\n`;
            for (const value of definition.enum) code += `    ${pascalCase(value)} = ${JSON.stringify(value)},\n`;
            code += `}\n\n`;
            code += `export function is${name}(value: unknown): value is ${name} {\n`
                + `    return typeof value === "string" && ${JSON.stringify(definition.enum)}.includes(value);\n}\n\n`;
            continue;
        }
        const required = new Set(definition.required || []);
        code += `export interface ${name} {\n`;
        for (const [field, node] of Object.entries(definition.properties)) {
            code += `    ${field}${required.has(field) ? '' : '?'}: ${tsType(node)};\n`;
        }
        code += `}\n\n`;
        const keys = JSON.stringify(Object.keys(definition.properties));
        const checks = [`isRecord(value)`, `hasOnlyKeys(value, ${keys})`];
        for (const [field, node] of Object.entries(definition.properties)) {
            const check = tsCheck(node, `value.${field}`);
            checks.push(required.has(field) ? check : `(value.${field} === undefined || (${check}))`);
        }
        for (const rule of definition.rules || []) {
            const consequences = [
                ...(rule.required || []).map(field => `value.${field} !== undefined`),
                ...(rule.forbidden || []).map(field => `value.${field} === undefined`)
            ];
            checks.push(`(value.${rule.when.field} !== ${JSON.stringify(rule.when.equals)} || (${consequences.join(' && ')}))`);
        }
        code += `export function is${name}(value: unknown): value is ${name} {\n`
            + `    return ${checks.join('\n        && ')};\n}\n\n`;
    }
    return code;
}

function validateValue(value, node, schema, location) {
    if (node.$ref) return validateValue(value, schema.definitions[node.$ref], schema, location);
    if (node.type === 'object') {
        if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${location}: expected object`);
        const allowed = new Set(Object.keys(node.properties));
        for (const key of Object.keys(value)) if (!allowed.has(key)) fail(`${location}: unexpected field ${key}`);
        for (const field of node.required || []) if (!Object.hasOwn(value, field)) fail(`${location}: missing ${field}`);
        for (const [field, child] of Object.entries(node.properties)) {
            if (Object.hasOwn(value, field)) validateValue(value[field], child, schema, `${location}.${field}`);
        }
        for (const rule of node.rules || []) {
            if (value[rule.when.field] !== rule.when.equals) continue;
            for (const field of rule.required || []) if (!Object.hasOwn(value, field)) fail(`${location}: rule requires ${field}`);
            for (const field of rule.forbidden || []) if (Object.hasOwn(value, field)) fail(`${location}: rule forbids ${field}`);
        }
        return;
    }
    if (node.type === 'array') {
        if (!Array.isArray(value)) fail(`${location}: expected array`);
        if (node.minItems !== undefined && value.length < node.minItems) fail(`${location}: too few items`);
        value.forEach((item, index) => validateValue(item, node.items, schema, `${location}[${index}]`));
        return;
    }
    if (node.type === 'string') {
        if (typeof value !== 'string') fail(`${location}: expected string`);
        if (node.enum && !node.enum.includes(value)) fail(`${location}: unknown enum value`);
        if (node.minLength !== undefined && value.length < node.minLength) fail(`${location}: string too short`);
        if (node.maxLength !== undefined && value.length > node.maxLength) fail(`${location}: string too long`);
        if (node.pattern && !new RegExp(node.pattern).test(value)) fail(`${location}: pattern mismatch`);
        return;
    }
    if (node.type === 'boolean' && typeof value !== 'boolean') fail(`${location}: expected boolean`);
    if (node.type === 'integer') {
        if (!Number.isSafeInteger(value)) fail(`${location}: expected safe integer`);
        if (node.minimum !== undefined && value < node.minimum) fail(`${location}: below minimum`);
        if (node.maximum !== undefined && value > node.maximum) fail(`${location}: above maximum`);
        if (node.not !== undefined && value === node.not) fail(`${location}: forbidden value`);
    }
}

function validateFixtures(schema, schemaFile) {
    const fixtureRoot = path.dirname(schemaFile);
    for (const [fixture, type] of Object.entries(schema.fixtures)) {
        const file = path.join(fixtureRoot, 'fixtures', fixture);
        if (!fs.existsSync(file)) fail(`${schemaFile}: missing fixture ${fixture}`);
        validateValue(JSON.parse(fs.readFileSync(file, 'utf8')), schema.definitions[type], schema, fixture);
    }
}

function outputsFor(schema) {
    const className = `${pascalCase(schema.feature)}Payloads`;
    const ts = generateTypeScript(schema);
    const outputs = [];
    if (schema.targets.includes('game')) {
        const java = generateJava(schema);
        outputs.push({
            file: path.join(repoRoot, 'Sever', 'game-server', 'src', 'main', 'java', 'com', 'laya', 'game', 'game', 'protocol', 'payload', schema.feature.replace(/-/g, ''), `${className}.java`),
            content: java
        });
        outputs.push({ file: path.join(repoRoot, 'Protocol', 'generated', 'java', 'contracts', schema.feature, 'game', `${className}.java`), content: java });
    }
    if (schema.targets.includes('gateway')) {
        const packageName = `com.laya.game.gateway.protocol.payload.${schema.feature.replace(/-/g, '')}`;
        const java = generateJava(schema, packageName);
        outputs.push({
            file: path.join(repoRoot, 'Sever', 'gateway-server', 'src', 'main', 'java', 'com', 'laya', 'game', 'gateway', 'protocol', 'payload', schema.feature.replace(/-/g, ''), `${className}.java`),
            content: java
        });
        outputs.push({ file: path.join(repoRoot, 'Protocol', 'generated', 'java', 'contracts', schema.feature, 'gateway', `${className}.java`), content: java });
    }
    if (schema.targets.includes('login')) {
        const packageName = `com.jojohello_laya.login.protocol.payload.${schema.feature.replace(/-/g, '')}`;
        const java = generateJava(schema, packageName);
        outputs.push({
            file: path.join(repoRoot, 'Sever', 'login-server', 'src', 'main', 'java', 'com', 'jojohello_laya', 'login', 'protocol', 'payload', schema.feature.replace(/-/g, ''), `${className}.java`),
            content: java
        });
        outputs.push({ file: path.join(repoRoot, 'Protocol', 'generated', 'java', 'contracts', schema.feature, 'login', `${className}.java`), content: java });
    }
    if (schema.targets.includes('client')) {
        outputs.push({ file: path.join(repoRoot, 'Client', 'LayaProject', 'src', 'logic', schema.clientModule, `${className}.generated.ts`), content: ts });
    }
    if (schema.targets.includes('start')) {
        outputs.push({ file: path.join(repoRoot, 'Client', 'LayaProject', 'src', 'start', schema.startModule, `${className}.generated.ts`), content: ts });
    }
    if (schema.targets.includes('client') || schema.targets.includes('start')) {
        outputs.push({ file: path.join(repoRoot, 'Protocol', 'generated', 'typescript', 'contracts', schema.feature, `${className}.ts`), content: ts });
    }
    return outputs;
}

function writeOrCheck(output) {
    if (checkOnly) {
        if (!fs.existsSync(output.file) || fs.readFileSync(output.file, 'utf8') !== output.content) {
            fail(`generated contract drift: ${path.relative(repoRoot, output.file)}`);
        }
        return;
    }
    fs.mkdirSync(path.dirname(output.file), { recursive: true });
    fs.writeFileSync(output.file, output.content, 'utf8');
    console.log(`generated ${path.relative(repoRoot, output.file)}`);
}

function main() {
    const schemas = loadSchemas();
    if (schemas.length === 0) fail('no contract schemas found');
    for (const { file, schema } of schemas) {
        validateSchema(schema, file);
        validateFixtures(schema, file);
        outputsFor(schema).forEach(writeOrCheck);
    }
    console.log(`Contract schema ${checkOnly ? 'check' : 'generation'} passed (${schemas.length} feature(s)).`);
}

if (require.main === module) {
    try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}

module.exports = { validateSchema, validateValue, generateJava, generateTypeScript };
