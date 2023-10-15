# BrowseTerm Socket
A socket server to connect to SSH server as per the data provided.

# How to build
Run the following command to build the image
```
make build
```

# How to push
Run the following command to push to docker repository
```
make push
```
NOTE: Push only works for people who know the password or have access to PAT.

# How to build and push
Run the following command to build the image and push to repository
```
make buildpush
```
NOTE: Push only works for people who know the password or have access to PAT. Therefore, this step also requires people to know the password or have access to PAT.

# How to run locally
To run locally you can do one of the following:
1. Run locally with Python.
    ```
    python app.py
    ```
2. Run inside container. Make sure the image is built prior to this.
    ```
    docker container run -d \
        --name browseterm-socket \
        -p 0.0.0.0:8000:8000 \
        browseterm-socket:latest
    ```

# TODOS
1. Resolve bug: sudo apt-get install, top require enter to be pressed before receiving data from shell.
2. Add type hints properly.
3. Resolve bug: When running inside docker container, it cannot connect to localhost which refers to outside the container.