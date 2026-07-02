import { FreshContext } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import AdminHeader from "../../islands/AdminHeader.tsx";

export default async function AdminLayout(req: Request, ctx: FreshContext) {
  const url = new URL(req.url);

  if (url.pathname === "/admin/login") {
    return (
      <>
        {/* 🤖 ログイン画面も絶対に検索エンジンに載せないための盾！ */}
        <Head>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Head>
        <ctx.Component />
      </>
    );
  }

  // 🌲 環境変数からサービス名を取得（設定されていなければデフォルト値）
  const serviceName = Deno.env.get("SERVICE_NAME") || "パッケージの森";

  let pageTitle = "管理トップ";
  let isTopPage = false;

  if (url.pathname === "/admin") {
    pageTitle = "🌲 メインメニュー"; // 絵文字も「森」にチェンジ！
    isTopPage = true;
  } else if (url.pathname.startsWith("/admin/admins")) {
    pageTitle = "👤 管理スタッフ設定（一覧）";
  }

  return (
    <>
      {/* 🤖 管理画面の全ページに一括で noindex を適用する！ */}
      <Head>
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <title>
          {pageTitle} - {serviceName}管理
        </title>
      </Head>

      <div class="min-h-screen bg-gray-50 flex flex-col">
        {/* 共通ヘッダー（ハンバーガーメニュー付き） */}
        <AdminHeader
          pageTitle={pageTitle}
          isTopPage={isTopPage}
          serviceName={serviceName}
        />

        {/* 各画面の中身 */}
        <main class="flex-1 p-6 max-w-4xl w-full mx-auto">
          <ctx.Component />
        </main>
      </div>
    </>
  );
}
