export function getCookieValue(cookieHeader: string, key: string): string {
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name !== key) continue;
    try {
      return decodeURIComponent(rest.join("="));
    } catch {
      // 壊れたCookieが1件あってもページ全体のmiddlewareを失敗させません。
      return "";
    }
  }
  return "";
}
