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

# How to build and push
Run the following command to build the image and push to repository
```
make buildpush
```

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