#!/bin/bash
set -euo pipefail

# Check if enough arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <docker-username> <docker-repository>"
    exit 1
fi

# Read arguments
USERNAME=$1
REPOSITORY=$2
# Image details
IMAGE_NAME=socket-ssh
IMAGE_TAG=latest
DOCKERFILE=./infra/deployment/Dockerfile

# A plain `docker login -u "$USERNAME"` with no password blocks on an interactive prompt, which
# hard-fails when this script runs non-interactively (the Desktop app's own Setup button, via
# desktop/local_stack.py's _build_socket_ssh_image) - same fix as browseterm-device-agent's own
# build.sh: skip login when Docker Hub credentials are already cached in ~/.docker/config.json.
DOCKER_CONFIG_FILE="${DOCKER_CONFIG:-$HOME/.docker}/config.json"
if [ -f "$DOCKER_CONFIG_FILE" ] && grep -q '"https://index.docker.io/v1/"' "$DOCKER_CONFIG_FILE"; then
    echo "Already authenticated with Docker Hub (cached credentials found) - skipping docker login"
else
    docker login -u "$USERNAME"
fi

# Build image
docker image build -t $IMAGE_NAME:$IMAGE_TAG -f $DOCKERFILE .

# Tag image
docker image tag $IMAGE_NAME:$IMAGE_TAG $REPOSITORY/$IMAGE_NAME:$IMAGE_TAG

# Push image
docker push $REPOSITORY/$IMAGE_NAME:$IMAGE_TAG
