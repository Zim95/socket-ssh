/*
    Migration Part 13: authenticate.js consumes a single-use terminal ticket via Device Agent's
    private local API (device_agent_client.js) instead of calling Cloud directly with a device
    Bearer token - socket-ssh holds no Cloud credential of any kind any more.
*/
jest.mock('../src/device_agent_client');
const deviceAgentClient = require('../src/device_agent_client');

beforeEach(() => {
    jest.resetAllMocks();
});

test('valid ticket resolves via Device Agent and returns connection info', async () => {
    deviceAgentClient.consumeTerminalTicket.mockResolvedValue({
        valid: true, container_id: 'c1', ssh_host: '10.42.0.5', ssh_port: 22, ssh_username: 'u', ssh_password: 'p',
    });
    const { consumeTerminalTicket } = require('../src/authenticate');

    const result = await consumeTerminalTicket('valid-ticket');

    expect(result).toEqual({ container_id: 'c1', ssh_host: '10.42.0.5', ssh_port: 22, ssh_username: 'u', ssh_password: 'p' });
    expect(deviceAgentClient.consumeTerminalTicket).toHaveBeenCalledWith('valid-ticket');
});

test('Device Agent reports an invalid ticket returns null', async () => {
    deviceAgentClient.consumeTerminalTicket.mockResolvedValue({ valid: false });
    const { consumeTerminalTicket } = require('../src/authenticate');
    const result = await consumeTerminalTicket('expired-ticket');
    expect(result).toBeNull();
});

test('Device Agent unreachable returns null, does not throw', async () => {
    deviceAgentClient.consumeTerminalTicket.mockResolvedValue({ valid: false });
    const { consumeTerminalTicket } = require('../src/authenticate');
    const result = await consumeTerminalTicket('any-ticket');
    expect(result).toBeNull();
});

test('replaying the same ticket a second time fails (single-use, mirrored from Cloud)', async () => {
    deviceAgentClient.consumeTerminalTicket
        .mockResolvedValueOnce({ valid: true, container_id: 'c1', ssh_host: 'h', ssh_port: 22, ssh_username: 'u', ssh_password: 'p' })
        .mockResolvedValueOnce({ valid: false });
    const { consumeTerminalTicket } = require('../src/authenticate');

    const first = await consumeTerminalTicket('one-time-ticket');
    const second = await consumeTerminalTicket('one-time-ticket');

    expect(first).not.toBeNull();
    expect(second).toBeNull();
});
