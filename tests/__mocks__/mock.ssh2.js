/**
 * This code was written by Claude. We wanted to mimic ssh2 module.
 * Since, I dont have much experience with event programming, I asked Claude to write the code.
 * Reason: Since we use arrow functions in our sshChannel.js, we could not mock them using jest.spyOn(<module>.prototype, <method>).
 * So our only option was to mock the entire module.
 * But, if we mocked sshChannel.js, we would not be able to check the flow of the code.
 * So instead, we mocked the ssh2 module. So that, we can test the flow of code in sshChannel.js, and socketSSH.js combined.
 * This is a working mock. We made some tweaks to it, to make it work with our code.
 */

class MockSSH2Client {
    constructor() {
        this._events = {};
    }

    on(event, handler) {
        this._events[event] = handler;
        return this;
    }

    connect() {
        // Simulate async connect success
        setTimeout(() => {
            if (this._events['ready']) {
                this._events['ready']();
            }
        }, 1);
    }

    shell(callback) {
        // Simulate providing a stream with mock behavior
        const mockStream = {
            on: (event, handler) => {
                // check if we should SETUP the data handler
                if (event === 'data') {
                    this._dataHandler = handler;
                }

                // check if we should SETUP the close handler
                if (event === 'close') {
                    // simulate close later
                    this._closeHandler = handler; // Do not setup a setTimeout here. Because that would immediately close.
                }
            },
            write: jest.fn((data) => {
                console.log('This is the command recieved by the write method of the mock stream:', data);
                // Return some mock result
                if (this._dataHandler) {
                    this._dataHandler(`mock shell output\n`);
                }
            }),
            end: jest.fn()
        };

        // simulate immediate shell callback
        setTimeout(() => {
            callback(null, mockStream);
        }, 1);
    }

    end() {
        if (this._closeHandler) {
            this._closeHandler();
        }
    }

    emitError(error) {
        if (this._events['error']) {
            this._events['error'](error);
        }
    }
}

module.exports = MockSSH2Client;
