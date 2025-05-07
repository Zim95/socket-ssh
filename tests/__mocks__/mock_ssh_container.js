const k8s = require('@kubernetes/client-node');
const fs = require('fs');

// setup k8s api
const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

// get the environment variables
const env = fs.readFileSync(`${process.cwd()}/env.mk`, 'utf8');
const namespace = env.split('NAMESPACE=')[1].split('\n')[0];
const repoName = env.split('REPO_NAME=')[1].split('\n')[0];

// setup config
const config = {
    podName: 'test-ssh-server',
    containerName: 'test-ssh-server',
    imageName: `${repoName}/test-ssh-server:latest`,
    serviceName: 'test-ssh-server',
    namespace: namespace,
    sshUsername: 'testuser',
    sshPassword: 'testpassword'
}

// Setup mock pod manifest
const MOCK_POD_MANIFEST = {
    metadata: {
        name: config.podName,
        labels: {
            app: config.podName
        }
    },
    spec: {
        containers: [{
            name: config.containerName,
            image: config.imageName,
            ports: [{
                containerPort: 22
            }],
            env: [{
                name: 'SSH_USERNAME',
                value: config.sshUsername
            }, {
                name: 'SSH_PASSWORD',
                value: config.sshPassword
            }]
        }]
    }
};

// Setup mock service manifest
const MOCK_SERVICE_MANIFEST = {
    metadata: {
        name: config.serviceName
    },
    spec: {
        selector: {
            app: config.podName
        },
        ports: [{
            port: 2222,
            targetPort: 22
        }]
    }
};


const runContainer = async () => {
    // Start the kubernetes container.
    await k8sApi.createNamespacedPod(config.namespace, MOCK_POD_MANIFEST);
    const createdService = await k8sApi.createNamespacedService(config.namespace, MOCK_SERVICE_MANIFEST);
    return createdService;
}


const waitForContainerToBeReady = async (intervalMs = 1000, timeoutMs = 30000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const res = await k8sApi.readNamespacedPod(config.podName, config.namespace);
        const pod = res.body;

        const isRunning = pod.status?.phase === 'Running';
        const isReady = pod.status?.conditions?.some(
            condition => condition.type === 'Ready' && condition.status === 'True'
        );

        if (isRunning && isReady) {
            return;
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    throw new Error('Timeout: Pod did not become Ready in time');
};


const deleteContainer = async () => {
    // Remove the kubernetes container.
    await k8sApi.deleteNamespacedPod(config.podName, config.namespace);
    await k8sApi.deleteNamespacedService(config.serviceName, config.namespace);
}


module.exports = {
    runContainer,
    deleteContainer,
    waitForContainerToBeReady
}