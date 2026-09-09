import { Handlers } from "$fresh/server.ts";
import { getCookieValue, postPublicEvent } from "../../utils/publicEvent.ts";

function safeTarget(to: string | null): string | null {
  if (!to) return null;
  try {
    const url = new URL(to);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const target = safeTarget(url.searchParams.get("to"));
    if (!target) {
      return new Response("invalid outbound url", { status: 400 });
    }

    const visitorId = getCookieValue(
      req.headers.get("cookie") || "",
      "visitor_id",
    );
    const gameCode = (url.searchParams.get("gameCode") || "").trim();
    const category = (url.searchParams.get("category") || "").trim();
    const source = (url.searchParams.get("source") || "").trim() || "frontend";

    await postPublicEvent({
      eventType: "affiliate_click",
      eventSource: source,
      path: "/app/out",
      method: "GET",
      statusCode: 302,
      visitorId,
      referrer: req.headers.get("referer") || "",
      gameCode,
      affiliateCategory: category,
    });

    return new Response("", {
      status: 302,
      headers: { Location: target },
    });
  },
};
