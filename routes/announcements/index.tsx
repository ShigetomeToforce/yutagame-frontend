import { type Handlers, type PageProps } from "$fresh/server.ts";
import {
  type AnnouncementItem,
  AppHttpError,
  fetchAnnouncements,
} from "../../utils/appApi.ts";
import AnnouncementList from "../../islands/app/AnnouncementList.tsx";
import BackendUnavailablePage from "../_backend_unavailable_page.tsx";
import SitePage from "../_site_page.tsx";
import { canonicalUrl } from "../../utils/seo.tsx";

interface PageData {
  items: AnnouncementItem[];
  backendUnavailable?: boolean;
  retryHref?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    try {
      const items = await fetchAnnouncements();
      return ctx.render({ items });
    } catch (error) {
      if (
        error instanceof AppHttpError && error.status >= 500 &&
        error.status < 600
      ) {
        const requestUrl = new URL(req.url);
        return ctx.render(
          {
            items: [],
            backendUnavailable: true,
            retryHref: `${requestUrl.pathname}${requestUrl.search}`,
          },
          { status: 503 },
        );
      }
      throw error;
    }
  },
};

export default function AnnouncementsPage({ data }: PageProps<PageData>) {
  if (data.backendUnavailable) {
    return (
      <BackendUnavailablePage retryHref={data.retryHref || "/announcements"} />
    );
  }

  return (
    <SitePage
      title="お知らせ"
      description="PACKAGE FROESSTのお知らせ一覧です。更新情報や追加情報を掲載します。"
      canonicalPath="/announcements"
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "お知らせ",
        url: canonicalUrl("/announcements"),
        description:
          "PACKAGE FROESSTのお知らせ一覧です。更新情報や追加情報を掲載します。",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: data.items.slice(0, 10).map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: canonicalUrl(`/announcements/${item.id}`),
            name: item.title,
          })),
        },
      }}
    >
      <AnnouncementList items={data.items} />
    </SitePage>
  );
}
