import { type ComponentChildren } from "preact";
import PublicHeader from "./_public_header.tsx";
import { JsonLd, SeoHead } from "../utils/seo.tsx";

interface SitePageProps {
  title: string;
  description: string;
  children: ComponentChildren;
  showPageHeader?: boolean;
  canonicalPath?: string;
  keywords?: string[];
  imagePath?: string;
  seoType?: "website" | "article";
  structuredData?: unknown;
}

export default function SitePage(
  {
    title,
    description,
    children,
    showPageHeader = true,
    canonicalPath,
    keywords,
    imagePath,
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
        <section class="w-full rounded-none border-y border-cyan-300/15 bg-slate-950/25 px-4 py-5 sm:px-6 lg:px-10">
          {showPageHeader && (
            <div class="border-b border-cyan-300/20 pb-4">
              <p class="text-[11px] font-black tracking-[0.22em] text-cyan-200/90">
                PACKAGE FROESST
              </p>
              <h1 class="mt-2 text-2xl font-black text-white sm:text-4xl">
                {title}
              </h1>
              <p class="mt-3 max-w-3xl text-sm leading-relaxed text-cyan-50/85 sm:text-base">
                {description}
              </p>
            </div>
          )}
          <div
            class={`${
              showPageHeader ? "mt-6" : ""
            } space-y-6 text-sm leading-relaxed text-cyan-50/90 sm:text-base`}
          >
            {children}
          </div>
        </section>
      </main>
    </div>
  );
}
