import { type Handlers, type PageProps } from "$fresh/server.ts";
import {
  type AnnouncementItem,
  AppHttpError,
  fetchAnnouncementById,
} from "../../utils/appApi.ts";
import { getCookieValue } from "../../utils/publicEvent.ts";
import BackendUnavailablePage from "../_backend_unavailable_page.tsx";
import SitePage from "../_site_page.tsx";
import { canonicalUrl } from "../../utils/seo.tsx";

interface PageData {
  item?: AnnouncementItem;
  backendUnavailable?: boolean;
  retryHref?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return ctx.renderNotFound();
    }

    try {
      const visitorId = getCookieValue(
        req.headers.get("cookie") || "",
        "visitor_id",
      );
      const item = await fetchAnnouncementById(id, visitorId);
      return ctx.render({ item });
    } catch (error) {
      if (error instanceof AppHttpError && error.status === 404) {
        return ctx.renderNotFound();
      }
      if (
        error instanceof AppHttpError && error.status >= 500 &&
        error.status < 600
      ) {
        const requestUrl = new URL(req.url);
        return ctx.render(
          {
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

function formatDate(value?: string) {
  if (!value) return "-";
  return value.slice(0, 10).replace(/-/g, "/");
}

export default function AnnouncementDetailPage({ data }: PageProps<PageData>) {
  if (data.backendUnavailable) {
    return (
      <BackendUnavailablePage retryHref={data.retryHref || "/announcements"} />
    );
  }

  if (!data.item) {
    return null;
  }

  const { item } = data;
  return (
    <SitePage
      title={item.title}
      description={item.excerpt}
      showPageHeader={false}
      canonicalPath={`/announcements/${item.id}`}
      seoType="article"
      structuredData={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: item.title,
        description: item.excerpt,
        url: canonicalUrl(`/announcements/${item.id}`),
        datePublished: item.publishedAt || item.createdAt,
        dateModified: item.updatedAt,
      }}
    >
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
