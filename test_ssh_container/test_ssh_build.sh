#!/bin/bash
IMAGE_NAME="test_ssh_ubuntu"
IMAGE_TAG="latest"
DOCKERFILE_NAME="./test_ssh_container/Dockerfile.ubuntu"
REPO_NAME="zim95"

# built the docker image
docker image build --no-cache -t "$IMAGE_NAME:$IMAGE_TAG" -f  "$DOCKERFILE_NAME" .

# tag the docker image
docker tag "$IMAGE_NAME:$IMAGE_TAG" "$REPO_NAME/$IMAGE_NAME:$IMAGE_TAG"
