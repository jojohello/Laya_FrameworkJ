const assert = require('assert');
const { validateSchema, validateValue, generateJava, generateTypeScript } = require('./generate-contracts');

const schema = {
    schemaVersion: 1,
    feature: 'sample',
    targets: ['client', 'game'],
    clientModule: 'sample',
    definitions: {
        SampleKind: {
            type: 'string',
            enum: ['primary', 'secondary']
        },
        Sample: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'version', 'kind'],
            properties: {
                id: { type: 'integer', minimum: 1, maximum: 10, javaType: 'int' },
                version: { type: 'string', pattern: '^(0|[1-9]\\d*)$' },
                kind: { $ref: 'SampleKind' },
                note: { type: 'string', minLength: 1 }
            },
            rules: [{ when: { field: 'id', equals: 1 }, required: ['note'] }]
        }
    },
    fixtures: { 'sample.json': 'Sample' },
    bindings: [{ message: 'ERROR', path: '$', type: 'Sample' }]
};

validateSchema(schema, 'sample-schema');
validateValue({ id: 1, version: '0', kind: 'primary', note: 'ok' }, schema.definitions.Sample, schema, 'sample');
assert.throws(() => validateValue({ id: 0, version: '0', kind: 'primary' }, schema.definitions.Sample, schema, 'sample'), /minimum/);
assert.throws(() => validateValue({ id: 1, version: '01', kind: 'primary' }, schema.definitions.Sample, schema, 'sample'), /pattern/);
assert.throws(() => validateValue({ id: 1, version: '0', kind: 'primary', extra: true }, schema.definitions.Sample, schema, 'sample'), /unexpected/);
assert.throws(() => validateValue({ id: 1, version: '0', kind: 'primary' }, schema.definitions.Sample, schema, 'sample'), /requires note/);
assert.throws(() => validateValue({ id: 2, version: '0', kind: 'unknown' }, schema.definitions.Sample, schema, 'sample'), /enum/);
assert.match(generateJava(schema), /enum SampleKind/);
assert.match(generateJava(schema), /record Sample\(int id, String version, SampleKind kind, String note\)/);
assert.match(generateTypeScript(schema), /export enum SampleKind/);
assert.match(generateTypeScript(schema), /export function isSample/);

const gatewaySchema = {
    ...schema,
    targets: ['gateway'],
    clientModule: undefined,
    bindings: [{ message: 'AUTH', path: '$', type: 'Sample' }]
};
validateSchema(gatewaySchema, 'gateway-schema');
assert.match(generateJava(gatewaySchema, 'test.gateway.payload'), /^package test\.gateway\.payload;/);

console.log('Contract generator tests passed.');
