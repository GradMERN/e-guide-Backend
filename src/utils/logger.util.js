/**
 * Logging utility for consistent application logging
 */

const LOG_LEVELS = {
  ERROR: "ERROR",
  WARN: "WARN",
  INFO: "INFO",
  DEBUG: "DEBUG",
};

const formatLog = (level, message, data = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...(Object.keys(data).length > 0 && { data }),
  };
  return JSON.stringify(logEntry);
};

export const logger = {
  error: (message, data = {}) => {
    console.error(formatLog(LOG_LEVELS.ERROR, message, data));
  },
  warn: (message, data = {}) => {
    if (process.env.NODE_ENV !== "test") {
      console.warn(formatLog(LOG_LEVELS.WARN, message, data));
    }
  },
  info: (message, data = {}) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(formatLog(LOG_LEVELS.INFO, message, data));
    }
  },
  debug: (message, data = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.log(formatLog(LOG_LEVELS.DEBUG, message, data));
    }
  },
};
