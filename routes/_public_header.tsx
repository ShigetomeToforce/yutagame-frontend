export default function PublicHeader() {
  return (
    <header class="sticky top-0 z-20 border-b border-cyan-300/20 bg-slate-950/75 backdrop-blur-md">
      <div class="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-8 lg:px-12">
        <a
          href="/"
          class="inline-flex items-center gap-3"
          aria-label="PACKAGE FROESST トップへ戻る"
        >
          <img
            src="/logo.png"
            alt="PACKAGE FROESST"
            class="h-10 w-auto max-w-[220px] object-contain sm:h-12"
          />
        </a>
        <details class="relative">
          <summary class="cursor-pointer rounded-lg border border-cyan-200/45 bg-black/35 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-black/50">
            Menu
          </summary>
          <div class="absolute right-0 mt-2 w-80 rounded-xl border border-cyan-200/30 bg-[#081326]/92 p-3 shadow-2xl backdrop-blur">
            <form action="/app/games" method="get" class="space-y-2">
              <input
                type="text"
                name="q"
                placeholder="ゲーム名・カナで検索"
                class="w-full rounded-lg border border-cyan-200/35 bg-slate-950/65 px-3 py-2 text-sm text-cyan-50"
              />
              <button
                type="submit"
                class="w-full rounded-lg bg-cyan-400 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Search
              </button>
            </form>

            <div class="mt-3 border-t border-cyan-200/20 pt-3">
              <p class="mb-2 text-xs font-semibold tracking-wide text-cyan-200/80">
                Quick Links
              </p>
              <div class="grid grid-cols-2 gap-1 text-xs">
                <a
                  href="/"
                  class="rounded bg-cyan-400/10 px-2 py-1 text-cyan-100 hover:bg-cyan-400/25"
                >
                  トップ
                </a>
                <a
                  href="/about"
                  class="rounded bg-cyan-400/10 px-2 py-1 text-cyan-100 hover:bg-cyan-400/25"
                >
                  サイトについて
                </a>
                <a
                  href="/faq"
                  class="rounded bg-cyan-400/10 px-2 py-1 text-cyan-100 hover:bg-cyan-400/25"
                >
                  FAQ
                </a>
                <a
                  href="/announcements"
                  class="rounded bg-cyan-400/10 px-2 py-1 text-cyan-100 hover:bg-cyan-400/25"
                >
                  お知らせ
                </a>
                <a
                  href="/contact"
                  class="rounded bg-cyan-400/10 px-2 py-1 text-cyan-100 hover:bg-cyan-400/25"
                >
                  お問い合わせ
                </a>
                <a
                  href="/sitemap"
                  class="rounded bg-cyan-400/10 px-2 py-1 text-cyan-100 hover:bg-cyan-400/25"
                >
                  サイトマップ
                </a>
              </div>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
