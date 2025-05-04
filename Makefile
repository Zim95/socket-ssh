# Variables
include env.mk


# Development
dev_build:
	./scripts/test_ssh_container/test-ssh-build.sh $(USER_NAME) $(REPO_NAME)
	./scripts/development/development-build.sh $(USER_NAME) $(REPO_NAME)

dev_setup:
	./scripts/development/development-setup.sh $(NAMESPACE) $(HOST_DIR) $(REPO_NAME)

dev_teardown:
	./scripts/development/development-teardown.sh $(NAMESPACE)

# Production
prod_build:
	./scripts/deployment/build.sh $(USER_NAME) $(REPO_NAME)

# This app does not have production setup and teardown.
# A container for this will be created dynamically by container-maker.
# Even the certificate environment variables will be passed dynamically.
# So we do not need to do anything here.
