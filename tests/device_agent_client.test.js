/*
    Migration Part 13 - a real gRPC round trip against a fake LocalDeviceAgent server, not a
    mocked stub: this exercises the actual proto-loader wiring (proto/local_device_agent.proto)
    device_agent_client.js depends on, which a fully-mocked test would not catch a mistake in.
*/
const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '..', 'proto', 'local_device_agent.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const LocalDeviceAgent = grpc.loadPackageDefinition(packageDefinition).browseterm.device.control.v1.LocalDeviceAgent;

function startFakeServer(consumeTerminalTicketHandler) {
    return new Promise((resolve, reject) => {
        const server = new grpc.Server();
        server.addService(LocalDeviceAgent.service, {
            ConsumeTerminalTicket: consumeTerminalTicketHandler,
        });
        server.bindAsync('127.0.0.1:0', grpc.ServerCredentials.createInsecure(), (err, port) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({ server, port });
        });
    });
}

describe('device_agent_client.consumeTerminalTicket', () => {
    const originalUrl = process.env.DEVICE_AGENT_LOCAL_API_URL;
    let server = null;

    afterEach(() => {
        process.env.DEVICE_AGENT_LOCAL_API_URL = originalUrl;
        if (server) {
            server.forceShutdown();
            server = null;
        }
    });

    test('valid ticket returns exactly what the fake Device Agent responds with', async () => {
        const started = await startFakeServer((call, callback) => {
            expect(call.request.ticket).toBe('t1');
            callback(null, {
                valid: true, container_id: 'c1', ssh_host: '10.0.0.5', ssh_port: 22,
                ssh_username: 'u', ssh_password: 'p',
            });
        });
        server = started.server;
        process.env.DEVICE_AGENT_LOCAL_API_URL = `127.0.0.1:${started.port}`;
        jest.resetModules();
        const { consumeTerminalTicket } = require('../src/device_agent_client');

        const result = await consumeTerminalTicket('t1');

        expect(result.valid).toBe(true);
        expect(result.container_id).toBe('c1');
        expect(result.ssh_host).toBe('10.0.0.5');
        expect(result.ssh_port).toBe(22);
    });

    test('invalid/expired/replayed ticket returns valid: false', async () => {
        const started = await startFakeServer((call, callback) => {
            callback(null, { valid: false });
        });
        server = started.server;
        process.env.DEVICE_AGENT_LOCAL_API_URL = `127.0.0.1:${started.port}`;
        jest.resetModules();
        const { consumeTerminalTicket } = require('../src/device_agent_client');

        const result = await consumeTerminalTicket('bad');

        expect(result.valid).toBe(false);
    });

    test('Device Agent unreachable resolves valid: false rather than throwing', async () => {
        process.env.DEVICE_AGENT_LOCAL_API_URL = '127.0.0.1:1'; // nothing listens here
        process.env.DEVICE_AGENT_RPC_TIMEOUT_MS = '500';
        jest.resetModules();
        const { consumeTerminalTicket } = require('../src/device_agent_client');

        const result = await consumeTerminalTicket('t1');

        expect(result.valid).toBe(false);
        delete process.env.DEVICE_AGENT_RPC_TIMEOUT_MS;
    }, 10000);
});
