// test/my-handler.test.ts
import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { calculateSha256Digest, createMockReq, createMockRes } from './utils';
import Router from '../src/router';

const test = suite('HTTP Router');

const currentWorkingDirectory = process.cwd();

const router = new Router({
    'my-repo-webhook': {
        url: '/first-project',
        commands: [ 'echo \"Hello\"' ],
        directory: currentWorkingDirectory,
        delay: 0
    },
    'full-of-errors': {
        url: '/error-maker',
        commands: [ 'some-inexistent-command' ],
        directory: currentWorkingDirectory,
        delay: 0
    },
    'secured-webhook': {
        url: '/secured-project',
        commands: [ 'echo \"Hello\"' ],
        secret: 'mysupersecret',
        directory: currentWorkingDirectory,
        delay: 0
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
    const body = JSON.stringify({message: 'hello-there!'});
    const req = createMockReq({
        method: 'GET',
        url: '/ping'
    });
    const res = createMockRes();
    await router.route(req, res);

    assert.is(res._statusCode, 200);
    assert.is(res._data, 'pong');
});




test.run();
