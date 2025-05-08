FROM node:22.13.1-alpine

# Install bash - This is because alpine doesn't have bash by default. Only has shell.
# All of our scripts are written in bash.
RUN apk add --no-cache bash

RUN mkdir app
COPY . app/
WORKDIR /app

# Make the entrypoint script executable
RUN chmod +x infra/deployment/entrypoint.sh

# Install node modules
RUN npm install

# expose the port
EXPOSE 8000

# Use the entrypoint script
ENTRYPOINT ["bash", "-c", "./infra/deployment/entrypoint.sh"]
