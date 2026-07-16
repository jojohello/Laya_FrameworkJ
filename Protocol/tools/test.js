const assert = require('assert');
const {
    parseMessages,
    filterMessagesForScopes,
    generateJavaCode,
} = require('./generate');

const messages = parseMessages({
    version: 'test',
    AUTH: { id: 1001, scope: 'gateway' },
    LOGIN: { id: 101, scope: 'game' },
    ERROR: { id: 9001, scope: 'shared' },
});

assert.deepStrictEqual(
    filterMessagesForScopes(messages, ['gateway', 'shared']).map(message => message.name),
    ['AUTH', 'ERROR']
);
assert.deepStrictEqual(
    filterMessagesForScopes(messages, ['game', 'shared']).map(message => message.name),
    ['LOGIN', 'ERROR']
);

const gatewayJava = generateJavaCode(
    filterMessagesForScopes(messages, ['gateway', 'shared']),
    'test',
    'test.gateway',
    ['gateway', 'shared']
);
assert.match(gatewayJava, /AUTH = 1001/);
assert.doesNotMatch(gatewayJava, /LOGIN = 101/);
assert.match(gatewayJava, /isGatewayScoped/);

assert.throws(() => parseMessages({ BAD: 1 }), /\{ id, scope \}/);
assert.throws(() => parseMessages({ BAD: { id: 1, scope: 'unknown' } }), /scope/);
assert.throws(() => parseMessages({ A: { id: 1, scope: 'game' }, B: { id: 1, scope: 'gateway' } }), /重复/);

console.log('Protocol generator tests passed.');
