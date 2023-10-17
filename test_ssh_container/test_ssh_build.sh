#!/bin/bash
IMAGE_NAME="test_ssh_ubuntu"
IMAGE_TAG="latest"

docker image build -t "$IMAGE_NAME:$IMAGE_TAG" -f Dockerfile.ubuntu .
