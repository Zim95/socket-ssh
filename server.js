const WebSocket = require('ws');
const http = require('http');
const RequestHashStore = require('./src/requestContext');
const { RequestHandler } = require('./src/handler');
const { authenticateRequest } = require('./src/authenticate');

// Allowed origins for CORS (from environment or default)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://browseterm.local.com:9999,http://localhost:9999').split(',');

// Use plain HTTP/WS server
// TLS is handled by the ingress controller in production
const server = http.createServer();

// Create WebSocket server with verifyClient for CORS handling
const websocketServer = new WebSocket.Server({ 
  server,
  verifyClient: (info, callback) => {
    const origin = info.origin || info.req.headers.origin;
    
    // Check if origin is allowed
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      console.log(`Rejected connection from origin: ${origin}`);
      callback(false, 403, 'Forbidden');
      return;
    }
    
    // Allow the connection
    callback(true);
  }
});

const requestHashStore = new RequestHashStore();
// Track which SSH sessions belong to which WebSocket connection
const connectionSessions = new WeakMap();

websocketServer.on('connection', async (clientConnection, req) => {
  console.log('Client connected', `Iteration {1}`);

  // Authenticate session
  const isAuthenticated = await authenticateRequest(req);
  if (!isAuthenticated) {
    clientConnection.send(JSON.stringify({ error: 'Invalid session. Please login again.' }));
    clientConnection.close();
    return;
  }

  // Track SSH sessions for this connection
  connectionSessions.set(clientConnection, new Set());

  clientConnection.on('message', (message) => {
    const requestHandler = new RequestHandler(clientConnection, message, { requestHashStore, connectionSessions });
    requestHandler.handle();
  });

  // Send ready message to client after authentication and setup is complete
  clientConnection.send(JSON.stringify({ type: 'ready', message: 'Server ready to accept commands' }));

  clientConnection.on('close', () => {
    console.log('Client disconnected');
    
    // Clean up all SSH sessions associated with this connection
    const sessions = connectionSessions.get(clientConnection);
    if (sessions) {
      sessions.forEach((sshHash) => {
        const socketSSHClient = requestHashStore.getRequestEntry(sshHash);
        if (socketSSHClient) {
          console.log(`Cleaning up SSH session: ${sshHash}`);
          try {
            socketSSHClient.close();
            requestHashStore.removeRequestEntry(sshHash);
          } catch (error) {
            console.error(`Error cleaning up session ${sshHash}:`, error);
          }
        }
      });
      connectionSessions.delete(clientConnection);
    }
  });
});

server.listen(8000, () => {
  console.log('WS server listening on port 8000 (TLS handled by ingress)');
});

module.exports = server;
