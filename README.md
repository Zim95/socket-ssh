# Socket-SSH
A websocket interface to SSH servers.


## How to setup for development?
Make sure you have docker installed. Works with docker desktop for mac.
1. Clone the repository.
    ```
    git clone https://github.com/Zim95/socket-ssh.git
    ```
    Then navigate into the repository.
    ```
    cd socket-ssh
    ```

2. Make the entrypoint script executable.
    ```
    chmod +x infra/development/entrypoint-development.sh
    ```

3. Create an `env.mk` file with the following variables:
    ```
    REPO_NAME=<your-dockerhub-username>
    USER_NAME=<your-dockerhub-username>
    NAMESPACE=<your-namespace>
    HOST_DIR=<your-working-directory>
    ```

4. Run the development build script, if not already done.
    ```
    make dev_build
    ```

5. Run the development setup script.
    ```
    make dev_setup
    ```

6. Get inside the pod:
    First check the pod status:
    ```
    kubectl get pods -n <your-namespace>  --watch
    ```
    You should see the pod being created and then it will be running.
    ```
    NAME                                             READY   STATUS    RESTARTS       AGE
    socket-ssh-development-86c99bf745-qf6n4          1/1     Running   0              6m42s
    ```
    Once the pod is running, get inside the pod:
    ```
    kubectl exec -it socket-ssh-development-86c99bf745-qf6n4 -n <your-namespace> -- bash
    ```
    Now you are inside the pod.

7. Now we test if your local working directory is mounted to the pod.
    In your text editor outside the pod (in your local machine - working directory), create a new file and save it as `test.js`. Check if that file is present in the pod.
    ```
    ls
    ```
    You should see the `test.js` file.
    This means that your local working directory is mounted to the pod. You can make changes in your working directory and they will be reflected in the pod.
    You are free to develop the code and test the workings.

8. Once done you can run the teardown script.
    ```
    make dev_teardown
    ```


## How to setup?
1. This codebase only has build command for production setup.
    ```
    make prod_build
    ```

2. The deployment of this image happens directly through other services.


## How to run tests?
1. We need to first setup development. Follow the setup for development part.
2. After following the development setup, you should be inside the pod. Do not run step 8 (do not teardown basically).
3. Then inside the pod, just run:
    ```
    npm run test
    ```
    NOTE: Sometimes 2 tests fail in `ssh.test.js`. This is just because the pod wasn't ready for ssh commands before jest exists. It happens sometimes.
    Please re-run the test and you should be fine.
