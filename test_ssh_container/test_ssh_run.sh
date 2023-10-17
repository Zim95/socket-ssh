#!/bin/bash

CONTAINER_NAME="test_ssh_ubuntu"

docker container run -d \
    --name "$CONTAINER_NAME" \
    -p 0.0.0.0:2223:22 \
    test_ssh_ubuntu:latest