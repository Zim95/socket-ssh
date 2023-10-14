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
