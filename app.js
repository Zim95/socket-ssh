/*
This is the main app.js for ssh socket client.
1. Starts a websocket server and listen for events.
2. Based on the event call an eventHandler.

Author: Namah Shrestha
*/

//imports
const WebSocket = require('ws');
const sshClient = require('./src/sshClient');

// Connect event and Data event.
const eventMapping = {
  'ssh_connect': sshClient.connectToSSH,
  'data': sshClient.sendDataToSSH
};

// Create a Server. Create a global sshSocketClient.
const server = new WebSocket.Server({ port: 8000 });
let sshSocketClient = new sshClient.SSHSocketClient();

// Server listener.
server.on('connection', (websocket) => {
  // On websocket message: Handle event and call eventHandler.
  websocket.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const eventHandler = eventMapping[data.event];
      if (!eventHandler) {
        throw new Error(`Invalid event: ${data.event}`);
      }
      await eventHandler(websocket, sshSocketClient, data);
    } catch (error) {
      console.error(`Error processing message: ${error.message}`);
    }
  });
});

console.log('Server running on ws://0.0.0.0:8000');