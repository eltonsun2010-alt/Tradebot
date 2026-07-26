/**
 * Minimal structured logger. Emits single-line JSON so it works identically in
 * an n8n Code node, a serverless log stream, or a terminal — and is trivially
 * shippable to a log platform later. Always carries a correlationId so one
 * submission can be traced end to end.
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  child(fields: Record<string, unknown>): Logger;
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
}

type Sink = (line: string) => void;

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger(
  base: Record<string, unknown> = {},
  opts: { level?: LogLevel; sink?: Sink } = {},
): Logger {
  const min = LEVELS[opts.level ?? "info"];
  const sink: Sink = opts.sink ?? ((line) => console.log(line));

  const emit = (level: LogLevel, msg: string, fields?: Record<string, unknown>) => {
    if (LEVELS[level] < min) return;
    const record = {
      ts: new Date().toISOString(),
      level,
      msg,
      ...base,
      ...(fields ?? {}),
    };
    sink(JSON.stringify(record));
  };

  return {
    child: (fields) => createLogger({ ...base, ...fields }, opts),
    debug: (msg, f) => emit("debug", msg, f),
    info: (msg, f) => emit("info", msg, f),
    warn: (msg, f) => emit("warn", msg, f),
    error: (msg, f) => emit("error", msg, f),
  };
}

/** A logger that captures lines in memory — for tests and n8n debugging. */
export function createCapturingLogger(level: LogLevel = "debug"): {
  logger: Logger;
  lines: string[];
} {
  const lines: string[] = [];
  const logger = createLogger({}, { level, sink: (l) => lines.push(l) });
  return { logger, lines };
}
