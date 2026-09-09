import { type Handlers, type PageProps } from "$fresh/server.ts";
import {
  type AnnouncementItem,
  fetchAnnouncements,
} from "../../utils/appApi.ts";
import SitePage from "../_site_page.tsx";

interface PageData {
  items: AnnouncementItem[];
}

export const handler: Handlers<PageData> = {
  async GET(_req, ctx) {
    const items = await fetchAnnouncements();
    return ctx.render({ items });
  },
};

function formatDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10).replace(/-/g, "/");
}

export default function AnnouncementsPage({ data }: PageProps<PageData>) {
  return (
    <SitePage
      title="お知らせ"
      description="PACKAGE FROESSTのお知らせ一覧です。更新情報や追加情報を掲載します。"
    >
      <div class="space-y-4">
        {data.items.length === 0
          ? (
            <p class="text-sm text-cyan-100/80">
              まだお知らせはありません。
            </p>
          )
          : data.items.map((item) => (
            <a
              href={`/announcements/${item.id}`}
              class="block rounded-2xl border border-cyan-300/20 bg-black/15 p-4 transition hover:border-cyan-200/45 hover:bg-black/25"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 class="text-lg font-bold text-white">{item.title}</h2>
                <span class="text-xs text-cyan-100/70">
                  {formatDate(item.publishedAt || item.createdAt)}
                </span>
              </div>
              <p class="mt-2 text-sm text-cyan-50/85">{item.excerpt}</p>
            </a>
          ))}
      </div>
    </SitePage>
  );
}
