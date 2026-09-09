import { Head } from "$fresh/runtime.ts";
import PublicHeader from "./_public_header.tsx";

export default function Error500() {
  return (
    <div class="public-bg flex min-h-full flex-col text-cyan-50">
      <Head>
        <title>500 Internal Server Error - PACKAGE FROESST</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <PublicHeader />

      <main class="w-full px-4 py-8 sm:px-8 lg:px-12">
        <section class="mx-auto w-full max-w-3xl rounded-3xl border border-cyan-300/20 bg-slate-950/45 p-6 sm:p-8">
          <p class="text-xs font-black tracking-[0.16em] text-cyan-200/85">
            ERROR 500
          </p>
          <h1 class="mt-3 text-2xl font-black text-white sm:text-4xl">
            一時的に表示できませんでした
          </h1>
          <p class="mt-4 text-sm leading-relaxed text-cyan-50/85 sm:text-base">
            サーバー側でエラーが発生しました。時間をおいて再度アクセスしてください。解消しない場合はお問い合わせからご連絡ください。
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a
              href="/"
              class="inline-flex items-center rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              TOPへ戻る
            </a>
            <a
              href="/contact"
              class="inline-flex items-center rounded-xl border border-cyan-200/45 bg-black/20 px-4 py-2 text-sm font-semibold text-cyan-50 hover:bg-black/35"
            >
              お問い合わせ
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
