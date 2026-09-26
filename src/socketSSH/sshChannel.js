const { Client } = require('ssh2');
const logger = require('../logger');


class SSHChannel {
    constructor(websocket) {
        this.websocket = websocket;
        this.ssh = new Client();
        this.stream = null;
        this._listenersAttached = false;
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
                    this.websocket.send(JSON.stringify({ message: data.toString() }));
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
        logger.info('SSH ready event fired - getting shell');
        try {
            this.stream = await this.getSSHShell(); // assign it to the stream.
            logger.info('SSH shell acquired successfully');
            this.websocket.send(JSON.stringify({ message: "\r\n*** SSH CONNECTION ESTABLISHED ***\r\n" }));
        } catch(err) {
            logger.error({ err }, 'Error from SSH Shell');
            this.websocket.send(JSON.stringify({ error: err.message }));
        }
    }

    closeHandler = () => {
        /*
            Close the SSH connection
        */
        this.websocket.send(JSON.stringify({ message: "\r\n*** SSH CONNECTION CLOSED ***\r\n" }));
    }

    errorHandler = (error) => {
        /*
            Send error to the websocket.
        */
        logger.error({ err: error }, 'Error from SSH Connection');
        this.websocket.send(JSON.stringify({ error: error.message }));
    }

    getSSHClient = () => {
        /*
            Map the events on this.ssh and return it.
            This is the SSH Client which can be used to connect to a server.

            Defense in depth (2026-09-26): idempotent - a second call must never attach a
            duplicate set of listeners onto the same underlying ssh2.Client. Each SSHChannel is
            now only ever used for a single connect attempt (handler.js's SSHConnectHandler
            always creates a fresh SSHChannel per sshConnect, never reuses one), but this guard
            keeps that invariant even if something else calls it more than once.
        */
        if (this._listenersAttached) return this.ssh;
        this._listenersAttached = true;
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
