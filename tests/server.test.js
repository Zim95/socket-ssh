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
    serverConnection.on('close', () => setImmediate(done)); // This gets called when the server sends clientConnection.close()
    // SetImmediate is used to schedule the done callback to be called immediately after the current operation completes.

    // This is triggered when the client encounters an error.
    serverConnection.on('error', (err) => done(err));
});
