import { type Handlers, type PageProps } from "$fresh/server.ts";
import {
  type AnnouncementItem,
  fetchAnnouncementById,
} from "../../utils/appApi.ts";
import SitePage from "../_site_page.tsx";

interface PageData {
  item: AnnouncementItem;
}

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    const item = await fetchAnnouncementById(Number(ctx.params.id));
    return ctx.render({ item });
  },
};

function formatDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10).replace(/-/g, "/");
}

export default function AnnouncementDetailPage({ data }: PageProps<PageData>) {
  const { item } = data;
  return (
    <SitePage title={item.title} description={item.excerpt}>
      <section class="rounded-2xl border border-cyan-300/20 bg-black/15 p-4 sm:p-5">
        <a
          href="/announcements"
          class="text-sm font-semibold text-cyan-200 hover:text-white"
        >
          ← お知らせ一覧へ
        </a>
        <h1 class="mt-4 text-2xl font-black text-white sm:text-4xl">
          {item.title}
        </h1>
        <p class="mt-3 text-xs text-cyan-100/70">
          {formatDate(item.publishedAt || item.createdAt)}
        </p>
        <div
          class="prose prose-invert mt-6 max-w-none"
          dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
        />
      </section>
    </SitePage>
  );
}
