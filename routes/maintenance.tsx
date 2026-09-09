import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import PublicHeader from "./_public_header.tsx";

interface PageData {
  fromPath: string;
}

function sanitizeReturnPath(from: string | null): string {
  if (!from) return "/";
  if (!from.startsWith("/")) return "/";
  if (from.startsWith("//")) return "/";
  if (from.startsWith("/admin")) return "/";
  if (from.startsWith("/maintenance")) return "/";
  return from;
}

export const handler: Handlers<PageData> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const fromPath = sanitizeReturnPath(url.searchParams.get("from"));
    return ctx.render({ fromPath });
  },
};

export default function MaintenancePage({ data }: PageProps<PageData>) {
  return (
    <div class="public-bg flex min-h-full flex-col text-cyan-50">
      <Head>
        <title>メンテナンス中 - PACKAGE FROESST</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <PublicHeader />

      <main class="w-full px-4 py-8 sm:px-8 lg:px-12">
        <section class="mx-auto w-full max-w-3xl rounded-3xl border border-cyan-300/20 bg-slate-950/45 p-6 sm:p-8">
          <p class="text-xs font-black tracking-[0.16em] text-cyan-200/85">
            MAINTENANCE MODE
          </p>
          <h1 class="mt-3 text-2xl font-black text-white sm:text-4xl">
            ただいまメンテナンス中です
          </h1>
          <p class="mt-4 text-sm leading-relaxed text-cyan-50/85 sm:text-base">
            現在、サービス改善のため一時的に公開ページを停止しています。しばらくしてから再度アクセスしてください。
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a
              href={data.fromPath}
              class="inline-flex items-center rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              元のページを再読み込み
            </a>
            <a
              href="/"
              class="inline-flex items-center rounded-xl border border-cyan-200/45 bg-black/20 px-4 py-2 text-sm font-semibold text-cyan-50 hover:bg-black/35"
            >
              TOPへ
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
