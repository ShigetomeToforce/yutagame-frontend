import { type PageProps } from "$fresh/server.ts";
export default function App({ Component, url }: PageProps) {
  const isAdminRoute = url.pathname.startsWith("/admin");

  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="robots"
          content={isAdminRoute ? "noindex,nofollow,noarchive" : "index,follow"}
        />
        <meta name="theme-color" content="#040a18" />
        <title>PACKAGE FROESST</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;800;900&family=Orbitron:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/styles.css" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
      </head>
      <body class="min-h-screen bg-slate-950 text-gray-900">
        <div
          class={`flex min-h-screen flex-col ${
            isAdminRoute ? "" : "public-scope"
          }`}
        >
          <div class="flex flex-1 flex-col">
            <Component />
          </div>

          {!isAdminRoute && (
            <footer class="border-t border-cyan-300/20 bg-slate-950 text-cyan-50">
              <div class="flex w-full flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
                <div>
                  <a href="/" class="text-sm font-semibold hover:text-white">
                    PACKAGE FROESST
                  </a>
                  <p class="mt-1 text-xs text-cyan-100/70">
                    ゲーム検索・アーカイブ・お知らせ・問い合わせ
                  </p>
                </div>
                <nav class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-cyan-100/85">
                  <a href="/about" class="hover:text-white">サイトについて</a>
                  <a href="/faq" class="hover:text-white">FAQ</a>
                  <a href="/announcements" class="hover:text-white">お知らせ</a>
                  <a href="/contact" class="hover:text-white">お問い合わせ</a>
                  <a href="/recommendations" class="hover:text-white">
                    おすすめゲーム
                  </a>
                  <a href="/advertising" class="hover:text-white">広告掲載</a>
                  <a href="/privacy" class="hover:text-white">プライバシー</a>
                  <a href="/terms" class="hover:text-white">利用規約</a>
                  <a href="/commercial" class="hover:text-white">特商法表記</a>
                  <a href="/sitemap" class="hover:text-white">サイトマップ</a>
                </nav>
              </div>
            </footer>
          )}
        </div>
      </body>
    </html>
  );
}
