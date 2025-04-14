const echoHandler = (data) => {
    return { message: data.message };
};


const SSHConnectHandler = (data) => {
    return { message: data.message };
};


const SSHSendHandler = (data) => {
    return { message: data.message };
};


const handlerMap = {
    'echo': echoHandler,
    'connect_to_ssh': SSHConnectHandler,
    'send_to_ssh': SSHSendHandler,
};


const isMessageValid = (message) => {
    /*
        This function is used to validate the message.
        It checks if the message has the correct properties and types.
        It should match the schema.
        The schema has keys and values. Key is the name of the property and value is the type of the property.

        :params:
          message: Message from the client.
        :returns: true if the message is valid, false otherwise.
    */

    // schema for the message
    const schema = {
        type: 'string',
        data: 'object',
    };

    // We check if the schema key exists and the type is correct.
    return Object.entries(schema).every(([key, expectedType]) => {
        return key in message && typeof message[key] === expectedType;
    });
};


const handle = (message) => {
    /*
        This function is the main handler for the message.
        It validates the message, assigns to the proper handler, and returns the result.

        :params:
          message: Message from the client.
        :returns: Result from the handler.
    */

    // validate the message properties.
    if (!isMessageValid(message)) return { error: 'Invalid message format. Example message: {"type": "echo", "data": {"message": "Hello, world!"}}' };
    // assign to proper handler.
    const handler = handlerMap[message.type];
    if (!handler) return { error: `Invalid message type: ${message.type}` };
    // return results.
    return handler(message.data);
};


module.exports = { handle };
