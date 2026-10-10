import "server-only";

type Context = { requestId?: string; route?: string; userId?: string; operation?: string; code?: string; provider?: string; status?: number; detail?: string };

function write(level: "info" | "warn" | "error", message: string, context: Context = {}) {
  // Deliberately structured and allow-listed: do not pass request bodies, headers, cookies, tokens, or provider responses.
  const entry = { timestamp: new Date().toISOString(), level, message, ...context };
  if (level === "error") console.error(JSON.stringify(entry));
  else if (level === "warn") console.warn(JSON.stringify(entry));
  else console.info(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, context?: Context) => write("info", message, context),
  warn: (message: string, context?: Context) => write("warn", message, context),
  error: (message: string, context?: Context) => write("error", message, context),
};
