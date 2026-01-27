# Variables
include env.mk


# Development
dev_build:
	./scripts/test_ssh_container/test-ssh-build.sh $(USER_NAME) $(REPO_NAME)
	./scripts/development/development-build.sh $(USER_NAME) $(REPO_NAME)

dev_setup:
	./scripts/development/development-setup.sh \
		$(NAMESPACE) \
		$(HOST_DIR) \
		$(REPO_NAME) \
		$(SOCKET_SSH_HOST) \
		$(REDIS_HOST) \
		$(REDIS_PORT) \
		$(REDIS_USERNAME) \
		$(REDIS_PASSWORD) \
		$(REDIS_DB) \
		$(ALLOWED_ORIGINS_DEV)

dev_teardown:
	./scripts/development/development-teardown.sh $(NAMESPACE)

# Production
prod_build:
	./scripts/deployment/build.sh $(USER_NAME) $(REPO_NAME)

prod_setup:
	./scripts/deployment/setup.sh \
		$(NAMESPACE) \
		$(REPO_NAME) \
		$(SOCKET_SSH_HOST) \
		$(REDIS_HOST) \
		$(REDIS_PORT) \
		$(REDIS_USERNAME) \
		$(REDIS_PASSWORD) \
		$(REDIS_DB) \
		$(ALLOWED_ORIGINS_PROD)

prod_teardown:
	./scripts/deployment/teardown.sh $(NAMESPACE)

.PHONY: dev_build dev_setup dev_teardown prod_build prod_setup prod_teardown
