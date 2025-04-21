class MockSSH2Client {
    constructor() {
        this._events = {};
    }

    on(event, handler) {
        this._events[event] = handler;
        return this;
    }

    connect(config) {
        // Simulate async connect success
        setTimeout(() => {
            this._connected = true;  // set the connected flag to true.
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
