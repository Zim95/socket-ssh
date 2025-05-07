/*
    This class uses the sshChannelObject to connect to the SSH server.
    It also uses the sshChannelObject to send and receive data to and from the SSH server.
*/

class SocketSSHClient {
    constructor(sshChannelObject) {
        this.sshChannelObject = sshChannelObject;
    }

    connectToSSH = (connectInfo) => {
        this.sshChannelObject.getSSHClient().connect(connectInfo);
    }

    sendDataToSSH = (message) => {
        this.sshChannelObject.getSSHStream().write(message);
    }

    close = () => {
        if (this.sshChannelObject?.ssh) {
            this.sshChannelObject.ssh.end();
        }
    }
}


module.exports = SocketSSHClient;
