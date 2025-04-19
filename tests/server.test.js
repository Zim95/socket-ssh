const WebSocket = require('ws');
let webSocketServer;


// setup
beforeAll(() => {
    webSocketServer = require('../server'); 
});


afterAll((done) => {
    webSocketServer.close(() => done());
});


test('on echo - Should receive the same message back', (done) => {
    const serverConnection = new WebSocket('ws://localhost:8000');

    // Open runs once the connection is established.
    // we do a client.send. This triggers the 'message` event on the clientConnection.
    serverConnection.on('open', () => serverConnection.send('{"type": "echo", "data": {"message": "Hello World"}}'));

    // To receive the message, we need to listen for the 'message' event on the clientConnection.
    // This event is triggered when the clientConnection hits the send method.
    serverConnection.on('message', (message) => {
        try {
            // here we expect the message to be the same as the one we sent.
            expect(JSON.parse(message.toString())).toEqual({ message: 'Hello World' });
            serverConnection.close(); // This triggeres the on close event on the server.
        } catch (err) {
            console.log('Error in test:', err);
            done(err);  // Immediately end the test with done if there is an error.
        }
    });

    // This is triggered when the server sends websocket.close()
    serverConnection.on('close', () => setTimeout(() => done(), 1000)); // This gets called when the server sends clientConnection.close()
    // SetImmediate is used to schedule the done callback to be called immediately after the current operation completes.

    // This is triggered when the client encounters an error.
    serverConnection.on('error', (err) => done(err));
});


test('on sshConnect - Should get SSH connected message back', (done) => {
    /*
        Here we mock the actual connect method and return the values ourselves.
        So that we can be sure that the rest of the code related to the server is working.
        We will perform the actual test in ssh.test.js.
    */

    // create the dummy mock for getSSHClient function. It needs to have a connect method that returns test connection string.
    const mockGetSSHClient = jest.fn();
    mockGetSSHClient.mockReturnValue({
        connect: jest.fn().mockResolvedValue('Test Connection String')
    });

    const SSHChannel = require('../src/socketSSH/sshChannel');
    jest.spyOn(SSHChannel.prototype, 'getSSHClient').mockImplementation(mockGetSSHClient);

    // now we will trigger connect.
    serverConnection.on('open', () => serverConnection.send(
        JSON.stringify({
            type: 'sshConnect',
            data: {
                ssh_hash: 'test_hash',
                ssh_host: 'test_host',
                ssh_port: 22,
                ssh_username: 'test_username',
                ssh_password: 'test_password'
            }
        })
    ));

    // now we will listen for the message.
    serverConnection.on('message', (message) => {
        try {
            expect(message.toString()).toEqual('Test SSH Server Return Value');
            serverConnection.close();
        } catch (err) {
            console.log('Error in test:', err);
            done(err);  // Immediately end the test with done if there is an error.
        }
    });

    // if things are fine, we close.
    serverConnection.on('close', () => setTimeout(() => done(), 1000));

    // if things go wrong, we throw an error and close the connection.
    serverConnection.on('error', (err) => done(err));
});


test('on sshSendData - Should get the response back from SSH Server', (done) => {
    /*
        Here we mock the actual connect method and return the values ourselves.
        So that we can be sure that the rest of the code related to the server is working.
        We will perform the actual test in ssh.test.js.
    */
    // create the dummy mock for getSSHStream function. It needs to have a write method that returns test connection string.
    const mockGetSSHStream = jest.fn();
    mockGetSSHStream.mockReturnValue({
        write: jest.fn().mockResolvedValue('Test SSH Server Return Value')
    });

    const SSHChannel = require('../src/socketSSH/sshChannel');
    jest.spyOn(SSHChannel.prototype, 'getSSHStream').mockImplementation(mockGetSSHStream);

    // now we will trigger connect.
    serverConnection.on('open', () => serverConnection.send(
        JSON.stringify({
            type: 'sshSendData',
            data: {
                ssh_hash: 'test_hash',
                ssh_command: 'test_command'
            }
        })
    ));

    // now we will listen for the message.
    serverConnection.on('message', (message) => {
        try {
            expect(message.toString()).toEqual('Test SSH Server Return Value');
            serverConnection.close();
        } catch (err) {
            console.log('Error in test:', err);
            done(err);  // Immediately end the test with done if there is an error.
        }
    });

    // if things are fine, we close.
    serverConnection.on('close', () => setTimeout(() => done(), 1000));

    // if things go wrong, we throw an error and close the connection.
    serverConnection.on('error', (err) => done(err));
});

