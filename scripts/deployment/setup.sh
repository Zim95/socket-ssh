#!/bin/bash

# Check if enough arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <namespace> <repo-name> <socket-ssh-host> <device-agent-local-api-url> <allowed-origins-prod>"
    exit 1
fi

YAML=./infra/deployment/deployment.yaml
NAMESPACE=$1
REPO_NAME=$2
SOCKET_SSH_HOST=$3
# P11: no more REDIS_* here - socket-ssh consumes ws_tokens via Cloud's HTTP API now.
# Migration Part 13: no more BROWSETERM_CLOUD_API_URL/DEVICE_TOKEN/CLOUD_INGRESS_HOST(_IP) -
# terminal tickets are consumed via a gRPC call to Device Agent's private, in-cluster local API
# (src/device_agent_client.js) instead of calling Cloud directly, so the old single-Mac
# two-cluster hostAliases workaround for reaching Cloud's own hostname no longer applies here.
DEVICE_AGENT_LOCAL_API_URL=$4
ALLOWED_ORIGINS_PROD=$5

export NAMESPACE=$NAMESPACE
export REPO_NAME=$REPO_NAME
export SOCKET_SSH_HOST=$SOCKET_SSH_HOST
export DEVICE_AGENT_LOCAL_API_URL=$DEVICE_AGENT_LOCAL_API_URL
export ALLOWED_ORIGINS_PROD=$ALLOWED_ORIGINS_PROD
envsubst < $YAML | kubectl apply -f -
