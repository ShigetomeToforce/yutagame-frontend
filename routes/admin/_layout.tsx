import { FreshContext } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import AdminHeader from "../../islands/admin/AdminHeader.tsx";

export default async function AdminLayout(req: Request, ctx: FreshContext) {
  await Promise.resolve();

  const url = new URL(req.url);

  if (url.pathname === "/admin/login") {
    return (
      <>
        <Head>
          <meta name="robots" content="noindex,nofollow,noarchive" />
        </Head>
        <ctx.Component />
      </>
    );
  }

  const serviceName = Deno.env.get("SERVICE_NAME") || "パッケージの森";
  const cleanPath = url.pathname.replace(/\/$/, "");

  // 📄 ページタイトルの判定
  let pageTitle = "管理トップ";
  if (cleanPath === "/admin") {
    pageTitle = "🌲 TOP";
  } else if (cleanPath.startsWith("/admin/games")) {
    pageTitle = "🎮 ゲーム管理";
  } else if (cleanPath.startsWith("/admin/machines")) {
    pageTitle = "🖥️ 機種管理";
  } else if (cleanPath.startsWith("/admin/genres")) {
    pageTitle = "🏷️ ジャンル管理";
  } else if (cleanPath.startsWith("/admin/manufacturers")) {
    pageTitle = "🏭 メーカー管理";
  } else if (cleanPath.startsWith("/admin/keywords")) {
    pageTitle = "🔑 キーワード管理";
  } else if (cleanPath.startsWith("/admin/admins")) {
    pageTitle = "👤 Adminユーザー管理";
  } else if (cleanPath.startsWith("/admin/users")) {
    pageTitle = "👥 ユーザー管理";
  }

  const menuItems = [
    {
      label: "🌲 TOP",
      href: "/admin",
      active: cleanPath === "/admin",
    },
    {
      label: "🎮 ゲーム管理",
      href: "/admin/games",
      active: cleanPath.startsWith("/admin/games"),
    },
    {
      label: "🖥️ 機種管理",
      href: "/admin/machines",
      active: cleanPath.startsWith("/admin/machines"),
    },
    {
      label: "🏷️ ジャンル管理",
      href: "/admin/genres",
      active: cleanPath.startsWith("/admin/genres"),
    },
    {
      label: "🏭 メーカー管理",
      href: "/admin/manufacturers",
      active: cleanPath.startsWith("/admin/manufacturers"),
    },
    {
      label: "🔑 キーワード管理",
      href: "/admin/keywords",
      active: cleanPath.startsWith("/admin/keywords"),
    },
  ];

  const userMenuItems = [
    {
      label: "👤 Adminユーザー管理",
      href: "/admin/admins",
      active: cleanPath.startsWith("/admin/admins"),
    },
    {
      label: "👥 ユーザー管理",
      href: "/admin/users",
      active: cleanPath.startsWith("/admin/users"),
    },
  ];

  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <title>{pageTitle} - {serviceName}管理</title>
      </Head>

      <div class="min-h-screen bg-gray-50 flex">
        {/* 左側：サイドバーをページ上部まで貫通させる（常時表示） */}
        <aside class="hidden md:block w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0 self-stretch">
          <div class="text-sm font-semibold text-gray-700 mb-4 px-1 truncate">
            ⚙️ {serviceName} 管理画面
          </div>
          <nav class="space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                class={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </a>
            ))}

            <div class="my-3 border-t border-gray-200" />

            {userMenuItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                class={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* 右側：ヘッダー + コンテンツ（ヘッダーは右側の上部に表示） */}
        <div class="flex-1 flex flex-col min-h-screen">
          <AdminHeader
            pageTitle={pageTitle}
            serviceName={serviceName}
            menuItems={menuItems}
          />

          <main class="flex-1 p-4 sm:p-6 min-w-0 bg-gray-50">
            <ctx.Component />
          </main>
        </div>
      </div>
    </>
  );
}
