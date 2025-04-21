const WebSocket = require('ws');
// mock the ssh2 module. We need to do this here, because we need to make sure, the mock happens before it is imported elsewhere.
jest.mock('ssh2', () => {
    return {
        Client: require('./__mocks__/mock.ssh2')  // SSH2 exports a Client class, so we need to do the same.
    }
});
let webSocketServer;

// setup
beforeAll(() => {
    webSocketServer = require('../server'); 
});


afterAll((done) => {
    webSocketServer.close(() => done());
    jest.resetAllMocks();
});


test('on echo - Should receive the same message back', (done) => {
    const serverConnection = new WebSocket('ws://localhost:8000');

    // Open runs once the connection is established.
    // we do a client.send. This triggers the 'message` event on the clientConnection.
    serverConnection.on('open', () => serverConnection.send('{"type": "echo", "data": {"message": "Hello World"}}'));

    // To receive the message, we need to listen for the 'message' event on the clientConnection.
    // This event is triggered when the clientConnection hits the send method.
    serverConnection.on('message', (message) => {
        try {
            // here we expect the message to be the same as the one we sent.
            expect(JSON.parse(message.toString())).toEqual({ message: 'Hello World' });
            serverConnection.close(); // This triggeres the on close event on the server.
        } catch (err) {
            console.log('Error in test:', err);
            done(err);  // Immediately end the test with done if there is an error.
        }
    });

    // This is triggered when the server sends websocket.close()
    serverConnection.on('close', () => setTimeout(() => done(), 1000)); // This gets called when the server sends clientConnection.close()
    // SetImmediate is used to schedule the done callback to be called immediately after the current operation completes.

    // This is triggered when the client encounters an error.
    serverConnection.on('error', (err) => done(err));
});


