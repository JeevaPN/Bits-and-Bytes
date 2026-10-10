const allowedPaths = new Set(["/neighbourhood", "/neighbourhood/report", "/projects", "/map", "/sponsorship"]);
export function safeRedirectPath(value: string | null | undefined, fallback = "/neighbourhood") { if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || !allowedPaths.has(value.split("?")[0])) return fallback; return value; }
