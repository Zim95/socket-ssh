const WebSocket = require('ws');
const RequestHashStore = require('./src/requestContext');
const { RequestHandler } = require('./src/handler');


// This automatically starts the server
const websocketServer = new WebSocket.Server({ port: 8000 });
const requestHashStore = new RequestHashStore(); // Request hash store.


websocketServer.on('connection', (clientConnection) => {
  /*
    Here we map the events to appropriate handlers.
    We only log the client connection event and map the events to handlers. Nothing else.
    :params:
      clientConnection: The client connection object.
    :returns: None (There is no actual return, we are mapping the events to handlers)
  */
  console.log('Client connected');

  clientConnection.on('message', (message) => {
    const requestHandler = new RequestHandler(clientConnection, message, {requestHashStore});
    requestHandler.handle();
  });

  clientConnection.on('close', () => {
    console.log('Client Disconnected');
    clientConnection.close(); // Calls serverConnection.on('close', () => setImmediate(done));
  });
});


console.log('Server started at: ws://localhost:8000');


module.exports = websocketServer;
