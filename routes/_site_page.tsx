import { type ComponentChildren } from "preact";
import PublicHeader from "./_public_header.tsx";
import { JsonLd, SeoHead } from "../utils/seo.tsx";

interface SitePageProps {
  title: string;
  description: string;
  children: ComponentChildren;
  showPageHeader?: boolean;
  eyebrow?: string;
  canonicalPath?: string;
  keywords?: string[];
  imagePath?: string;
  contentClass?: string;
  seoType?: "website" | "article";
  structuredData?: unknown;
}

function defaultEyebrow(title: string): string {
  const labels: Record<string, string> = {
    "サイトについて": "ABOUT",
    "FAQ": "FAQ",
    "プライバシーポリシー": "PRIVACY",
    "利用規約": "TERMS",
    "特定商取引法に基づく表記": "COMMERCIAL",
    "お知らせ": "ANNOUNCEMENTS",
    "お問い合わせ": "CONTACT",
    "サイトマップ": "SITEMAP",
    "広告掲載について": "ADVERTISING",
    "おすすめゲーム": "RECOMMENDATIONS",
    "特集": "FEATURES",
  };
  return labels[title] || "ARTICLE";
}

export default function SitePage(
  {
    title,
    description,
    children,
    showPageHeader = true,
    eyebrow,
    canonicalPath,
    keywords,
    imagePath,
    contentClass = "px-4 py-5 sm:px-6 lg:px-10",
    seoType = "website",
    structuredData,
  }: SitePageProps,
) {
  return (
    <div class="public-bg flex flex-col text-cyan-50">
      <SeoHead
        title={title}
        description={description}
        path={canonicalPath}
        imagePath={imagePath}
        keywords={keywords}
        type={seoType}
      />
      {structuredData && <JsonLd data={structuredData} />}
      <PublicHeader />
      <main class="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {showPageHeader && (
          <header class="px-1 py-2 text-cyan-50 sm:px-2">
            <p class="text-[10px] font-black tracking-[0.18em] text-cyan-200/80 sm:text-xs">
              {eyebrow || defaultEyebrow(title)}
            </p>
            <h1 class="mt-1 text-2xl font-black text-white sm:text-4xl">
              {title}
            </h1>
          </header>
        )}
        <section
          class={`mt-4 w-full rounded-none border-y border-cyan-300/15 bg-slate-950/25 ${contentClass}`}
        >
          <div class="space-y-6 text-sm leading-relaxed text-cyan-50/90 sm:text-base">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
