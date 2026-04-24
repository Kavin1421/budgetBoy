export type LogLevel = "debug" | "info" | "warn" | "error";

export type Logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => void;
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
  child: (bindings: Record<string, unknown>) => Logger;
};

function sink(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    msg,
    ...meta,
  });
  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") console.log(line);
      break;
    default:
      console.log(line);
  }
}

function createLogger(bindings: Record<string, unknown>): Logger {
  const merge = (meta?: Record<string, unknown>) => ({ ...bindings, ...meta });

  return {
    debug: (msg, meta) => sink("debug", msg, merge(meta)),
    info: (msg, meta) => sink("info", msg, merge(meta)),
    warn: (msg, meta) => sink("warn", msg, merge(meta)),
    error: (msg, meta) => sink("error", msg, merge(meta)),
    child: (b) => createLogger(merge(b)),
  };
}

export const logger = createLogger({ service: "budgetboy" });
