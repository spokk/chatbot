import pino from "pino";

const streams = [
  { level: 'info', stream: process.stdout },
  { level: 'warn', stream: process.stderr },
  { level: 'error', stream: process.stderr },
];

export const logger = pino({
  level: "info",
  base: undefined,
  timestamp: false,
  messageKey: "log",
  formatters: {
    level() {
      return {};
    }
  }
},
  pino.multistream(streams));