test('on sshConnect - Should get SSH connected message back', (done) => {
    /*
        Here we mock the actual connect method and return the values ourselves.
        So that we can be sure that the rest of the code related to the server is working.
        We will perform the actual test in ssh.test.js.
    */

    // create the dummy mock for getSSHClient function. It needs to have a connect method that returns test connection string.
    // const mockGetSSHClient = jest.fn();
    // mockGetSSHClient.mockReturnValue({
    //     connect: jest.fn().mockResolvedValue('Test Connection String')
    // });

    // const SSHChannel = require('../src/socketSSH/sshChannel');
    //  jest.spyOn(SSHChannel.getSSHClient, 'getSSHClient').mockImplementation(mockGetSSHClient);  // this does not work for arrow methods.
    
    /*
    Mocking Arrow methods:
    ----------------------
    1. Arrow functions when used in classes, are not MOCKABLE.
    2. This is because arrow methods are instance variables and not part of PROTOTYPE.
    3. So, we can either create an instance of the class and then mock the method. This would not work because we will not use this instance during runtime.
    4. Or we can mock the entire module and then use the mock value. To do this, we need to mock everything, even the assigning of websockets and everything which beats the purpose.
    5. We either mock the entire module, or remove arrow functions entirely and use regular methods. While using regular methods, we need to use binding.
    6. This is because regular methods are part of PROTOTYPE and are MOCKABLE.

    CHATGPT:
    ---------
    Why Arrow Functions in Classes Are Hard to Mock?
    In JavaScript, arrow functions used as class methods are not added to the class's prototype. Instead, they become properties of each instance. This design choice makes them inaccessible to tools like jest.spyOn, which rely on the prototype chain to replace or monitor method implementations. ​

    Options to Mock Arrow Functions in Classes
    Mock the Entire Module: You can mock the entire module containing the class using jest.mock(). This approach allows you to replace the class with a mock implementation, including its methods. However, this can be cumbersome if the module has many exports or complex dependencies.​
    1. Refactor to Use Regular Methods: Consider refactoring arrow functions into regular class methods. Regular methods are added to the class's prototype, making them accessible to jest.spyOn. This change enables more straightforward and granular mocking.​
    2. Use Dependency Injection: Instead of instantiating dependencies within the class, inject them from outside. This practice allows you to pass mocked dependencies during testing, facilitating better control over the class's behavior in different scenarios. ​
    */

    /*
    Update, we are going to create a mock class for SSH2.
    */

    const serverConnection = new WebSocket('ws://localhost:8000');
    // now we will trigger connect.
    serverConnection.on('open', () => serverConnection.send(
        JSON.stringify({
            type: 'sshConnect',
            data: {
                ssh_hash: 'test_hash_connect',
                ssh_host: 'test_host',
                ssh_port: 22,
                ssh_username: 'test_username',
                ssh_password: 'test_password'
            }
        })
    ));

    // now we will listen for the message.
    serverConnection.on('message', (message) => {
        try {
            expect(message.toString()).toEqual('\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
            serverConnection.close();
        } catch (err) {
            console.log('Error in test:', err);
            done(err);  // Immediately end the test with done if there is an error.
        }
    });

    // if things are fine, we close.
    serverConnection.on('close', () => setTimeout(() => done(), 1000));

    // if things go wrong, we throw an error and close the connection.
    serverConnection.on('error', (err) => done(err));
});


test('on sshSendData - Should get the response back from SSH Server', (done) => {
    /*
        Here we mock the actual connect method and return the values ourselves.
        So that we can be sure that the rest of the code related to the server is working.
        We will perform the actual test in ssh.test.js.
    */
    // create the dummy mock for getSSHClient function. It needs to have a connect method that returns test connection string.
    // const mockGetSSHClient = jest.fn();
    // mockGetSSHClient.mockReturnValue({
    //     connect: jest.fn().mockResolvedValue('Test Connection String')
    // });

    // const SSHChannel = require('../src/socketSSH/sshChannel');
    //  jest.spyOn(SSHChannel.getSSHClient, 'getSSHClient').mockImplementation(mockGetSSHClient);  // this does not work for arrow methods.
    
    /*
    Mocking Arrow methods:
    ----------------------
    1. Arrow functions when used in classes, are not MOCKABLE.
    2. This is because arrow methods are instance variables and not part of PROTOTYPE.
    3. So, we can either create an instance of the class and then mock the method. This would not work because we will not use this instance during runtime.
    4. Or we can mock the entire module and then use the mock value. To do this, we need to mock everything, even the assigning of websockets and everything which beats the purpose.
    5. We either mock the entire module, or remove arrow functions entirely and use regular methods. While using regular methods, we need to use binding.
    6. This is because regular methods are part of PROTOTYPE and are MOCKABLE.

    CHATGPT:
    ---------
    Why Arrow Functions in Classes Are Hard to Mock?
    In JavaScript, arrow functions used as class methods are not added to the class's prototype. Instead, they become properties of each instance. This design choice makes them inaccessible to tools like jest.spyOn, which rely on the prototype chain to replace or monitor method implementations. ​

    Options to Mock Arrow Functions in Classes
    Mock the Entire Module: You can mock the entire module containing the class using jest.mock(). This approach allows you to replace the class with a mock implementation, including its methods. However, this can be cumbersome if the module has many exports or complex dependencies.​
    1. Refactor to Use Regular Methods: Consider refactoring arrow functions into regular class methods. Regular methods are added to the class's prototype, making them accessible to jest.spyOn. This change enables more straightforward and granular mocking.​
    2. Use Dependency Injection: Instead of instantiating dependencies within the class, inject them from outside. This practice allows you to pass mocked dependencies during testing, facilitating better control over the class's behavior in different scenarios. ​
    */

    /*
    Update, we are going to create a mock class for SSH2.
    */

    const serverConnection = new WebSocket('ws://localhost:8000');
    let connectionEstablished = false;

    // now we will trigger connect.
    serverConnection.on('open', () => {
        serverConnection.send(
            JSON.stringify({
                type: 'sshConnect',
                data: {
                    ssh_hash: 'test_hash_send',
                    ssh_host: 'test_host',
                    ssh_port: 22,
                    ssh_username: 'test_username',
                    ssh_password: 'test_password'
                }
            })
        );
    });

    // now we will listen for the message.
    serverConnection.on('message', (message) => {
        /*
        There will be two types of messages:
        1. Connection Established.
        2. Command Response.

        If !connectionEstablished, then we expect the message to be the connection established message.
        If connectionEstablished, then we expect the message to be the command response.
        */
        try {
            if (!connectionEstablished) {
                // First verify we got the connection established message
                expect(message.toString()).toEqual('\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
                connectionEstablished = true;
                
                // Now send the command
                serverConnection.send(
                    JSON.stringify({
                        type: 'sshSendData',
                        data: {
                            ssh_hash: 'test_hash_send',
                            ssh_command: 'test_command'
                        }
                    })
                );
            } else {
                // Now verify we got the command response
                expect(message.toString()).toEqual('mock shell output\n');
                serverConnection.close();
            }
        } catch (err) {
            console.log('Error in test:', err);
            done(err);  // Immediately end the test with done if there is an error.
        }
    });

    // if things are fine, we close.
    serverConnection.on('close', () => setTimeout(() => done(), 1000));

    // if things go wrong, we throw an error and close the connection.
    serverConnection.on('error', (err) => done(err));
});

