import { Head } from "$fresh/runtime.ts";
import PublicHeader from "./_public_header.tsx";

interface BackendUnavailablePageProps {
  retryHref: string;
}

export default function BackendUnavailablePage(
  { retryHref }: BackendUnavailablePageProps,
) {
  return (
    <div class="public-bg flex min-h-full flex-col text-cyan-50">
      <Head>
        <title>503 Service Unavailable - PACKAGE FROESST</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <PublicHeader />

      <main class="w-full px-4 py-8 sm:px-8 lg:px-12">
        <section class="mx-auto w-full max-w-3xl rounded-3xl border border-cyan-300/20 bg-slate-950/45 p-6 sm:p-8">
          <p class="text-xs font-black tracking-[0.16em] text-cyan-200/85">
            ERROR 503
          </p>
          <h1 class="mt-3 text-2xl font-black text-white sm:text-4xl">
            サーバーへ接続できません
          </h1>
          <p class="mt-4 text-sm leading-relaxed text-cyan-50/85 sm:text-base">
            現在、データ取得先サーバーへ接続できない状態です。<br />時間をおいて再読み込みするか、トップページへ戻ってください。
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a
              href={retryHref}
              class="inline-flex items-center rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              このページを再読み込み
            </a>
            <a
              href="/"
              class="inline-flex items-center rounded-xl border border-cyan-200/45 bg-black/20 px-4 py-2 text-sm font-semibold text-cyan-50 hover:bg-black/35"
            >
              TOPへ戻る
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
