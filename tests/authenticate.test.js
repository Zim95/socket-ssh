/*
    remotetunelling.md Phase 5/7: authenticate.js no longer validates a plain possession-gated
    websocket token - it consumes a single-use terminal ticket via Cloud's
    Bearer-device-token-gated /internal/terminal-tickets/consume, using this device's own
    DEVICE_TOKEN (never the client-supplied query-param token the old flow used).
*/
const originalDeviceToken = process.env.DEVICE_TOKEN;

function mockFetchResponse(ok, status, body) {
    return {
        ok,
        status,
        json: async () => body,
    };
}

beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
    process.env.DEVICE_TOKEN = 'this-devices-token';
});

afterEach(() => {
    jest.resetAllMocks();
    process.env.DEVICE_TOKEN = originalDeviceToken;
});

test('missing DEVICE_TOKEN returns null without calling Cloud', async () => {
    delete process.env.DEVICE_TOKEN;
    const { consumeTerminalTicket } = require('../src/authenticate');
    const result = await consumeTerminalTicket('some-ticket');
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
});

test('valid ticket calls Cloud with the device Bearer token and returns connection info', async () => {
    global.fetch.mockResolvedValue(
        mockFetchResponse(true, 200, {
            container_id: 'c1', ssh_host: '10.42.0.5', ssh_port: 22,
            ssh_username: 'u', ssh_password: 'p',
        })
    );
    const { consumeTerminalTicket } = require('../src/authenticate');

    const result = await consumeTerminalTicket('valid-ticket');

    expect(result).toEqual({ container_id: 'c1', ssh_host: '10.42.0.5', ssh_port: 22, ssh_username: 'u', ssh_password: 'p' });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/internal/terminal-tickets/consume');
    expect(options.method).toBe('POST');
    expect(options.headers['Authorization']).toBe('Bearer this-devices-token');
    expect(JSON.parse(options.body)).toEqual({ ticket: 'valid-ticket' });
});

test('Cloud rejects the ticket (401) returns null', async () => {
    global.fetch.mockResolvedValue(mockFetchResponse(false, 401, { error: 'Invalid or expired ticket' }));
    const { consumeTerminalTicket } = require('../src/authenticate');
    const result = await consumeTerminalTicket('expired-ticket');
    expect(result).toBeNull();
});

test('network failure reaching Cloud returns null, does not throw', async () => {
    global.fetch.mockRejectedValue(new Error('connection refused'));
    const { consumeTerminalTicket } = require('../src/authenticate');
    const result = await consumeTerminalTicket('any-ticket');
    expect(result).toBeNull();
});

test('replaying the same ticket a second time fails (single-use, mirrored from Cloud)', async () => {
    global.fetch
        .mockResolvedValueOnce(mockFetchResponse(true, 200, {
            container_id: 'c1', ssh_host: 'h', ssh_port: 22, ssh_username: 'u', ssh_password: 'p',
        }))
        .mockResolvedValueOnce(mockFetchResponse(false, 401, { error: 'Invalid or expired ticket' }));
    const { consumeTerminalTicket } = require('../src/authenticate');

    const first = await consumeTerminalTicket('one-time-ticket');
    const second = await consumeTerminalTicket('one-time-ticket');

    expect(first).not.toBeNull();
    expect(second).toBeNull();
});
