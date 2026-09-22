/**
 * The socket-ssh -> Device Agent local API boundary (migration Part 13).
 *
 * Replaces the old direct, per-device-Bearer-token call to Cloud's
 * /internal/terminal-tickets/consume with a gRPC call to Device Agent's private, ClusterIP-only
 * `LocalDeviceAgent` service - the same boundary status_monitor/reaper/snapshot_job/
 * tunnel_registrar were already rewired onto in Part 12. socket-ssh holds no Cloud credential of
 * any kind any more (not even the device-scoped Bearer token it used to read from the
 * device-credentials Secret) - only Device Agent does.
 *
 * Uses @grpc/proto-loader to load proto/local_device_agent.proto directly at runtime - Node has
 * no equivalent of Python's pregenerated *_pb2.py step, so this is the idiomatic way to consume a
 * shared .proto contract here (see that file's own header comment for why a vendored copy exists
 * instead of a generated-code dependency).
 */
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const logger = require('./logger');

// Same DNS convention every other Device Agent local-API caller uses (see
// browseterm_workload/tunnel_registrar/src/config.py's identical default).
const DEVICE_AGENT_LOCAL_API_URL = process.env.DEVICE_AGENT_LOCAL_API_URL
  || 'browseterm-device-agent-service.browseterm.svc.cluster.local:50061';

const RPC_TIMEOUT_MS = parseInt(process.env.DEVICE_AGENT_RPC_TIMEOUT_MS || '10000', 10);

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'local_device_agent.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const LocalDeviceAgent = grpc.loadPackageDefinition(packageDefinition).browseterm.device.control.v1.LocalDeviceAgent;

function _newClient() {
  // ClusterIP-only, NetworkPolicy-gated, not TLS - matches Device Agent's own
  // `local_api_server.add_insecure_port` (device_agent/main.py) exactly; every other local caller
  // of this service (status_monitor, reaper, snapshot_job, tunnel_registrar) uses the same
  // insecure-channel trust boundary.
  return new LocalDeviceAgent(DEVICE_AGENT_LOCAL_API_URL, grpc.credentials.createInsecure());
}

/**
 * Calls LocalDeviceAgent.ConsumeTerminalTicket. Resolves to `{ valid: false }` on any gRPC-level
 * failure (Device Agent unreachable, timeout, etc) - the caller can't and shouldn't distinguish
 * that from an actually-invalid ticket, same "collapse to one failure shape" convention the old
 * direct-Cloud call already used.
 *
 * @param {string} ticket
 * @returns {Promise<{valid: boolean, container_id?: string, ssh_host?: string, ssh_port?: number, ssh_username?: string, ssh_password?: string}>}
 */
function consumeTerminalTicket(ticket) {
  return new Promise((resolve) => {
    const deadline = new Date(Date.now() + RPC_TIMEOUT_MS);
    let client;
    try {
      client = _newClient();
    } catch (error) {
      logger.error({ err: error }, 'Error creating Device Agent local API client');
      resolve({ valid: false });
      return;
    }
    client.ConsumeTerminalTicket({ ticket }, { deadline }, (error, response) => {
      client.close();
      if (error) {
        logger.error({ err: error }, 'Error reaching Device Agent to consume terminal ticket');
        resolve({ valid: false });
        return;
      }
      resolve(response);
    });
  });
}

module.exports = {
  consumeTerminalTicket,
};
