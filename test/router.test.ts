// test/my-handler.test.ts
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { calculateSha256Digest, createMockReq, createMockRes } from './utils';
import Router from '../src/router';

const test = suite('HTTP Router');

const currentWorkingDirectory = process.cwd();

type InjectionType = "none" | "pipe" | "variable"

const baseOptions = {
    directory: currentWorkingDirectory,
    injection: 'none' as InjectionType,
    injection_variable: 'ANTENNA_BODY',
    delay: 0
};

const router = new Router({
    'my-repo-webhook': {
        ...baseOptions,
        url: '/first-project',
        commands: [ 'echo \"Hello\"' ]
    },
    'full-of-errors': {
        ...baseOptions,
        url: '/error-maker',
        commands: [ 'some-inexistent-command' ]
    },
    'secured-webhook': {
        ...baseOptions,
        url: '/secured-project',
        commands: [ 'echo \"Hello\"' ],
        secret: 'mysupersecret'
    },
    'webhook-that-prints': {
        ...baseOptions,
        url: '/print-body',
        commands: ['cat'],
        injection: 'pipe'
    },
    'webhook-that-prints-variable': {
        ...baseOptions,
        url: '/print-body/variable',
        commands: ['echo "$MY_VARIABLE"'],
        injection: 'variable',
        injection_variable: 'MY_VARIABLE'
    }
})

test('should respond 404 on unregistered service', async () => {
    const req = createMockReq({ method: 'POST', url: '/', headers: { "content-type": 'application/json' }, body: "null" });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._statusCode, 404);
});


test('should respond 200 on executed service', async () => {
    const req = createMockReq({ method: 'POST', url: '/first-project', headers: { "content-type": 'application/json' }, body: "null" });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._headers['content-type'], 'application/json')
    assert.is(res._statusCode, 200);
});


test('should respond 500 on crashed service', async () => {
    const req = createMockReq({ method: 'POST', url: '/error-maker', headers: { "content-type": 'application/json' }, body: "null" });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._headers['content-type'], 'application/json')
    assert.is(res._statusCode, 500);
});


test('should respond 415 on non-json request for secret service', async () => {
    const req = createMockReq({ method: 'GET', url: '/secured-project' });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._statusCode, 415);
});



test('should respond 401 on missing sha256 signature', async () => {
    const body = JSON.stringify({message: 'hello-there!'});
    const req = createMockReq({
        method: 'POST',
        url: '/secured-project',
        headers: {
            "content-type": 'application/json'
        },
        body: body
    });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._headers['content-type'], 'application/json')
    assert.is(res._statusCode, 401);
});



test('should respond 401 on invalid sha256 signature', async () => {
    const body = JSON.stringify({message: 'hello-there!'});
    const req = createMockReq({
        method: 'POST',
        url: '/secured-project',
        headers: {
            "content-type": 'application/json',
            'x-hub-signature-256': 'sha256=0123456789'
        },
        body: body
    });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._headers['content-type'], 'application/json')
    assert.is(res._statusCode, 401);
});


test('should respond 200 on valid sha256 signature', async () => {
    const body = JSON.stringify({message: 'hello-there!'});
    const req = createMockReq({
        method: 'POST',
        url: '/secured-project',
        headers: {
            "content-type": 'application/json',
            'x-hub-signature-256': calculateSha256Digest('mysupersecret', body)
        },
        body: body
    });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._headers['content-type'], 'application/json')
    assert.is(res._statusCode, 200);
});

test('should play ping-pong', async () => {
    const req = createMockReq({
        method: 'GET',
        url: '/ping'
    });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._statusCode, 200);
    assert.is(res._data, 'pong');
});


test('should return command stdout', async () => {
    const body = JSON.stringify(123);
    const req = createMockReq({
        method: 'POST',
        url: '/print-body',
        headers: {
            "content-type": 'application/json'
        },
        body: body
    });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._headers['content-type'], 'application/json')
    assert.is(res._statusCode, 200);
    assert.is(res._data, JSON.stringify({
        status: 'ok',
        message: 'task successfuly executed',
        data: [{
            command: 'cat',
            output: '123\n'
        }]
    }))
});


test('should return command stdout (variable)', async () => {
    const body = JSON.stringify(123);
    const req = createMockReq({
        method: 'POST',
        url: '/print-body/variable',
        headers: {
            "content-type": 'application/json'
        },
        body: body
    });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._headers['content-type'], 'application/json')
    assert.is(res._statusCode, 200);
    assert.is(res._data, JSON.stringify({
        status: 'ok',
        message: 'task successfuly executed',
        data: [{
            command: 'echo \"$MY_VARIABLE\"',
            output: '123\n'
        }]
    }))
});



test.run();
