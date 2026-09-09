import { type Handlers } from "$fresh/server.ts";
import { fetchSitemapData } from "../utils/appApi.ts";

const STATIC_PAGES = [
  "/",
  "/app/games",
  "/about",
  "/faq",
  "/announcements",
  "/contact",
  "/privacy",
  "/terms",
  "/commercial",
  "/sitemap",
];

export const handler: Handlers = {
  async GET(req) {
    const origin = new URL(req.url).origin;
    const data = await fetchSitemapData();
    const urls = [
      ...STATIC_PAGES.map((path) => `${origin}${path}`),
      ...data.gameCodes.map((code) =>
        `${origin}/app/games/${encodeURIComponent(code)}`
      ),
      ...data.announcementIds.map((id) => `${origin}/announcements/${id}`),
    ];
    const body =
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
        urls.map((url) => `\n  <url><loc>${url}</loc></url>`).join("")
      }
</urlset>`;
    return new Response(body, {
      headers: { "content-type": "application/xml; charset=utf-8" },
    });
  },
};
