import { Handlers } from "$fresh/server.ts";

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
  GET(req) {
    const url = new URL(req.url);
    const target = safeTarget(url.searchParams.get("to"));
    if (!target) {
      return new Response("invalid outbound url", { status: 400 });
    }

    return new Response("", {
      status: 302,
      headers: { Location: target },
    });
  },
};
