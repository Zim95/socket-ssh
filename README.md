# BrowseTerm Socket
WebSocket server that connects to SSH Servers and provides an socket based SSH Interface to SSH Servers. Can be used by Web Based Terminal Renderers like xterm.js.

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
- Requirements:
  - Docker needs to be installed
  - Create a virtual environment and hit: `pip install -r requirements.txt`.

To run locally outside the docker container you can do the following:
1. Create the test ssh container:
    ```
    make runtestsshcontainer
    ```
    This will build the container, run it on `0.0.0.0:2223`.

2. Open up a terminal and run the python socket server:
    ```
    python app.py
    ```
    This will run our socket server on `0.0.0.0:8000`

3. Open up another terminal and run the test client:
    ```
    python test_client/test_client_server.py
    ```
    This will run our test_client on `0.0.0.0:8375`.
    Open the browser and type `0.0.0.0:8375` to view the client.

# TODOS
1. Resolve bug: sudo apt-get install, top require enter to be pressed before receiving data from shell.
2. Low priority: Add type hints properly.
3. Add a way to run server, client and ssh_container inside docker.
4. Allow private key connection to ssh_container.
5. Add security in websocket layer.
6. Scale websockets: Loadbalancer, workers?
7. Deploy on k8s
8. Add deployment in Docker with docker networks.

