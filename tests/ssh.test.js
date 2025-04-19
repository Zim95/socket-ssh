/*
    ✅ Connecting to a valid SSH server → receive shell data.
    ❌ Connecting to an invalid server → triggers errorHandler.
    ❌ Calling getSSHStream() too early → throws a clear error.
    ✅ Closing the stream → triggers cleanup.
    ✅ WebSocket closes → maybe in future, you want to this.ssh.end() too.
*/