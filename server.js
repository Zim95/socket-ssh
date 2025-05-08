const WebSocket = require('ws');
const https = require('https');
const RequestHashStore = require('./src/requestContext');
const { RequestHandler } = require('./src/handler');
const { readCertificates } = require('./src/utils');

const certificates = readCertificates();

const serverOptions = {
  key: certificates['server.key'],
  cert: certificates['server.crt'],
  ca: certificates['ca.crt'],
  requestCert: true,
  rejectUnauthorized: true,
};


const httpsServer = https.createServer(serverOptions);
const websocketServer = new WebSocket.Server({ server: httpsServer });
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


httpsServer.listen(8000, () => {
  console.log('WSS server listening on port 8000');
});


module.exports = httpsServer;
