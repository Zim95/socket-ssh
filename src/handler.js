const echoHandler = (message) => {
    return `Received Message: ${message}`;
};


const SSHConnectHandler = (message) => {
    return `Received Message: ${message}`;
};


const SSHSendHandler = (message) => {
    return `Received Message: ${message}`;
};


const handlerMap = {
    'echo': echoHandler,
    'connect_to_ssh': SSHConnectHandler,
    'send_to_ssh': SSHSendHandler,
};


export const handle = (message) => {
    // validate the message properties.
    // assign to proper handler.
    // return results.
};
