# Makefile for building and pushing Docker image

# Define the script files
BUILD_SCRIPT = ./build_image.sh
PUSH_SCRIPT = ./push_image.sh

# Targets
# NOTE: @ is for supressing the command from being displayed in the output.
build:
	@echo "Building Docker image..."
	@$(BUILD_SCRIPT)

push:
	@echo "Pushing Docker image to the repository..."
	@$(PUSH_SCRIPT)

buildpush: build push

.PHONY: build push buildpush
