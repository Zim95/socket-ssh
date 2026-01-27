#!/bin/bash

# Check if enough arguments are provided
if [ $# -lt 2 ]; then
    echo "Usage: $0 <namespace> <repo-name>"
    exit 1
fi

YAML=./infra/deployment/deployment.yaml
NAMESPACE=$1
REPO_NAME=$2
SOCKET_SSH_HOST=$3
REDIS_HOST=$4
REDIS_PORT=$5
REDIS_USERNAME=$6
REDIS_PASSWORD=$7
REDIS_DB=$8
ALLOWED_ORIGINS_PROD=$9

export NAMESPACE=$NAMESPACE
export REPO_NAME=$REPO_NAME
export SOCKET_SSH_HOST=$SOCKET_SSH_HOST
export REDIS_HOST=$REDIS_HOST
export REDIS_PORT=$REDIS_PORT
export REDIS_USERNAME=$REDIS_USERNAME
export REDIS_PASSWORD=$REDIS_PASSWORD
export REDIS_DB=$REDIS_DB
export ALLOWED_ORIGINS_PROD=$ALLOWED_ORIGINS_PROD
envsubst < $YAML | kubectl apply -f -
