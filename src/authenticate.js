const Redis = require('ioredis');
const url = require('url');

// Convert environment variables to integers where needed
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_DB = parseInt(process.env.REDIS_DB, 10) || 0;

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: REDIS_PORT,
  username: process.env.REDIS_USERNAME || undefined, // ACL username
  password: process.env.REDIS_PASSWORD || undefined,
  db: REDIS_DB,
});

/**
 * Authenticate WebSocket request using one-time WebSocket token
 * Token is created by browseterm-server for authenticated users only
 * @param {IncomingMessage} req
 * @returns {Promise<boolean>} true if authenticated, false otherwise
 */
async function authenticateRequest(req) {
  // Parse URL for query parameters
  const parsedUrl = url.parse(req.url, true);
  const wsToken = parsedUrl.query.token;

  if (!wsToken) {
    console.log('No WebSocket token provided');
    return false;
  }

  // Check if token exists and get linked session_id
  const wsTokenKey = `ws_token:${wsToken}`;
  const sessionId = await redis.get(wsTokenKey);
  
  if (!sessionId) {
    console.log('Invalid or expired WebSocket token');
    return false;
  }

  // Delete the token immediately (one-time use)
  await redis.del(wsTokenKey);
  
  // Verify the session still exists
  const sessionKey = `session:${sessionId}`;
  const exists = await redis.exists(sessionKey);

  if (exists === 1) {
    console.log('WebSocket token validated and consumed');
    return true;
  }

  console.log('Token valid but session expired');
  return false;
}

module.exports = {
  authenticateRequest,
};
