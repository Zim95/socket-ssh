#!/bin/bash

# Check if enough arguments are provided
if [ $# -lt 3 ]; then
    echo "Usage: $0 <namespace> <absolute-path-to-current-working-directory> <repo-name>"
    exit 1
fi

YAML=./infra/development/development.yaml
NAMESPACE=$1
HOSTPATH=$2
REPO_NAME=$3
SOCKET_SSH_HOST=$4
REDIS_HOST=$5
REDIS_PORT=$6
REDIS_USERNAME=$7
REDIS_PASSWORD=$8
REDIS_DB=$9
ALLOWED_ORIGINS_DEV=${10}

export NAMESPACE=$NAMESPACE
export HOSTPATH=$HOSTPATH
export REPO_NAME=$REPO_NAME
export SOCKET_SSH_HOST=$SOCKET_SSH_HOST
export REDIS_HOST=$REDIS_HOST
export REDIS_PORT=$REDIS_PORT
export REDIS_USERNAME=$REDIS_USERNAME
export REDIS_PASSWORD=$REDIS_PASSWORD
export REDIS_DB=$REDIS_DB
export ALLOWED_ORIGINS_DEV=$ALLOWED_ORIGINS_DEV
envsubst < $YAML | kubectl apply -f -
