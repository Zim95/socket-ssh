/*
    We can use the socketSSHClient to connect, send and receive data to and from the SSH server.
    However, they happen in seperate requests.
    So, we use a hash to track the request.
    This class is like a redis store. We create this when the server starts.

    Each wesocket lifecycle has its own context.
    The context has 3 parts:
    1. requestHash - This is the lifecycle hash. As long as the connection is alive, this hash can be used.
    2. socketSSHClient - A socketSSHClient object. It can connect and send and receive data to and from the SSH server.
                        Every request hash is assigned a socketSSHClient object.
    3. sshChannel - This is the sshChannel which creates the SSHClient and the Stream. This is the actual sender and reciever of data.
                    socketSSHClient needs this channel to function. This is included in the socketSSHClient object.
*/

class RequestHashStore {

    constructor() {
        this.requestHashStore = {}
    }

    addRequestEntry = (requestHash, socketSSHClientObject) => {
        this.requestHashStore[requestHash] = socketSSHClientObject;
    }

    getRequestEntry = (requestHash) => {
        return this.requestHashStore[requestHash];
    }

    removeRequestEntry = (requestHash) => {
        delete this.requestHashStore[requestHash];
    }
}

module.exports = RequestHashStore;
