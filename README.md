# Socket SSH
WebSocket server that connects to SSH Servers and provides an socket based SSH Interface to SSH Servers. Can be used by Web Based Terminal Renderers like xterm.js.

# How to build
Run the following command to build the image
```
npm run build
```

# How to push
Run the following command to push to docker repository
```
npm run push
```
NOTE: Push only works for people who know the password or have access to PAT.


# How to run locally
- Requirements:
  - Docker needs to be installed.

Here are the steps to run locally:
1. Create the test ssh container. If you need to build the container hit:
    ```
    npm run tscbuild
    ```
    This command will build the docker image.
    Once the image is built, hit:
    ```
    npm run tscrun
    ```
    This will build the container, run it on `0.0.0.0:2223`. You can now ssh into test ubuntu ssh server by hitting:
    ```
    ssh ubuntu@localhost -p 2223
    ```
    However, for the ssh socket, we need the internal ip address. So to get the internal ip address, run:
    ```
    npm run tscechoip
    ```
    This will give you an internal ip address. Note it down.

2. Now we need the container for `socket-ssh`. Here's how to do that:
    Build if, the image is not built yet.
    ```
    npm run build
    ```
    Push if, the built image is not pushed yet.
    ```
    npm run push
    ```
    Finally, run the docker container.
    ```
    npm run dockerrun
    ```

3. Now we need to run the test client.
    Create a virtualenv and install flask.
    ```
    $ mkvirtualenv socket-ssh
    $ pip install flask
    ```
    Now use the ip address you copied, and paste it in `test_client/templates/index.html` in this line.
    ```
    var dataToSend = {
        event: 'ssh_connect',  // Event name or identifier
        ssh_hash: 'asdf',
        ssh_host: '<paste ip here>',
        ssh_port: 22,
        ssh_username: 'ubuntu',
        ssh_password: '1234'
    };
    ```
    Now run the test client.
    ```
    python test_client/test_client_server.py
    ```
    This will run our test_client on `0.0.0.0:8375`.
    Open the browser and type `0.0.0.0:8375` to view the client.


# Concerns
1. Scaling websockets.
2. Securing websockets with SSL.
3. Securing websockets endpoint with AUTH.
4. Deploying locally for test.
5. Deploying on k8s