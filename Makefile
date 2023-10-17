# Makefile for building and pushing Docker image

# Define the script files
BUILD_SCRIPT = ./scripts/build.sh
PUSH_SCRIPT = ./scripts/push.sh

# Targets

build:
	@chmod +x $(BUILD_SCRIPT)
	@echo "Building Docker image..."
	@$(BUILD_SCRIPT)

push:
	@chmod +x $(PUSH_SCRIPT)
	@echo "Pushing Docker image to the repository..."
	@$(PUSH_SCRIPT)

buildpush: build push

.PHONY: build push buildpush

# demo stuff
BUILD_TEST_SSH_CONTAINER_SCRIPT = ./test_ssh_container/test_ssh_build.sh
RUN_TEST_SSH_CONTAINER_SCRIPT = ./test_ssh_container/test_ssh_run.sh

runtestsshcontainer:
	@chmod +x $(BUILD_TEST_SSH_CONTAINER_SCRIPT)
	@chmod +x $(RUN_TEST_SSH_CONTAINER_SCRIPT)
	@$(BUILD_TEST_SSH_CONTAINER_SCRIPT)
	@$(RUN_TEST_SSH_CONTAINER_SCRIPT)
