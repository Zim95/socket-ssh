const WebSocket = require('ws');
const { handle } = require('./src/handler');


const messageHandler = (clientConnection, message) => {
  /*
    Convert the message to an object and send it to handle.
    Return the result to the client.
    If there is an error, send the error to the client.

    :params:
      clientConnection: The client connection object.
      message: Message from the client.
    :returns: None (There is no actual return, we are only sending messages to the client socket.)
  */
  try {
    const result = handle(JSON.parse(message));
    clientConnection.send(JSON.stringify(result));
  } catch (error) {
    console.error('Error handling message:', error);
    clientConnection.send(JSON.stringify({ error: error.message }));
  }
};


const closeHandler = (clientConnection) => {
  /*
    This is triggered when the client disconnects.
    Right now, we log the event and close the connection.
    We can add more logic here to handle the disconnect.
  */
  console.log('Client Disconnected');
  clientConnection.close();
};


// This automatically starts the server
const websocketServer = new WebSocket.Server({ port: 8000 });


websocketServer.on('connection', (clientConnection) => {
  /*
    Here we map the events to appropriate handlers.
    We only log the client connection event. Nothing else.
    :params:
      clientConnection: The client connection object.
    :returns: None (There is no actual return, we are mapping the events to handlers)
  */
  console.log('Client connected');
  clientConnection.on('message', (message) => messageHandler(clientConnection, message));
  clientConnection.on('close', () => closeHandler(clientConnection));
});


console.log('Server started at: ws://localhost:8000');

module.exports = websocketServer;
