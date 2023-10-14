#!/bin/bash

# Log in to Docker Hub (You'll be prompted to enter your Docker Hub credentials)
docker login

# Define the image and tag
IMAGE_NAME="browseterm-socket"
TAG="latest"

# Optionally, if you've tagged the image with the repository name in the build script
IMAGE_NAME="zim95/$IMAGE_NAME"

# Push the Docker image to the repository
docker push "$IMAGE_NAME:$TAG"
