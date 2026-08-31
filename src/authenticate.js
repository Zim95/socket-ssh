const url = require('url');
const logger = require('./logger');

// P11 (see ~/browseterm/p.md's "P11" section): socket-ssh no longer holds a Redis credential of
// its own. Same DNS convention every other component's default uses.
const BROWSETERM_CLOUD_API_URL = process.env.BROWSETERM_CLOUD_API_URL || 'http://browseterm.cloud.com:9999';

/**
 * Authenticate WebSocket request using one-time WebSocket token.
 * Token is created by browseterm-server (Cloud, as of P07) for authenticated users only.
 *
 * P11: validation moved from a direct Redis GET+DEL against Cloud's Redis to a single call to
 * Cloud's POST /auth/websocket-tokens/consume - public but possession-gated (holding a valid
 * one-time token IS the authorization, same pattern P07 already established for OAuth handoff/
 * device-bootstrap redemption), so no shared secret is needed here at all. Terminal
 * WebSocket/SSH behavior is otherwise unchanged - this function's signature and return value
 * (a plain boolean) are identical to before.
 * @param {IncomingMessage} req
 * @returns {Promise<boolean>} true if authenticated, false otherwise
 */
async function authenticateRequest(req) {
  // Parse URL for query parameters
  const parsedUrl = url.parse(req.url, true);
  const wsToken = parsedUrl.query.token;

  if (!wsToken) {
    logger.warn('No WebSocket token provided');
    return false;
  }

  let response;
  try {
    response = await fetch(`${BROWSETERM_CLOUD_API_URL}/auth/websocket-tokens/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: wsToken }),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error reaching Cloud to consume WebSocket token');
    return false;
  }

  if (!response.ok) {
    logger.warn({ status: response.status }, 'Invalid or expired WebSocket token');
    return false;
  }

  const data = await response.json();
  if (!data.valid) {
    logger.warn('Cloud reported WebSocket token as invalid');
    return false;
  }

  logger.info({ request_id: data.session_id }, 'WebSocket token validated and consumed');
  return true;
}

module.exports = {
  authenticateRequest,
};
