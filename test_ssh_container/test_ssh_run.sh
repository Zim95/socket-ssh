#!/bin/bash

CONTAINER_NAME="test_ssh_ubuntu_container"
CONTAINER_NETWORK="socket-ssh-network"
CONTAINER_BIND="0.0.0.0:2223:22"
SSH_PASSWORD="1234"
IMAGE_NAME="test_ssh_ubuntu"
IMAGE_TAG="latest"

docker container run -d \
    --name "$CONTAINER_NAME" \
    -p "$CONTAINER_BIND" \
    -e SSH_PASSWORD="$SSH_PASSWORD" \
    --network "$CONTAINER_NETWORK" \
    "$IMAGE_NAME:$IMAGE_TAG"
