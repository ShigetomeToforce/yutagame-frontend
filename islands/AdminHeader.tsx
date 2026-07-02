import { useSignal } from "@preact/signals";

interface AdminHeaderProps {
  pageTitle: string;
  isTopPage?: boolean;
  serviceName: string;
}

export default function AdminHeader({
  pageTitle,
  isTopPage = false,
  serviceName,
}: AdminHeaderProps) {
  // メニューが開いているかどうかの状態を管理するシグナル
  const isMenuOpen = useSignal(false);

  // 🚪 ログアウト処理（Cookieを消してログインへ）
  const handleLogout = () => {
    globalThis.document.cookie = "admin_token=; max-age=0; path=/;";
    globalThis.location.href = "/admin/login";
  };

  // 📝 共通のメニューリンク定義
  const menuItems = [
    { label: "🏠 管理トップ", href: "/admin" },
    { label: "👤 管理スタッフ管理", href: "/admin/admins" },
    { label: "🎮 ゲーム在庫管理", href: "/admin/games" }, // 今後用
  ];

  return (
    <>
      {/* ＝ ＝ ＝ ＝ 固定ヘッダー ＝ ＝ ＝ ＝ */}
      <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 px-4 py-3 flex justify-between items-center">
        <div class="flex items-center gap-3">
          {/* 🍔 ハンバーガーボタン */}
          <button
            type="button"
            onClick={() => (isMenuOpen.value = !isMenuOpen.value)}
            class="p-2 hover:bg-gray-100 rounded-md text-gray-600 focus:outline-none"
            aria-label="メニューを開く"
          >
            <span class="text-xl">☰</span>
          </button>

          {/* ⬅️ トップに戻るボタン（トップ画面以外で表示） */}
          {!isTopPage && (
            <a
              href="/admin"
              class="text-gray-400 hover:text-gray-600 font-bold text-lg p-1"
              title="管理トップへ戻る"
            >
              ⬅️
            </a>
          )}

          {/* 📍 現在のページ名 */}
          <h1 class="text-lg font-bold text-gray-800">{pageTitle}</h1>
        </div>

        {/* 🚪 ログアウトボタン */}
        <button
          type="button"
          onClick={handleLogout}
          class="text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded transition-colors"
        >
          ログアウト
        </button>
      </header>

      {/* ＝ ＝ ＝ ＝ 左から飛び出すサイドメニュー（ドロワー） ＝ ＝ ＝ ＝ */}
      {/* 背景の黒いモヤ（メニューが開いている時だけ表示） */}
      {isMenuOpen.value && (
        <div
          onClick={() => (isMenuOpen.value = false)}
          class="fixed inset-0 bg-black/40 z-40 transition-opacity animate-fade-in"
        />
      )}

      {/* メインのメニュー本体 */}
      <div
        class={`fixed top-0 left-0 bottom-0 w-64 bg-gray-900 text-gray-100 z-50 p-5 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isMenuOpen.value ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div class="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
          <span class="font-bold text-amber-400 font-mono">
            🌲 {serviceName} 管理
          </span>
          <button
            type="button"
            onClick={() => (isMenuOpen.value = false)}
            class="text-gray-400 hover:text-white text-xl p-1"
          >
            ✕
          </button>
        </div>

        <nav class="space-y-1">
          {menuItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              class="block px-4 py-3 rounded-md text-sm font-medium hover:bg-gray-800 hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </>
  );
}
