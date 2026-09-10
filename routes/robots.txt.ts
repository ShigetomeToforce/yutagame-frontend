import { type Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    const origin = new URL(req.url).origin;
    return new Response(
      `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`,
      {
        headers: { "content-type": "text/plain; charset=utf-8" },
      },
    );
  },
};
