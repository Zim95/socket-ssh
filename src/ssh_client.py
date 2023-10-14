# builtins
from collections import defaultdict
import asyncio
import time

# third party
import paramiko


class SSHSocketClient:

    def __init__(self) -> None:
        self.ssh_conf: dict = defaultdict(lambda: defaultdict(str))
        self.channels: dict = {}
    
    def set_ssh_conf(self, ssh_hash: str, ssh_conf_data: dict) -> None:
        """
        Set the configuration for SSH Client.

        Author: Namah Shrestha
        """
        self.ssh_conf[ssh_hash]["host"] = ssh_conf_data["ssh_host"]
        self.ssh_conf[ssh_hash]["port"] = ssh_conf_data["ssh_port"]
        self.ssh_conf[ssh_hash]["username"] = ssh_conf_data["ssh_username"]
        self.ssh_conf[ssh_hash]["password"] = ssh_conf_data["ssh_password"]
    
    def set_channel(self, ssh_hash: str) -> None:
        """
        Create the SSH Channel and assign it to an SSH Hash.

        Author: Namah Shrestha
        """
        if not self.ssh_conf.get(ssh_hash):
            raise ValueError(f"SSH Conf has not been set for ssh_hash: {ssh_hash}")
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(
            self.ssh_conf[ssh_hash]["host"],
            port=self.ssh_conf[ssh_hash]["port"],
            username=self.ssh_conf[ssh_hash]["username"],
            password=self.ssh_conf[ssh_hash]["password"]
        )
        transport = ssh.get_transport()
        self.channels[ssh_hash] = transport.open_session()
        self.channels[ssh_hash].get_pty()
        self.channels[ssh_hash].invoke_shell()

    def get_channel(self, ssh_hash: str):
        if not self.channels.get(ssh_hash):
            raise KeyError(f"Channel for {ssh_hash=} has not been created!")
        return self.channels[ssh_hash]

    def delete_channel(self, ssh_hash: str):
        if self.channels.get(ssh_hash):
            del self.channels[ssh_hash]


async def read_from_channel(
    websocket,
    ssh_socket_client,
    ssh_hash: str,
) -> None:
    try:
        channel = ssh_socket_client.get_channel(ssh_hash=ssh_hash)
        start_time = time.time()
        timeout = 0.1
        while True:
            if channel.recv_ready():
                data = channel.recv(1024)
                if not data:
                    break
                await websocket.send(data.decode('utf-8'))
            else:
                # wait for some time and time out
                if time.time() - start_time > timeout:
                    break
    except KeyError as ke:
        raise KeyError(ke)


async def connect_to_ssh(
    websocket,
    ssh_socket_client,
    data: dict
) -> None:
    """
    # When we update the ssh_socket_client,
    # We are updating the actual ssh_socket_client,
    # Because we are passing from reference.
    """
    ssh_socket_client.set_ssh_conf(
        ssh_hash=data["ssh_hash"],
        ssh_conf_data=data
    )
    try:
        ssh_socket_client.set_channel(ssh_hash=data["ssh_hash"])
        await read_from_channel(
            websocket, ssh_socket_client, data["ssh_hash"]
        )
    except Exception as e:
        await websocket.send(f"\r\n*** SSH CONNECTION ERROR: {str(e)} ***\r\n")


async def send_data_to_ssh(
    websocket,
    ssh_socket_client,
    data: dict
) -> None:
    
    try:
        ssh_hash: str = data.get('ssh_hash')
        message: str = data.get('message')
        channel = ssh_socket_client.get_channel(ssh_hash=ssh_hash)
        await asyncio.to_thread(channel.send, message)
        await read_from_channel(
            websocket, ssh_socket_client, ssh_hash
        )
    except KeyError as ke:
        raise KeyError(ke)
