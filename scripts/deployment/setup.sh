#!/bin/bash

# Check if enough arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <namespace> <repo-name> <socket-ssh-host> <browseterm-cloud-api-url> <allowed-origins-prod> [cloud-ingress-host] [cloud-ingress-host-ip]"
    exit 1
fi

YAML=./infra/deployment/deployment.yaml
NAMESPACE=$1
REPO_NAME=$2
SOCKET_SSH_HOST=$3
# P11: no more REDIS_* here - socket-ssh consumes ws_tokens via Cloud's HTTP API now.
BROWSETERM_CLOUD_API_URL=$4
ALLOWED_ORIGINS_PROD=$5
# On a single-Mac two-cluster local dev setup, BROWSETERM_CLOUD_API_URL's hostname resolves
# inside this cluster's own pods to the Mac's own /etc/hosts mapping (127.0.0.1, for the
# developer's browser), not the real Cloud cluster - see browseterm-server-local's identical
# hostAliases override for the full explanation. Required for the ws_tokens API call above to
# work at all from inside browseterm-k3s-local.
CLOUD_INGRESS_HOST=${6:-browseterm.cloud.com}
CLOUD_INGRESS_HOST_IP=${7:-}

export NAMESPACE=$NAMESPACE
export REPO_NAME=$REPO_NAME
export SOCKET_SSH_HOST=$SOCKET_SSH_HOST
export BROWSETERM_CLOUD_API_URL=$BROWSETERM_CLOUD_API_URL
export ALLOWED_ORIGINS_PROD=$ALLOWED_ORIGINS_PROD
export CLOUD_INGRESS_HOST=$CLOUD_INGRESS_HOST
export CLOUD_INGRESS_HOST_IP=$CLOUD_INGRESS_HOST_IP
envsubst < $YAML | kubectl apply -f -
