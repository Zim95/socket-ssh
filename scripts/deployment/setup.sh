#!/bin/bash

# Check if enough arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <namespace> <repo-name> <socket-ssh-host> <browseterm-cloud-api-url> <allowed-origins-prod>"
    exit 1
fi

YAML=./infra/deployment/deployment.yaml
NAMESPACE=$1
REPO_NAME=$2
SOCKET_SSH_HOST=$3
# P11: no more REDIS_* here - socket-ssh consumes ws_tokens via Cloud's HTTP API now.
BROWSETERM_CLOUD_API_URL=$4
ALLOWED_ORIGINS_PROD=$5

export NAMESPACE=$NAMESPACE
export REPO_NAME=$REPO_NAME
export SOCKET_SSH_HOST=$SOCKET_SSH_HOST
export BROWSETERM_CLOUD_API_URL=$BROWSETERM_CLOUD_API_URL
export ALLOWED_ORIGINS_PROD=$ALLOWED_ORIGINS_PROD
envsubst < $YAML | kubectl apply -f -
