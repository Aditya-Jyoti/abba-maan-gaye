/**
 * Only same-site paths are allowed as a post-login destination, so the login
 * page can't be used to bounce people to another site.
 * @param {unknown} value
 * @param {string} [fallback]
 * @returns {string}
 */
export function safeNext(value, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\") || /[\u0000-\u001f]/.test(value)) return fallback;
  try {
    const url = new URL(value, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
