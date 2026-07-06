import { useSignal } from "@preact/signals";

interface MenuItem {
  label: string;
  href: string;
  active: boolean;
}

interface AdminHeaderProps {
  pageTitle: string;
  serviceName: string;
  menuItems: MenuItem[]; // 💡 メニューの生データを配列で受け取る
}

export default function AdminHeader({
  pageTitle,
  serviceName,
  menuItems,
}: AdminHeaderProps) {
  const isMenuOpen = useSignal(false);

  const handleLogout = () => {
    document.cookie = "admin_token=; path=/; max-age=0;";
    globalThis.location.href = "/admin/login";
  };

  return (
    <header class="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm w-full">
      <div class="px-4 h-14 flex items-center justify-between w-full">
        {/* 左側：ハンバーガーボタン */}
        <div class="flex items-center min-w-[40px]">
          <button
            type="button"
            onClick={() => (isMenuOpen.value = !isMenuOpen.value)}
            class="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:outline-none md:hidden transition-colors"
            aria-label="メニューを開く"
          >
            {isMenuOpen.value
              ? (
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )
              : (
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
          </button>
        </div>

        {/* 中央：タイトル */}
        <div class="flex-1 text-center px-2 min-w-0">
          <h1 class="text-base sm:text-lg font-bold text-gray-800 truncate">
            {pageTitle}
          </h1>
        </div>

        {/* 右側：ログアウト */}
        <div class="min-w-[40px] flex justify-end">
          <button
            type="button"
            onClick={handleLogout}
            class="p-2 -mr-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 focus:outline-none flex items-center gap-1 transition-colors text-sm font-medium"
            title="ログアウト"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span class="hidden sm:inline">ログアウト</span>
          </button>
        </div>
      </div>

      {/* 📱 【スマホ専用ドロワー】島の中でループを回して、PCと完全に同一のナビを生成 */}
      {isMenuOpen.value && (
        <div class="md:hidden border-t border-gray-100 bg-white px-4 py-3 shadow-inner">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
            ⚙️ {serviceName} メニュー
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
          </nav>
        </div>
      )}
    </header>
  );
}
