/*
    Structured JSON logger for socket-ssh.

    Emits one JSON object per line so that Loki queries are uniform with the
    Python services, which log the fields:
        timestamp, level, service, message, request_id, user (+ extras)

    pino gives us those field names via the options below:
      - base:        { service: "socket-ssh" } stamped on every line.
      - timestamp:   ISO-8601 string under the "timestamp" key.
      - level:       upper-case string label (INFO/WARN/ERROR) instead of a number.
      - messageKey:  the human message lives under "message".

    Structured fields go in the first argument object, the human message is the
    second argument, e.g. logger.info({ ssh_hash }, "SSH connection established").
    Errors are logged as logger.error({ err }, "message").
*/

const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'socket-ssh' },
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: 'message',
    formatters: {
        level(label) {
            return { level: label.toUpperCase() };
        },
    },
});

module.exports = logger;
