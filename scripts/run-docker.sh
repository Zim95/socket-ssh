#!/bin/bash

IMAGE_NAME="socket-ssh"
IMAGE_TAG="latest"
CONTAINER_NAME="socket-ssh-container"
CONTAINER_BIND="0.0.0.0:8000:8000"
CONTAINER_NETWORK="socket-ssh-network"

docker container run -d \
    --name "$CONTAINER_NAME" \
    --network "$CONTAINER_NETWORK" \
    -p "$CONTAINER_BIND" \
    -v ./:/app/ \
    "$IMAGE_NAME:$IMAGE_TAG"
