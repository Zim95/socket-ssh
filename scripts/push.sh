#!/bin/bash

# Define the image and tag
IMAGE_NAME="socket-ssh"
IMAGE_TAG="latest"
REPO_NAME="zim95"

# Log in to Docker Hub (You'll be prompted to enter your Docker Hub credentials)
docker login -u "$REPO_NAME"

# Optionally, if you've tagged the image with the repository name in the build script
IMAGE_NAME="$REPO_NAME/$IMAGE_NAME"

# Push the Docker image to the repository
docker push "$IMAGE_NAME:$IMAGE_TAG"
