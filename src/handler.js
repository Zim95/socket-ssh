const {validateSchema} = require('./utils');
const SSHChannel = require('./socketSSH/sshChannel');
const SocketSSHClient = require('./socketSSH/socketSSHClient');


class MessageHandler {
    /*
        This class is used to handle the message.
        This is the base class for all handlers.
    */
    constructor(clientConnection, data, extraParams={}) {
        /*
            This constructor is used to initialize the Handler object.
            It takes in a clientConnection and data.
            :params:
              clientConnection: The client connection object. Websocket.
              data: JSON Data. This comes from RequestHandler.
              extraParams: Extra parameters for the handler.
        */
        this.clientConnection = clientConnection;
        this.data = data;
        this.extraParams = extraParams;
    }

    getMessageSchema = () => {
        /**
         *  @abstract
         *  This returns the schema of the message,
         *  This is to be implemented by every child class.
         *  Simply return the schema of the message.
        */
        throw new Error("Must implement getMessageSchema()");
    }

    isMessageValid = () => {
        /*
            This method is used to validate this.data.message.
            It checks if this.data.message has the correct properties and types.
            It should match the schema that we get from getMessageSchema.
            The schema has keys and values. Key is the name of the property and value is the type of the property.

            :returns: true if the data is valid, false otherwise.
        */
        const schema = this.getMessageSchema();
        return validateSchema(schema, this.data);
    }

    handle = () => {
        /**
         *  @abstract
         *  This method is used to handle the message.
         *  This is to be implemented by every child class.
        */
        throw new Error("Must implement handle()");
    }
}


class EchoHandler extends MessageHandler {
    /*
        This handler is used to echo the message back to the client.
    */
    constructor(clientConnection, data, extraParams={}) {
        super(clientConnection, data, extraParams);
    }

    getMessageSchema = () => {
        return {
            message: 'string'
        };
    }

    handle = () => {
        try {
            // validate the data and message properties.
            if (!this.isMessageValid()) return { error: `Invalid message format. The required message schema is: ${JSON.stringify(this.getMessageSchema())}`};
            // handle logic
            this.clientConnection.send(JSON.stringify({ message: this.data.message }));
        } catch (error) {
            // handle errors.
            console.error('Error handling message:', error);
            // send errors to the socket connection.
            this.clientConnection.send(JSON.stringify({ error: error.message }));
        }
    }
}


class SSHConnectHandler extends MessageHandler {
    /*
        This handler is used to connect to the SSH server.
    */
    constructor(clientConnection, data, extraParams={}) {
        super(clientConnection, data, extraParams);
        this.requestHashStore = extraParams.requestHashStore;
        this.connectionSessions = extraParams.connectionSessions;
    }

    getMessageSchema = () => {
        return {
            ssh_hash: 'string',
            ssh_host: 'string',
            ssh_port: 'number',
            ssh_username: 'string',
            ssh_password: 'string'
        };
    }

    handle = () => {
        try {
            // validate the data and message properties.
            if (!this.isMessageValid()) return { error: `Invalid message format. The required message schema is: ${JSON.stringify(this.getMessageSchema())}`};
            /**
             * 1. Check if requestHashStore is undefined.
             * 2. Check if the ssh_hash is already in the requestHashStore.
             * 3. If it is not, then we need to create a new one.
             * 4. If it is, then we can use it to connect to the SSH server.
             */
            if (this.requestHashStore === undefined) throw new Error('Request hash store needs to exist!');
            if (this.requestHashStore.getRequestEntry(this.data.ssh_hash) === undefined) {
                // create a new SSH Channel.
                const sshChannelObject = new SSHChannel(this.clientConnection);
                const socketSSHClientObject = new SocketSSHClient(sshChannelObject);
                this.requestHashStore.addRequestEntry(this.data.ssh_hash, socketSSHClientObject);
                
                // Track this session for cleanup on disconnect
                if (this.connectionSessions) {
                    const sessions = this.connectionSessions.get(this.clientConnection);
                    if (sessions) {
                        sessions.add(this.data.ssh_hash);
                    }
                }
            }
            // now in both ways, we have this.requestHashStore[this.data.ssh_hash] set. If it didnt exist, we created it.
            // If it existed, we can use it now.
            this.requestHashStore.getRequestEntry(this.data.ssh_hash).connectToSSH(
                {
                    host: this.data.ssh_host,
                    port: this.data.ssh_port,
                    username: this.data.ssh_username,
                    password: this.data.ssh_password
                }
            );
        } catch (error) {
            // handle errors.
            console.error('Error handling message:', error);
            // send errors to the socket connection.
            this.clientConnection.send(JSON.stringify({ error: error.message }));
        }
    }
}


class SSHSendHandler extends MessageHandler {
    /*
        This handler is used to send data to the SSH server.
    */
    constructor(clientConnection, data, extraParams={}) {
        super(clientConnection, data, extraParams);
        this.requestHashStore = extraParams.requestHashStore;
        this.connectionSessions = extraParams.connectionSessions;
    }

    getMessageSchema = () => {
        return {
            ssh_hash: 'string',
            ssh_command: 'string'
        };
    }

