#!/bin/bash

# Define the image and tag
IMAGE_NAME="browseterm-socket"
TAG="latest"

# Build the Docker image
docker build --no-cache -t "$IMAGE_NAME:$TAG" .

# Optionally, you can tag the image with the repository name
docker tag "$IMAGE_NAME:$TAG" "zim95/$IMAGE_NAME:$TAG"
