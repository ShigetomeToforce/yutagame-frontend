export function getCookieValue(cookieHeader: string, key: string): string {
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name !== key) continue;
    return decodeURIComponent(rest.join("="));
  }
  return "";
}
