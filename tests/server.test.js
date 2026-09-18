/*
    This tests all our endpoints.
    We mock ssh2 module for convienience.
    To know more about the mock, check mock.ssh2.js.
    Also read Mocking Arrow Methods section in this file.
    Current Endpoints:
        - echo
        - sshConnect
        - sshSendData
        - sshClose - This needs to be added.

    remotetunelling.md Phase 7: every connection is now unauthenticated until it sends a valid
    {"type": "authenticate", "data": {"ticket": ...}} first message. src/authenticate.js's
    consumeTerminalTicket is mocked here (it talks to the real Cloud otherwise) - 'valid-ticket'
    resolves to a fixed SSH target, anything else resolves to null, mirroring what Cloud's own
    ticket-consume endpoint would do for a good vs. bad/expired/replayed ticket.
*/


const WebSocket = require('ws');
// mock the ssh2 module. We need to do this here, because we need to make sure, the mock happens before it is imported elsewhere.
jest.mock('ssh2', () => {
    return {
        Client: require('./__mocks__/mock.ssh2')  // SSH2 exports a Client class, so we need to do the same.
    }
});
jest.mock('../src/authenticate');
const { consumeTerminalTicket } = require('../src/authenticate');

const VALID_TICKET = 'valid-ticket';
const VALID_SSH_TARGET = {
    ssh_host: 'test_host', ssh_port: 22, ssh_username: 'test_username', ssh_password: 'test_password'
};

consumeTerminalTicket.mockImplementation(async (ticket) => (ticket === VALID_TICKET ? VALID_SSH_TARGET : null));

let server;

// setup
beforeAll(() => {
    server = require('../server');
});


afterAll((done) => {
    server.close(() => done());
    jest.resetAllMocks();
});


function openConnection() {
    // TLS is handled by the ingress controller in production - server.js itself is plain
    // http/ws, matching how it actually runs (see server.js's own comment on this). A plain
    // Node ws client sends no Origin header by default, but server.js's verifyClient rejects
    // any connection without one of its allowed origins, so it must be set explicitly here.
    return new WebSocket('ws://localhost:8000', { headers: { Origin: 'http://localhost:9999' } });
}

// Opens a connection, authenticates it with the given ticket, and resolves once the server's
// "ready" message arrives (or rejects/never-resolves if the server closes instead - callers that
// expect a close handle that themselves).
function authenticate(serverConnection, ticket) {
    return new Promise((resolve, reject) => {
        serverConnection.on('open', () => serverConnection.send(
            JSON.stringify({ type: 'authenticate', data: { ticket } })
        ));
        serverConnection.once('message', (message) => {
            const parsed = JSON.parse(message.toString());
            if (parsed.type === 'ready') {
                resolve();
            } else {
                reject(new Error(`Expected a ready message, got: ${message.toString()}`));
            }
        });
        serverConnection.on('error', reject);
    });
}


test('a non-authenticate first message is rejected and the connection is closed', (done) => {
    const serverConnection = openConnection();
    serverConnection.on('open', () => serverConnection.send('{"type": "echo", "data": {"message": "Hello World"}}'));
    serverConnection.on('message', () => done(new Error('Should not have received any message before authenticating')));
    serverConnection.on('close', (code) => {
        expect(code).toEqual(4401);
        done();
    });
    serverConnection.on('error', (err) => done(err));
});


test('an invalid ticket is rejected and the connection is closed', (done) => {
    const serverConnection = openConnection();
    serverConnection.on('open', () => serverConnection.send(
        JSON.stringify({ type: 'authenticate', data: { ticket: 'not-a-real-ticket' } })
    ));
    serverConnection.on('message', () => done(new Error('Should not have received any message for an invalid ticket')));
    serverConnection.on('close', (code) => {
        expect(code).toEqual(4401);
        done();
    });
    serverConnection.on('error', (err) => done(err));
});


test('on echo - Should receive the same message back once authenticated', (done) => {
    const serverConnection = openConnection();

    authenticate(serverConnection, VALID_TICKET).then(() => {
        serverConnection.send('{"type": "echo", "data": {"message": "Hello World"}}');
    }).catch(done);

    // The first message is the "ready" ack consumed by authenticate(); the second is the echo.
    let sawReady = false;
    serverConnection.on('message', (message) => {
        if (!sawReady) { sawReady = true; return; }
        try {
            expect(JSON.parse(message.toString())).toEqual({ message: 'Hello World' });
            serverConnection.close();
        } catch (err) {
            done(err);
        }
    });

    serverConnection.on('close', () => setTimeout(() => done(), 1000));
    serverConnection.on('error', (err) => done(err));
});


test('on sshConnect - the SSH target comes from the authenticated ticket, never the client', (done) => {
    /*
        The client sends no ssh_host/ssh_port/ssh_username/ssh_password at all (the schema no
        longer accepts them - see src/handler.js's SSHConnectHandler). If the connection reaches
        "SSH CONNECTION ESTABLISHED" anyway, the target necessarily came from
        VALID_SSH_TARGET (the mocked ticket's own resolved target), which is exactly the
        behavior remotetunelling.md Phase 7 requires.
    */
    const serverConnection = openConnection();

    authenticate(serverConnection, VALID_TICKET).then(() => {
        serverConnection.send(
            JSON.stringify({ type: 'sshConnect', data: { ssh_hash: 'test_hash_connect' } })
        );
    }).catch(done);

    let sawReady = false;
    serverConnection.on('message', (message) => {
        if (!sawReady) { sawReady = true; return; }
        try {
            expect(JSON.parse(message.toString())).toEqual({ message: '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n' });
            serverConnection.close();
        } catch (err) {
            done(err);
        }
    });

    serverConnection.on('close', () => setTimeout(() => done(), 1000));
    serverConnection.on('error', (err) => done(err));
});


test('on sshSendData - Should get the response back from SSH Server once authenticated', (done) => {
    const serverConnection = openConnection();
    let connectionEstablished = false;

    authenticate(serverConnection, VALID_TICKET).then(() => {
        serverConnection.send(
            JSON.stringify({ type: 'sshConnect', data: { ssh_hash: 'test_hash_send' } })
        );
    }).catch(done);

    let sawReady = false;
    serverConnection.on('message', (message) => {
        if (!sawReady) { sawReady = true; return; }
        try {
            if (!connectionEstablished) {
                expect(JSON.parse(message.toString())).toEqual({ message: '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n' });
                connectionEstablished = true;
                serverConnection.send(
                    JSON.stringify({
                        type: 'sshSendData',
                        data: { ssh_hash: 'test_hash_send', ssh_command: 'test_command' }
                    })
                );
            } else {
                expect(JSON.parse(message.toString())).toEqual({ message: 'mock shell output\n' });
                serverConnection.close();
            }
        } catch (err) {
            done(err);
        }
    });

    serverConnection.on('close', () => setTimeout(() => done(), 1000));
    serverConnection.on('error', (err) => done(err));
});


test('on sshClose - Should close the SSH connection', (done) => {
    /*
        Here we mock the actual connect method and return the values ourselves.
        So that we can be sure that the rest of the code related to the server is working.
        We will perform the actual test in ssh.test.js.
    */

    /*
        1. First we establish the connection.
        2. Then we disconnect. We should get a disconnected message back.

        NOTE: We have already tested the socketSSHClient close method in ssh.test.js.
              We only need to test the socket side of things here.
    */

    console.log('Disconnect test!');
    done();
});