    handle = () => {
        try {
            // validate the data and message properties.
            if (!this.isMessageValid()) return { error: `Invalid message format. The required message schema is: ${JSON.stringify(this.getMessageSchema())}`};
            /**
             * 1. Check if requestHashStore is undefined.
             * 2. Check if the ssh_hash is already in the requestHashStore.
             * 3. If it is not, then we need to create a new one.
             * 4. If it is, then we can use it to send data to the SSH server.
             */
            if (this.requestHashStore === undefined) throw new Error('Request hash store needs to exist!');
            if (this.requestHashStore.getRequestEntry(this.data.ssh_hash) === undefined) {
                // create a new SSH Channel.
                const sshChannelObject = new SSHChannel(this.clientConnection);
                const socketSSHClientObject = new SocketSSHClient(sshChannelObject);
                this.requestHashStore.addRequestEntry(this.data.ssh_hash, socketSSHClientObject);
                
                // Track this session for cleanup on disconnect
                if (this.connectionSessions) {
                    const sessions = this.connectionSessions.get(this.clientConnection);
                    if (sessions) {
                        sessions.add(this.data.ssh_hash);
                    }
                }
            }
            // now in both ways, we have this.requestHashStore[this.data.ssh_hash] set. If it didnt exist, we created it.
            // If it existed, we can use it now.
            this.requestHashStore.getRequestEntry(this.data.ssh_hash).sendDataToSSH(this.data.ssh_command);
        } catch (error) {
            // handle errors.
            console.error('Error handling message:', error);
            // send errors to the socket connection.
            this.clientConnection.send(JSON.stringify({ error: error.message }));
        }
    }
}


class SSHCloseHandler extends MessageHandler {
    /*
        This handler is used to close the SSH connection.
    */
    constructor(clientConnection, data, extraParams={}) {
        super(clientConnection, data, extraParams);
        this.requestHashStore = extraParams.requestHashStore;
    }

    getMessageSchema = () => {
        return {
            ssh_hash: 'string'
        };
    }

    handle = () => {
        try {
            // validate the data and message properties.
            if (!this.isMessageValid()) return { error: `Invalid message format. The required message schema is: ${JSON.stringify(this.getMessageSchema())}`};
            /**
             * 1. Check if requestHashStore is undefined.
             * 2. Check if the ssh_hash is already in the requestHashStore.
             * 3. If it is not, then throw an error.
             * 4. If it is, then we can use it to disconnect from the SSH server.
             */
            if (this.requestHashStore === undefined) throw new Error('Request hash store needs to exist!');
            const socketSSHClientObject = this.requestHashStore.getRequestEntry(this.data.ssh_hash);
            if (socketSSHClientObject === undefined) throw new Error('SSH hash not found in request hash store!');
            // close the socketSSHClientObject.
            socketSSHClientObject.close();
            // remove the requestHashStore entry.
            this.requestHashStore.removeRequestEntry(this.data.ssh_hash);
        } catch (error) {
            // handle errors.
            console.error('Error handling message:', error);
            // send errors to the socket connection.
            this.clientConnection.send(JSON.stringify({ error: error.message }));
        }
    }
}


class RequestHandler {
    /*
        This is the message handler.
        This checks the schema and checks if the data is valid.
        Then call the handle method appropriately.
    */
    constructor(clientConnection, data, extraParams) {
        this.clientConnection = clientConnection;
        this.requestData = JSON.parse(data);
        this.extraParams = extraParams;
    }

    getDataSchema = () => {
        /* This is the schema for this.data. */
        return {
            type: 'string',
            data: 'object',
        };
    }

    isDataValid = () => {
        /*
            This method is used to validate data.
            It checks if the data has the correct properties and types.
            It should match the schema.
            The schema has keys and values. Key is the name of the property and value is the type of the property.

            :returns: true if the data is valid, false otherwise.
        */

        // schema for the data
        const schema = this.getDataSchema();
        return validateSchema(schema, this.requestData);
    }

    getHandler = () => {
        /*
            Here we assign appropriate hanlder for the message based on message type.
            If we dont find the message type then we throw an error.
        */
        const HANDLERS = {
            'echo': EchoHandler,
            'sshConnect': SSHConnectHandler,
            'sshSendData': SSHSendHandler,
            'sshClose': SSHCloseHandler
        };
        try {
            // first check the handler
            const handler = HANDLERS[this.requestData.type];
            // raise error if data type is invalid.
            if (handler === undefined) throw new Error(`Invalid type of data: ${this.requestData.type}`);
            return new handler(this.clientConnection, this.requestData.data, this.extraParams); // return handler object with clientConnection and data.
        } catch(error) {
            throw error
        }
    };

    handle = () => {
        /*
            - Check if the data is valid.
            - Get the handler object or throw error if type is invalid.
            - Call the appropriate handle method.
        */
        try {
            // validate the data and message properties.
            if (!this.isDataValid()) return { error: `Invalid data format. The required data schema is: ${JSON.stringify(this.getDataSchema())}`};
            // get handler
            const handler = this.getHandler();
            handler.handle(); // call the handle method.
        } catch (error) {
            console.error('Error handling message:', error);
            this.clientConnection.send(JSON.stringify({ error: error.message }));
        }
    }
}


module.exports = { RequestHandler };
