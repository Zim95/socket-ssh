/*
    This code is written by me.

    What we want to simulate -> a websocket client.

    How things usually work?
    =========================
    - This creates the websocket server -> new Websocket.Server(<port number>).
    - To create the client connection, we need to connect to websocket server -> new WebSocket('ws://localhost:8000');
        - The client is usually created on the frontend, but, if you want to see an example, look at server.test.js.
        - There we have created an actual websocket client connection, and mocked the ssh2 module instead.
        - Here we are doing the opposite. Testing our ssh2 related code and mocking the websocket.
    - The flow usually works as follows:
        - client calls send method -> server recieves it on the on message event.
        - server calls send method -> client recieves it on the on message event.
        - client receives data on the on message event only if server chooses to respond.
        - In our case, we are going to call client.send method, which should ideally trigger server.onmessage.
        - But since this is a mock, we are going to call client.onmessage directly from the send.
*/


const {EventEmitter} = require('events');


class MockWebSocket extends EventEmitter{
    send(message) {
        // trigger message event.
        this.emit('message', message);
    }
}


module.exports = MockWebSocket;
