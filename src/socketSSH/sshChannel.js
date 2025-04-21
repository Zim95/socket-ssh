const { Client } = require('ssh2');


class SSHChannel {
    constructor(websocket) {
        this.websocket = websocket;
        this.ssh = new Client();
        this.stream = null;
    }

    getSSHShell = () => {
        /*
            This returns a stream for the SSH Shell.
            This is what we will use to get data from SSH in streams.
            This returns a promise, so the methods that use it will have to await this method.
            We can also use then and catch but we will use await instead.
        */
        return new Promise((resolve, reject) => {
            this.ssh.shell((err, stream) => {
                if (err) {
                    reject(err);
                    return;
                }
                stream.on('data', (data) => {
                    this.websocket.send(data.toString());
                });
                stream.on('close', () => {
                    this.ssh.end();
                });
                resolve(stream);
            });
        });
    }

    readyHandler = async () => {
        /*
            Upon ready we send a message and then assign a stream to our object.
            THIS SETS THE STREAM.
        */
        try {
            this.stream = await this.getSSHShell(); // assign it to the stream.
            this.websocket.send("\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
        } catch(err) {
            console.error('Error from SSH Shell: ', err);
            this.websocket.send("\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n");
        }
    }

    closeHandler = () => {
        /*
            Close the SSH connection
        */
        this.websocket.send("\r\n*** SSH CONNECTION CLOSED ***\r\n");
    }

    errorHandler = (error) => {
        /*
            Send error to the websocket.
        */
        console.error('Error from SSH Connection:', error);
        this.websocket.send("\r\n*** SSH CONNECTION ERROR: " + error.message + " ***\r\n");
    }

    getSSHClient = () => {
        /*
            Map the events on this.ssh and return it.
            This is the SSH Client which can be used to connect to a server.
        */
        this.ssh.on('ready', async () => await this.readyHandler());
        this.ssh.on('close', () => this.closeHandler());
        this.ssh.on('error', (error) => this.errorHandler(error));
        return this.ssh;
    }

    getSSHStream = () => {
        /*
            This is the actual stream which we can use to write the data to the SSH Connection.
            If stream is null, it means there is no connection. So we raise an error.
        */
        if (this.stream === null) {
            throw new Error('SSH stream is not ready. Ensure SSH client is connected and the "ready" event has fired.');
        }
        return this.stream;
    }
}


module.exports = SSHChannel;
