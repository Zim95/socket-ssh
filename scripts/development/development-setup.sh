#!/bin/bash

# Check if enough arguments are provided
if [ $# -lt 3 ]; then
    echo "Usage: $0 <namespace> <absolute-path-to-current-working-directory> <repo-name> <socket-ssh-host> <device-agent-local-api-url> <allowed-origins-dev>"
    exit 1
fi

YAML=./infra/development/development.yaml
NAMESPACE=$1
HOSTPATH=$2
REPO_NAME=$3
SOCKET_SSH_HOST=$4
# P11: no more REDIS_* here - socket-ssh consumes ws_tokens via Cloud's HTTP API now.
# Migration Part 13: no more BROWSETERM_CLOUD_API_URL - terminal tickets are consumed via
# Device Agent's local API instead of calling Cloud directly.
DEVICE_AGENT_LOCAL_API_URL=$5
ALLOWED_ORIGINS_DEV=$6

export NAMESPACE=$NAMESPACE
export HOSTPATH=$HOSTPATH
export REPO_NAME=$REPO_NAME
export SOCKET_SSH_HOST=$SOCKET_SSH_HOST
export DEVICE_AGENT_LOCAL_API_URL=$DEVICE_AGENT_LOCAL_API_URL
export ALLOWED_ORIGINS_DEV=$ALLOWED_ORIGINS_DEV
envsubst < $YAML | kubectl apply -f -
