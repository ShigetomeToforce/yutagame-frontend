export default function PublicHeader() {
  return (
    <header class="sticky top-0 z-20 border-b border-cyan-300/20 bg-slate-950/75 backdrop-blur-md">
      <div class="flex w-full items-center gap-3 px-4 py-3 sm:px-8 lg:px-12">
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

        <div class="ml-auto flex items-center gap-2 sm:gap-3">
          <form
            action="/app/games"
            method="get"
            class="hidden items-center gap-2 md:flex md:w-[360px] lg:w-[440px]"
            aria-label="ヘッダーゲーム検索"
          >
            <label for="global-game-search" class="sr-only">
              ゲーム名で検索
            </label>
            <input
              id="global-game-search"
              type="text"
              name="q"
              placeholder="ゲーム名・カナで検索"
              class="w-full rounded-xl border border-cyan-200/40 bg-slate-950/70 px-3 py-2 text-sm text-cyan-50 placeholder:text-cyan-200/65"
            />
            <button
              type="submit"
              class="shrink-0 rounded-xl border border-cyan-100/70 bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              ゲームを検索
            </button>
          </form>

          <details class="relative">
            <summary class="cursor-pointer rounded-lg border border-cyan-200/45 bg-black/35 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-black/50">
              Menu
            </summary>
            <div class="absolute right-0 mt-2 w-80 rounded-xl border border-cyan-200/30 bg-[#081326]/92 p-3 shadow-2xl backdrop-blur">
              <div>
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
                    href="/app/games"
                    class="rounded bg-cyan-400/10 px-2 py-1 text-cyan-100 hover:bg-cyan-400/25"
                  >
                    ゲーム検索
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
      </div>

      <div class="px-4 pb-3 sm:px-8 md:hidden lg:px-12">
        <form
          action="/app/games"
          method="get"
          class="flex items-center gap-2"
          aria-label="ヘッダーゲーム検索（モバイル）"
        >
          <label for="global-game-search-mobile" class="sr-only">
            ゲーム名で検索
          </label>
          <input
            id="global-game-search-mobile"
            type="text"
            name="q"
            placeholder="ゲーム名・カナで検索"
            class="w-full rounded-xl border border-cyan-200/40 bg-slate-950/70 px-3 py-2 text-sm text-cyan-50 placeholder:text-cyan-200/65"
          />
          <button
            type="submit"
            class="shrink-0 rounded-xl border border-cyan-100/70 bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950"
          >
            検索
          </button>
        </form>
        <p class="mt-1 text-[11px] font-semibold text-cyan-100/80">
          ゲーム名やカナを入力すると、すぐにゲーム一覧を検索できます。
        </p>
      </div>
    </header>
  );
}
