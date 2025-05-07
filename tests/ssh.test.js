const {runContainer, deleteContainer, waitForContainerToBeReady} = require('./__mocks__/mock_ssh_container');
const SSHChannel = require('../src/socketSSH/sshChannel');
const SocketSSHClient = require('../src/socketSSH/socketSSHClient');
const MockWebSocket = require('./__mocks__/mock.websocket');
const dummyWebSocket = new MockWebSocket();

let containerIP; // Add this at the top level to store the container IP

// Increase timeout for the tests
jest.setTimeout(1000000);  // we want to give our test enough time to build the container and run it.

beforeAll(async () => {
    console.log('Starting beforeAll...');
    // Run Container
    const createdService = await runContainer();
    containerIP = createdService.body.spec.clusterIP;
    console.log('Waiting for container to be ready...');
    await waitForContainerToBeReady();
    console.log('Container is ready');
});

afterAll(async () => {
    // delete the container after all tests are done
    console.log('Deleting container...');
    await deleteContainer();
}, 100000, {force: true});
// we are using force true here, so that afterAll is called even if the tests fail in between.
// 100000 is the timeout for the afterAll. Since deleting the container takes time.

describe('SSH Connection Tests', () => {
    /*
        Why we are using describe block here?

        Usually how beforeAll and afterAll are used:
        beforeAll -> test1 -> afterAll
        beforeAll -> test2 -> afterAll

        What we want?
        beforeAll -> test1, test2 -> afterAll

        But that doesnt happen. So what we are doing is:
        beforeAll -> describe -> afterAll

        We have all our tests inside the describe block.

        If we want to use beforeAll and afterAl after each test inside describe block.
        We can put beforeAll and afterAll inside the describe block.
    */
    test('Should connect to the SSH server', async () => {
        console.log('Started test - SSH Connection Test');
        const sshChannel = new SSHChannel(dummyWebSocket);
        const socketSSHClient = new SocketSSHClient(sshChannel);

        const messagePromise = new Promise((resolve, reject) => {
            // on message should get triggered, which will resolve the promise.
            // we can use this to make sure, jest does not finish before our message event is triggered.
            dummyWebSocket.on('message', (message) => {
                resolve(message);
            });
        });

        socketSSHClient.connectToSSH({
            host: containerIP,  // Use the container IP instead of localhost
            port: 2222,
            username: 'testuser',
            password: 'testpassword'
        });

        const recievedMessage = await messagePromise;
        expect(recievedMessage).toEqual("\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");  // this is the connection message.
        console.log('SSH Connection Test completed');

        // close the connection manually.
        socketSSHClient.close();
    });
});
