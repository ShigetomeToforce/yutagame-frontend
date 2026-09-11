import { type Handlers, type PageProps } from "$fresh/server.ts";
import {
  AppHttpError,
  type FeatureItem,
  fetchFeatures,
} from "../../utils/appApi.ts";
import FeatureList from "../../islands/app/FeatureList.tsx";
import BackendUnavailablePage from "../_backend_unavailable_page.tsx";
import SitePage from "../_site_page.tsx";
import { canonicalUrl } from "../../utils/seo.tsx";

interface PageData {
  items: FeatureItem[];
  backendUnavailable?: boolean;
  retryHref?: string;
}

export const handler: Handlers<PageData> = {
  async GET(req, ctx) {
    try {
      const items = await fetchFeatures();
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

export default function FeaturesPage({ data }: PageProps<PageData>) {
  if (data.backendUnavailable) {
    return <BackendUnavailablePage retryHref={data.retryHref || "/features"} />;
  }

  return (
    <SitePage
      title="特集"
      description="名作ゲーム・神ゲーをテーマ別に紹介するPACKAGE FROESSTの特集一覧です。"
      canonicalPath="/features"
      keywords={["ゲーム特集", "名作ゲーム特集", "神ゲー特集"]}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "特集",
        url: canonicalUrl("/features"),
        description:
          "名作ゲーム・神ゲーをテーマ別に紹介するPACKAGE FROESSTの特集一覧です。",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: data.items.slice(0, 10).map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: canonicalUrl(`/features/${item.code}`),
            name: item.title,
          })),
        },
      }}
    >
      <FeatureList items={data.items} />
    </SitePage>
  );
}
