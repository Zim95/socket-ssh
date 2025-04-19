const {validateSchema} = require('./utils');


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
    constructor(clientConnection, data, extraParams={}) {
        super(clientConnection, data, extraParams);
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
            // handle logic
            
        } catch (error) {
            // handle errors.
            console.error('Error handling message:', error);
            // send errors to the socket connection.
            this.clientConnection.send(JSON.stringify({ error: error.message }));
        }
    }
}


class SSHSendHandler extends MessageHandler {
    constructor(clientConnection, data, extraParams={}) {
        super(clientConnection, data, extraParams);
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
            // handle logic
            // this.clientConnection.send(JSON.stringify({ message: this.data.message }));
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
    constructor(clientConnection, data, extraParams={}) {
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
            'sshSendData': SSHSendHandler
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
            clientConnection.send(JSON.stringify({ error: error.message }));
        }
    }
}


module.exports = { RequestHandler };
