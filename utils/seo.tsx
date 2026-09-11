// deno-lint-ignore-file react-no-danger
// 検索エンジン向けJSON-LDをscript要素へ格納するため、HTML挿入が必要です。
import { Head } from "$fresh/runtime.ts";

export const SITE_NAME = "PACKAGE FROESST";
export const DEFAULT_DESCRIPTION =
  "PACKAGE FROESSTは、名作ゲーム・神ゲー・ランキング・機種別ゲームを探せるゲームアーカイブサイトです。";
export const DEFAULT_KEYWORDS = [
  "名作ゲーム",
  "神ゲー",
  "ゲームランキング",
  "レトロゲーム",
  "ゲーム検索",
  "ゲームギア 名作",
  "スーパーファミコン 名作",
  "Nintendo64 名作",
  "PlayStation 名作",
  "セガサターン 名作",
];

function siteOrigin(): string {
  const envOrigin = typeof Deno !== "undefined"
    ? Deno.env.get("SITE_ORIGIN") || Deno.env.get("PUBLIC_SITE_ORIGIN")
    : "";
  return (envOrigin || "http://localhost:8000").replace(/\/+$/, "");
}

export function canonicalUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteOrigin()}${normalizedPath}`;
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      />
    </Head>
  );
}

export function SeoHead(
  {
    title,
    description = DEFAULT_DESCRIPTION,
    path,
    imagePath = "/logo.png",
    type = "website",
    keywords = [],
  }: {
    title?: string;
    description?: string;
    path?: string;
    imagePath?: string;
    type?: "website" | "article";
    keywords?: string[];
  },
) {
  const pageTitle = title ? `${title} - ${SITE_NAME}` : SITE_NAME;
  const url = path ? canonicalUrl(path) : undefined;
  const imageUrl = canonicalUrl(imagePath);
  const mergedKeywords = Array.from(
    new Set([...DEFAULT_KEYWORDS, ...keywords]),
  );

  return (
    <Head>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={mergedKeywords.join(",")} />
      {url && <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      {url && <meta property="og:url" content={url} />}
      <meta property="og:image" content={imageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Head>
  );
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: canonicalUrl("/"),
    description: DEFAULT_DESCRIPTION,
    inLanguage: "ja-JP",
    potentialAction: {
      "@type": "SearchAction",
      target: `${canonicalUrl("/app/games")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: canonicalUrl("/"),
    logo: canonicalUrl("/logo.png"),
  };
}
