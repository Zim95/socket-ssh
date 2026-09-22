const logger = require('./logger');
const deviceAgentClient = require('./device_agent_client');

/**
 * Consume a single-use terminal ticket via Device Agent's private local API (migration Part 13).
 * Returns the resolved, server-authorized SSH connection info on success - never anything the
 * WebSocket client itself supplied - or null on any failure (missing/expired/replayed/
 * wrong-device/stale-placement ticket, or Device Agent unreachable). The caller can't and
 * shouldn't distinguish those cases: "invalid ticket" is the only signal a client ever needs.
 *
 * @param {string} ticket
 * @returns {Promise<{container_id: string, ssh_host: string, ssh_port: number, ssh_username: string, ssh_password: string} | null>}
 */
async function consumeTerminalTicket(ticket) {
  const target = await deviceAgentClient.consumeTerminalTicket(ticket);
  if (!target || !target.valid) {
    logger.warn('Terminal ticket rejected');
    return null;
  }

  logger.info({ container_id: target.container_id }, 'Terminal ticket consumed');
  return {
    container_id: target.container_id,  // for log context only - SSHConnectHandler never reads this
    ssh_host: target.ssh_host,
    ssh_port: target.ssh_port,
    ssh_username: target.ssh_username,
    ssh_password: target.ssh_password,
  };
}

module.exports = {
  consumeTerminalTicket,
};
