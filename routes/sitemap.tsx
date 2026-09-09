import SitePage from "./_site_page.tsx";

export default function SitemapPage() {
  return (
    <SitePage
      title="サイトマップ"
      description="PACKAGE FROESSTの主要ページをまとめた人向けサイトマップです。"
    >
      <section class="grid gap-6 sm:grid-cols-2">
        <div class="space-y-3 rounded-2xl border border-cyan-300/20 bg-black/15 p-4">
          <h2 class="text-lg font-bold text-white">公開ページ</h2>
          <ul class="space-y-2 text-cyan-100">
            <li>
              <a href="/">トップ</a>
            </li>
            <li>
              <a href="/app/games">ゲーム検索</a>
            </li>
            <li>
              <a href="/about">サイトについて</a>
            </li>
            <li>
              <a href="/faq">FAQ</a>
            </li>
            <li>
              <a href="/announcements">お知らせ</a>
            </li>
            <li>
              <a href="/contact">お問い合わせ</a>
            </li>
            <li>
              <a href="/privacy">プライバシーポリシー</a>
            </li>
            <li>
              <a href="/terms">利用規約</a>
            </li>
            <li>
              <a href="/commercial">特定商取引法に基づく表記</a>
            </li>
          </ul>
        </div>
        <div class="space-y-3 rounded-2xl border border-cyan-300/20 bg-black/15 p-4">
          <h2 class="text-lg font-bold text-white">補助ページ</h2>
          <ul class="space-y-2 text-cyan-100">
            <li>
              <a href="/robots.txt">robots.txt</a>
            </li>
            <li>
              <a href="/sitemap.xml">XMLサイトマップ</a>
            </li>
          </ul>
        </div>
      </section>
    </SitePage>
  );
}
