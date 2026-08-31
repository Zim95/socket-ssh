/*
    P11 (see ~/browseterm/p.md's "P11" section): authenticateRequest no longer talks to Redis
    directly - it calls Cloud's POST /auth/websocket-tokens/consume. These tests mock global
    fetch instead of ioredis.
*/
const { authenticateRequest } = require('../src/authenticate');

function mockReq(query) {
    return { url: `/?${new URLSearchParams(query).toString()}` };
}

function mockFetchResponse(ok, status, body) {
    return {
        ok,
        status,
        json: async () => body,
    };
}

beforeEach(() => {
    global.fetch = jest.fn();
});

afterEach(() => {
    jest.resetAllMocks();
});

test('missing token returns false without calling Cloud', async () => {
    const result = await authenticateRequest(mockReq({}));
    expect(result).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
});

test('valid token calls Cloud consume endpoint and returns true', async () => {
    global.fetch.mockResolvedValue(
        mockFetchResponse(true, 200, { valid: true, session_id: 's1', user_id: 'u1' })
    );

    const result = await authenticateRequest(mockReq({ token: 'valid-token' }));

    expect(result).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toContain('/auth/websocket-tokens/consume');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ token: 'valid-token' });
});

test('Cloud reports invalid token (401) returns false', async () => {
    global.fetch.mockResolvedValue(mockFetchResponse(false, 401, { valid: false }));
    const result = await authenticateRequest(mockReq({ token: 'expired-token' }));
    expect(result).toBe(false);
});

test('Cloud reachable but reports valid=false returns false', async () => {
    // Defensive: even a 200 with valid=false should never authenticate.
    global.fetch.mockResolvedValue(mockFetchResponse(true, 200, { valid: false }));
    const result = await authenticateRequest(mockReq({ token: 'weird-response' }));
    expect(result).toBe(false);
});

test('network failure reaching Cloud returns false, does not throw', async () => {
    global.fetch.mockRejectedValue(new Error('connection refused'));
    const result = await authenticateRequest(mockReq({ token: 'any-token' }));
    expect(result).toBe(false);
});

test('second consumption of the same token fails (single-use, mirrored from Cloud)', async () => {
    global.fetch
        .mockResolvedValueOnce(mockFetchResponse(true, 200, { valid: true, session_id: 's1', user_id: 'u1' }))
        .mockResolvedValueOnce(mockFetchResponse(false, 401, { valid: false }));

    const first = await authenticateRequest(mockReq({ token: 'one-time-token' }));
    const second = await authenticateRequest(mockReq({ token: 'one-time-token' }));

    expect(first).toBe(true);
    expect(second).toBe(false);
});
