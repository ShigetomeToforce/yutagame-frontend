import { APP_BASE_URL } from "./api.ts";

export interface PublicEventPayload {
  eventType: "page_view" | "search" | "affiliate_click" | "error" | "api_hit";
  eventSource?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  visitorId?: string;
  referrer?: string;
  machineCode?: string;
  manufacturerCode?: string;
  genreCode?: string;
  keywordCode?: string;
  searchWord?: string;
  gameCode?: string;
  affiliateCategory?: string;
}

export function getCookieValue(cookieHeader: string, key: string): string {
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name !== key) continue;
    return decodeURIComponent(rest.join("="));
  }
  return "";
}

export async function postPublicEvent(
  payload: PublicEventPayload,
): Promise<void> {
  try {
    await fetch(`${APP_BASE_URL}/app/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore logging failure
  }
}
