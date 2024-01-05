#!/bin/bash

# Define the image and tag
IMAGE_NAME="socket-ssh"
IMAGE_TAG="latest"
REPO_NAME="zim95"

# Build the Docker image
docker build --no-cache -t "$IMAGE_NAME:$IMAGE_TAG" .

# Optionally, you can tag the image with the repository name
docker tag "$IMAGE_NAME:$IMAGE_TAG" "$REPO_NAME/$IMAGE_NAME:$IMAGE_TAG"
