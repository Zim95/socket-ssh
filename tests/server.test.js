const WebSocket = require('ws');
let webSocketServer;


// setup
beforeAll(() => {
    webSocketServer = require('../server'); 
});


afterAll((done) => {
    webSocketServer.close(() => done());
});


test('on message - Should console log the message', (done) => {
    const serverConnection = new WebSocket('ws://localhost:8000');

    // Open runs once the connection is established.
    // we do a client.send. This triggers the 'message` event on the clientConnection.
    serverConnection.on('open', () => serverConnection.send('Hello World'));

    // To receive the message, we need to listen for the 'message' event on the clientConnection.
    // This event is triggered when the clientConnection hits the send method.
    serverConnection.on('message', (message) => {
        // here we expect the message to be the same as the one we sent.
        expect(message.toString()).toBe('Received message: Hello World');
        serverConnection.close(); // This triggeres the on close event on the server.
    });

    // This is triggered when the server sends websocket.close()
    // serverConnection.on('close', () => setImmediate(() => done())); // This doesnt get called since we dont have clientConnection.close anymore.

    // This is triggered when the client encounters an error.
    serverConnection.on('error', (err) => done(err));
});
