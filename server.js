const WebSocket = require('ws');
const http = require('http');
const RequestHashStore = require('./src/requestContext');
const { RequestHandler } = require('./src/handler');
const { consumeTerminalTicket } = require('./src/authenticate');
const logger = require('./src/logger');

// Allowed origins for CORS (from environment or default)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://browseterm.local.com:9999,http://localhost:9999').split(',');

// remotetunelling.md Phase 7: "Require an authentication message within approximately five
// seconds." A connection that never authenticates within this window is closed - it never got
// to do anything else in the meantime (see the message handler below). Configurable so tests can
// exercise the timeout itself without a real 5s wait, matching how every other interval/threshold
// in this project (HEARTBEAT_INTERVAL_SECONDS, TUNNEL_OFFLINE_THRESHOLD_SECONDS, ...) is env-driven.
const AUTH_TIMEOUT_MS = parseInt(process.env.AUTH_TIMEOUT_MS || '5000', 10);

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
      logger.warn({ origin }, 'terminal.websocket_rejected: disallowed origin');
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
// remotetunelling.md Phase 7: per-connection authorization state. sshTarget is set ONLY from a
// successfully-consumed ticket (src/authenticate.js) - never from anything the client itself
// sends. Once set, it is the one and only source of truth SSHConnectHandler (src/handler.js) will
// ever use; a client can no longer choose its own target after this point.
const connectionAuth = new WeakMap();

websocketServer.on('connection', (clientConnection, req) => {
  logger.info({ origin: req.headers.origin }, 'terminal.websocket_connected');

  connectionAuth.set(clientConnection, { authenticated: false, sshTarget: null });
  connectionSessions.set(clientConnection, new Set());

  const authTimeout = setTimeout(() => {
    const auth = connectionAuth.get(clientConnection);
    if (auth && !auth.authenticated) {
      logger.warn('terminal.websocket_rejected: authentication timeout');
      clientConnection.close(4401, 'Authentication timeout');
    }
  }, AUTH_TIMEOUT_MS);

  clientConnection.on('message', async (message) => {
    const auth = connectionAuth.get(clientConnection);

    if (!auth.authenticated) {
      // Before authentication: no PTY, no container-maker call, no pod attach, no terminal
      // input/output - the ONLY thing accepted here is a well-formed authenticate message
      // (remotetunelling.md Phase 7's own "Before authentication" list). Anything else closes
      // the connection outright rather than silently ignoring it.
      let parsed;
      try {
        parsed = JSON.parse(message);
      } catch (error) {
        logger.warn({ err: error }, 'terminal.websocket_rejected: unparseable message before authentication');
        clientConnection.close(4400, 'Invalid message');
        return;
      }
      if (parsed.type !== 'authenticate') {
        logger.warn({ type: parsed.type }, 'terminal.websocket_rejected: non-authenticate message before authentication');
        clientConnection.close(4401, 'Not authenticated');
        return;
      }
      const ticket = parsed.data && parsed.data.ticket;
      if (!ticket) {
        logger.warn('terminal.websocket_rejected: authenticate message missing ticket');
        clientConnection.close(4400, 'Missing ticket');
        return;
      }

      const sshTarget = await consumeTerminalTicket(ticket);
      if (!sshTarget) {
        logger.warn('terminal.websocket_rejected: ticket invalid, expired, or already consumed');
        clientConnection.close(4401, 'Invalid or expired ticket');
        return;
      }

      clearTimeout(authTimeout);
      connectionAuth.set(clientConnection, { authenticated: true, sshTarget });
      logger.info({ container_id: sshTarget.container_id }, 'terminal.websocket_authenticated');
      clientConnection.send(JSON.stringify({ type: 'ready', message: 'Server ready to accept commands' }));
      return;
    }

    // Already authenticated: dispatch as before. A repeat "authenticate" message (Phase 7:
    // "Reject further authentication messages") is naturally rejected here too - it was never
    // registered as a real handler type, so RequestHandler's own "invalid type" path handles it
    // without any special-casing needed.
    const requestHandler = new RequestHandler(clientConnection, message, {
      requestHashStore, connectionSessions, sshTarget: auth.sshTarget,
    });
    requestHandler.handle();
  });

  clientConnection.on('close', () => {
    const auth = connectionAuth.get(clientConnection);
    logger.info({ container_id: auth && auth.sshTarget && auth.sshTarget.container_id }, 'terminal.websocket_disconnected');
    clearTimeout(authTimeout);

    // Clean up all SSH sessions associated with this connection
    const sessions = connectionSessions.get(clientConnection);
    if (sessions) {
      sessions.forEach((sshHash) => {
        const socketSSHClient = requestHashStore.getRequestEntry(sshHash);
        if (socketSSHClient) {
          logger.info({ ssh_hash: sshHash }, 'Cleaning up SSH session');
          try {
            socketSSHClient.close();
            requestHashStore.removeRequestEntry(sshHash);
          } catch (error) {
            logger.error({ err: error, ssh_hash: sshHash }, 'Error cleaning up SSH session');
          }
        }
      });
      connectionSessions.delete(clientConnection);
    }
  });
});

// Configurable so tests can run their own server instance on a different port without
// conflicting with other test files' servers when Jest runs files in parallel workers.
const PORT = parseInt(process.env.PORT || '8000', 10);
server.listen(PORT, () => {
  logger.info({ port: PORT }, 'WS server listening (TLS handled by ingress)');
});

module.exports = server;
