const allowedPrefixes = ["/admin", "/neighbourhood", "/issues", "/projects", "/map", "/sponsorship", "/community-partners"];

export function safeRedirectPath(value: string | null | undefined, fallback = "/neighbourhood") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const target = new URL(value, "https://civicsync.invalid");
    if (target.origin !== "https://civicsync.invalid" || !allowedPrefixes.some((prefix) => target.pathname === prefix || target.pathname.startsWith(`${prefix}/`))) return fallback;
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
}
