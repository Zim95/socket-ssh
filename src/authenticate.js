const logger = require('./logger');

// P11 (see ~/browseterm/p.md's "P11" section): socket-ssh no longer holds a Redis credential of
// its own. Same DNS convention every other component's default uses.
const BROWSETERM_CLOUD_API_URL = process.env.BROWSETERM_CLOUD_API_URL || 'http://browseterm.cloud.com:9999';

// remotetunelling.md Phase 3/7: this device's own Bearer credential - the SAME device-credentials
// Secret tunnel_registrar already reads (see socket-ssh/infra/deployment/deployment.yaml), never
// logged, never sent anywhere except this one Authorization header.
const DEVICE_TOKEN = process.env.DEVICE_TOKEN || '';

/**
 * Consume a single-use terminal ticket via Cloud's Bearer-device-token-gated endpoint
 * (remotetunelling.md Phase 5/7). Returns the resolved, server-authorized SSH connection info
 * on success - never anything the WebSocket client itself supplied - or null on any failure
 * (missing/expired/replayed/wrong-device ticket, or Cloud unreachable). The caller can't and
 * shouldn't distinguish those cases: "invalid ticket" is the only signal a client ever needs.
 *
 * @param {string} ticket
 * @returns {Promise<{ssh_host: string, ssh_port: number, ssh_username: string, ssh_password: string} | null>}
 */
async function consumeTerminalTicket(ticket) {
  if (!DEVICE_TOKEN) {
    logger.error('DEVICE_TOKEN is not set - cannot consume any terminal ticket');
    return null;
  }

  let response;
  try {
    response = await fetch(`${BROWSETERM_CLOUD_API_URL}/internal/terminal-tickets/consume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEVICE_TOKEN}`,
      },
      body: JSON.stringify({ ticket }),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error reaching Cloud to consume terminal ticket');
    return null;
  }

  if (!response.ok) {
    logger.warn({ status: response.status }, 'Terminal ticket rejected');
    return null;
  }

  const data = await response.json();
  logger.info({ container_id: data.container_id }, 'Terminal ticket consumed');
  return {
    ssh_host: data.ssh_host,
    ssh_port: data.ssh_port,
    ssh_username: data.ssh_username,
    ssh_password: data.ssh_password,
  };
}

module.exports = {
  consumeTerminalTicket,
};
