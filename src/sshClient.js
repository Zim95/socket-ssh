const { Client } = require('ssh2');

class SSHSocketClient {
  constructor() {
    this.sshConf = {};
    this.channels = {};
  }

  setSSHConf(sshHash, sshConfData) {
    this.sshConf[sshHash] = {
      host: sshConfData["ssh_host"],
      port: sshConfData["ssh_port"],
      username: sshConfData["ssh_username"],
      password: sshConfData["ssh_password"],
    };
  }

  async setChannel(sshHash, websocket) {
    if (!this.sshConf[sshHash]) {
        throw new Error(`SSH Conf has not been set for sshHash: ${sshHash}`);
    }

    const ssh = new Client();

    ssh.on('ready', () => {
      // send initial ssh connection message.
      websocket.send("\r\n*** SSH CONNECTION ESTABLISHED ***\r\n");
      
      // add stream functionality
      ssh.shell((err, stream) => {
        if (err) {
            return socket.emit("\r\n*** SSH SHELL ERROR: " + err.message + " ***\r\n");
        }
        stream.on('data', (data) => {
            // Send the data to the WebSocket client
            websocket.send(data.toString());
        });
        stream.on('close', () => {
            // Handle channel close event
            ssh.end();
            delete this.channels[sshHash];
        });
        
        this.channels[sshHash] = stream;
      });
    });
    ssh.on('close', () => {
      websocket.send("\r\n*** SSH CONNECTION CLOSED ***\r\n");
    });
    ssh.on('error', (error) => {
      websocket.send("\r\n*** SSH CONNECTION ERROR: " + error.message + " ***\r\n");
    });
    return ssh;
  }

  getChannel(sshHash) {
    if (!this.channels[sshHash]) {
      throw new Error(`Channel for sshHash ${sshHash} has not been created!`);
    }
    return this.channels[sshHash];
  }

  getConf(sshHash) {
    if (!this.sshConf[sshHash]) {
      throw new Error(`SSH Conf for sshHash ${sshHash} has not been created!`);
    }
    return this.sshConf[sshHash];
  }

  deleteChannel(sshHash) {
    if (this.channels[sshHash]) {
      this.channels[sshHash].end();
      delete this.channels[sshHash];
    }
  }
}

async function connectToSSH(websocket, sshSocketClient, data) {
  try {
    sshSocketClient.setSSHConf(data["ssh_hash"], data);
    const ssh = await sshSocketClient.setChannel(data["ssh_hash"], websocket);
    ssh.connect(sshSocketClient.getConf(data["ssh_hash"]));
    return sshSocketClient;
  } catch (error) {
    websocket.send(`\r\n*** SSH CONNECTION ERROR: ${error.message} ***\r\n`);
  }
}

async function sendDataToSSH(websocket, sshSocketClient, data) {
  try {
    const sshHash = data["ssh_hash"];
    const message = data["message"];  
    const channel = sshSocketClient.getChannel(sshHash);
    channel.write(message);
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = {
  SSHSocketClient,
  connectToSSH,
  sendDataToSSH,
};
