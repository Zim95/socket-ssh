import asyncio
import logging
import websockets
import json
import types

# modules
import src.ssh_client as ssh_client

# Logging configuration
logging.basicConfig(
    format='%(asctime)s:%(levelname)s:%(message)s',
    level=logging.INFO
)
logger: logging.Logger = logging.getLogger(__name__)


# ssh_client
ssh_socket_client: ssh_client.SSHSocketClient = ssh_client.SSHSocketClient()


# event mapping
event_mapping: dict = {
    "ssh_connect": ssh_client.connect_to_ssh,
    "data": ssh_client.send_data_to_ssh
}


async def server(
    websocket,
    path: str
) -> None:
    """
    Async WebSocket Server Handler.
    Loads the message, identifies the event
    and calls the event handler from  event_mapping.

    Author: Namah Shrestha
    """
    global ssh_socket_client
    async for message in websocket:
        data: dict = json.loads(message)
        event_handler: types.FunctionType = event_mapping.get(
            data.get("event"))
        if not event_handler:
            raise KeyError(f"Invalid event: {data.get('event')}")
        await event_handler(
            websocket=websocket,
            ssh_socket_client=ssh_socket_client,
            data=data
        )


if __name__ == "__main__":
    start_server = websockets.serve(server, "0.0.0.0", 8000)
    asyncio.get_event_loop().run_until_complete(start_server)
    asyncio.get_event_loop().run_forever()
