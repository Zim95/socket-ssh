/*
    remotetunelling.md Phase 7 / Required tests (socket-ssh): "Missing authentication message
    times out." A separate file from server.test.js because AUTH_TIMEOUT_MS is read into a
    module-level constant at require-time (same reason authenticate.test.js needs
    jest.resetModules() per test) - this file sets it short BEFORE requiring server.js so the
    test doesn't need a real 5s wait, then requires the real (un-mocked) ws client to observe the
    actual close code/reason server.js sends.
*/
process.env.AUTH_TIMEOUT_MS = '200';
// A dedicated port, distinct from server.test.js's 8000 - Jest can run separate test files in
// parallel workers, and two real servers can't both bind the same port at once.
process.env.PORT = '8001';

const WebSocket = require('ws');

jest.mock('ssh2', () => ({ Client: require('./__mocks__/mock.ssh2') }));
jest.mock('../src/authenticate');

let server;

beforeAll(() => {
    server = require('../server');
});

afterAll((done) => {
    server.close(() => done());
});

test('a connection that never sends an authenticate message is closed once AUTH_TIMEOUT_MS elapses', (done) => {
    const ws = new WebSocket('ws://localhost:8001', { headers: { Origin: 'http://localhost:9999' } });
    const openedAt = Date.now();

    ws.on('message', () => done(new Error('Should never receive a message without authenticating')));
    ws.on('close', (code) => {
        try {
            expect(code).toEqual(4401);
            expect(Date.now() - openedAt).toBeGreaterThanOrEqual(190);  // small slack for scheduler jitter
            done();
        } catch (err) {
            done(err);
        }
    });
    ws.on('error', (err) => done(err));
});
