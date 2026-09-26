/*
    Regression test for a real bug (fixed 2026-09-26): the browser reuses the same ssh_hash
    across every reconnect attempt within one terminal page session (terminalpage.js generates it
    once, not per attempt). SSHConnectHandler used to call connectToSSH() on whatever entry
    already existed for that hash, reusing the SAME ssh2.Client instance across repeated
    sshConnect messages - ssh2's Client is not designed to have .connect() called a second time on
    an already-used instance, and this reproduced live as a contradictory "Timed out while waiting
    for handshake" immediately followed by "SSH CONNECTION ESTABLISHED" then "SSH CONNECTION
    CLOSED" for one logical attempt.

    A direct unit test against RequestHandler (not the full WebSocket integration in
    server.test.js) - avoids the async message-ordering noise of a real connection lifecycle and
    just proves the two behaviors that matter: a second sshConnect for the same ssh_hash creates a
    genuinely fresh client, and tears the stale one down first.
*/
const MockSSH2Client = require('./__mocks__/mock.ssh2');
jest.mock('ssh2', () => ({ Client: require('./__mocks__/mock.ssh2') }));

const { RequestHandler } = require('../src/handler');
const RequestHashStore = require('../src/requestContext');

const SSH_TARGET = { ssh_host: 'test_host', ssh_port: 22, ssh_username: 'test_user', ssh_password: 'test_pass' };

function sendSSHConnect(requestHashStore, sshHash) {
    const clientConnection = { send: jest.fn() };
    const handler = new RequestHandler(clientConnection, JSON.stringify({
        type: 'sshConnect', data: { ssh_hash: sshHash },
    }), { requestHashStore, sshTarget: SSH_TARGET });
    handler.handle();
}

test('a second sshConnect for the same ssh_hash gets a fresh SSH client, not the reused stale one', () => {
    const connectSpy = jest.spyOn(MockSSH2Client.prototype, 'connect');
    const endSpy = jest.spyOn(MockSSH2Client.prototype, 'end');
    const requestHashStore = new RequestHashStore();
    const sshHash = 'test_hash_reconnect';

    sendSSHConnect(requestHashStore, sshHash);
    sendSSHConnect(requestHashStore, sshHash);

    expect(connectSpy).toHaveBeenCalledTimes(2);
    expect(endSpy).toHaveBeenCalledTimes(1); // the first (now-stale) client was torn down first
    // The two connect() calls landed on two DIFFERENT instances, never the same one twice.
    expect(connectSpy.mock.instances[0]).not.toBe(connectSpy.mock.instances[1]);

    connectSpy.mockRestore();
    endSpy.mockRestore();
});

test('the very first sshConnect for a hash still creates and connects a client normally', () => {
    const connectSpy = jest.spyOn(MockSSH2Client.prototype, 'connect');
    const endSpy = jest.spyOn(MockSSH2Client.prototype, 'end');
    const requestHashStore = new RequestHashStore();

    sendSSHConnect(requestHashStore, 'test_hash_first');

    expect(connectSpy).toHaveBeenCalledTimes(1);
    expect(endSpy).not.toHaveBeenCalled(); // nothing stale to tear down on a genuinely first attempt

    connectSpy.mockRestore();
    endSpy.mockRestore();
});

test('two different ssh_hash values never interfere with each other', () => {
    const connectSpy = jest.spyOn(MockSSH2Client.prototype, 'connect');
    const endSpy = jest.spyOn(MockSSH2Client.prototype, 'end');
    const requestHashStore = new RequestHashStore();

    sendSSHConnect(requestHashStore, 'hash_a');
    sendSSHConnect(requestHashStore, 'hash_b');

    expect(connectSpy).toHaveBeenCalledTimes(2);
    expect(endSpy).not.toHaveBeenCalled(); // neither is stale to the other

    connectSpy.mockRestore();
    endSpy.mockRestore();
});
