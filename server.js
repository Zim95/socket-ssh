const WebSocket = require('ws');

const websocketServer = new WebSocket.Server({ port: 8000 });


const messageHandler = (clientConnection, message) => {
  clientConnection.send(`Received message: ${message}`);
};

const closeHandler = () => {
  console.log('Client Disconnected');
};


websocketServer.on('connection', (clientConnection) => {
  console.log('Client connected');

  clientConnection.on('message', (message) => messageHandler(clientConnection, message));
  clientConnection.on('close', () => closeHandler());
});

console.log('Server started at: ws://localhost:8000');

module.exports = websocketServer;
