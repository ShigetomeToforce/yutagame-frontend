import PublicHeaderStats from "../islands/app/PublicHeaderStats.tsx";

export default function PublicHeader() {
  return (
    <>
      <header class="public-fixed-header fixed left-0 right-0 top-0 z-50 border-b border-cyan-300/20 bg-slate-950/80 backdrop-blur-md">
        <div class="flex w-full items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-8 sm:py-3 lg:px-12">
          <a
            href="/"
            class="inline-flex min-w-0 shrink items-center gap-3"
            aria-label="PACKAGE FROESST トップへ戻る"
          >
            <img
              src="/logo.png"
              alt="PACKAGE FROESST"
              class="h-9 w-auto max-w-[min(58vw,190px)] object-contain sm:h-12 sm:max-w-[220px]"
            />
          </a>

          <div class="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <div class="hidden xl:block">
              <PublicHeaderStats />
            </div>
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
                placeholder="ゲーム名で検索"
                class="w-full rounded-xl border border-cyan-200/40 bg-slate-950/70 px-3 py-2 text-sm text-cyan-50 placeholder:text-cyan-200/65"
              />
              <button
                type="submit"
                class="shrink-0 rounded-xl border border-cyan-100/70 bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
              >
                ゲームを検索
              </button>
            </form>

            <details class="relative shrink-0">
              <summary class="cursor-pointer rounded-lg border border-cyan-200/45 bg-black/45 px-3 py-2 text-sm font-semibold text-cyan-100 shadow-inner shadow-cyan-950/40 hover:bg-black/60">
                Menu
              </summary>
              <div class="public-menu-panel absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-80 rounded-2xl border border-cyan-200/35 p-4 shadow-2xl shadow-slate-950/60 ring-1 ring-white/10 backdrop-blur-xl">
                <div>
                  <p class="mb-3 text-xs font-semibold tracking-wide text-cyan-200/85">
                    Quick Links
                  </p>
                  <div class="mb-3 space-y-3 border-b border-cyan-200/15 pb-3 md:hidden">
                    <PublicHeaderStats />
                    <form
                      action="/app/games"
                      method="get"
                      class="flex items-center gap-2"
                      aria-label="メニュー内ゲーム検索"
                    >
                      <label for="menu-game-search-mobile" class="sr-only">
                        ゲーム名で検索
                      </label>
                      <input
                        id="menu-game-search-mobile"
                        type="text"
                        name="q"
                        placeholder="ゲーム名で検索"
                        class="min-w-0 flex-1 rounded-xl border border-cyan-200/40 bg-slate-950/70 px-3 py-2 text-sm text-cyan-50 placeholder:text-cyan-200/65"
                      />
                      <button
                        type="submit"
                        class="shrink-0 rounded-xl border border-cyan-100/70 bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950"
                      >
                        検索
                      </button>
                    </form>
                  </div>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <a
                      href="/"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      トップ
                    </a>
                    <a
                      href="/app/games"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      ゲーム検索
                    </a>
                    <a
                      href="/app/rankings"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      ランキング
                    </a>
                    <a
                      href="/features"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      特集
                    </a>
                    <a
                      href="/about"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      サイトについて
                    </a>
                    <a
                      href="/faq"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      FAQ
                    </a>
                    <a
                      href="/announcements"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      お知らせ
                    </a>
                    <a
                      href="/contact"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      お問い合わせ
                    </a>
                    <a
                      href="/recommendations"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      おすすめゲーム
                    </a>
                    <a
                      href="/advertising"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      広告掲載
                    </a>
                    <a
                      href="/sitemap"
                      class="rounded-lg border border-cyan-200/10 bg-cyan-300/12 px-2.5 py-2 text-cyan-50 hover:border-cyan-200/35 hover:bg-cyan-300/22"
                    >
                      サイトマップ
                    </a>
                    <a
                      href="/admin"
                      class="admin-menu-link rounded-lg border border-emerald-200/20 bg-emerald-300/15 px-2.5 py-2 font-semibold text-emerald-50 hover:border-emerald-200/45 hover:bg-emerald-300/25"
                    >
                      管理画面
                    </a>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>
      <div aria-hidden="true" class="public-header-spacer" />
      <a
        href="#"
        aria-label="ページの先頭へ戻る"
        class="group fixed bottom-5 right-4 z-40 flex h-12 w-12 flex-col items-center justify-center rounded-full border border-cyan-100/50 bg-slate-950/55 shadow-xl shadow-slate-950/30 backdrop-blur-md transition hover:border-cyan-100/80 hover:bg-slate-900/70 md:hidden"
      >
        <span class="relative mb-0.5 flex h-3.5 w-4 items-center justify-center transition group-hover:-translate-y-0.5">
          <span class="absolute top-0 h-2.5 w-2.5 rotate-45 border-l-2 border-t-2 border-cyan-50" />
          <span class="absolute bottom-0 h-3 w-0.5 rounded-full bg-cyan-50" />
        </span>
        <span class="text-[9px] font-black leading-none tracking-[0.08em] text-cyan-50">
          TOP
        </span>
      </a>
    </>
  );
}
