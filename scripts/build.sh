#!/bin/bash

# Define the image and tag
IMAGE_NAME="socket-ssh"
TAG="latest"
REPO_NAME="zim95"

# Build the Docker image
docker build --no-cache -t "$IMAGE_NAME:$TAG" .

# Optionally, you can tag the image with the repository name
docker tag "$IMAGE_NAME:$TAG" "$REPO_NAME/$IMAGE_NAME:$TAG"
