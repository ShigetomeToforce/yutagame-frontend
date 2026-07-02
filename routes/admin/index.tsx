import LogoutButton from "../../islands/LogoutButton.tsx";

export default function AdminTopPage() {
  // 💡 画面全体がサーバーコンポーネントになり、JavaScriptの警告も一切出なくなります！
  return (
    <div class="min-h-screen bg-gray-50 flex flex-col">
      {/* ヘッダー */}
      <header class="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 class="text-xl font-bold text-gray-800">
          📦 YUTAGAME 管理システム
        </h1>
        {/* 🏝️ ログアウトボタンだけを「島」として埋め込む！ */}
        <LogoutButton />
      </header>

      {/* メイン中身 */}
      <main class="flex-1 p-6 max-w-4xl w-full mx-auto">
        <div class="bg-white p-6 rounded-lg shadow mb-6">
          <p class="text-green-600 font-medium flex items-center gap-2 mb-2">
            ✅ 共通ミドルウェア（関所）通過
          </p>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">管理画面トップ</h2>
          <p class="text-gray-500 text-sm">
            サーバー側の共通関所（_middleware.ts）で一括ガードされているため、この画面のコードは超スッキリです。
          </p>
        </div>

        {/* メニューエリア */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border-t-4 border-blue-500">
            <h3 class="text-lg font-bold text-gray-700 mb-2">
              👤 管理スタッフ設定
            </h3>
            <p class="text-gray-500 text-sm mb-4">
              システムを利用する管理者アカウントの一覧表示・登録などをテストします。
            </p>
            <a
              href="/admin/admins"
              class="text-blue-600 hover:text-blue-800 font-semibold text-sm inline-flex items-center"
            >
              管理者管理を開く ➡️
            </a>
          </div>

          <div class="bg-white p-6 rounded-lg shadow opacity-60 border-t-4 border-gray-400">
            <h3 class="text-lg font-bold text-gray-400 mb-2">
              🎮 ゲーム在庫管理
            </h3>
            <p class="text-gray-400 text-sm mb-4">
              ゲームデータの管理画面（今後のステップで実装します）。
            </p>
            <span class="text-gray-400 text-xs font-semibold bg-gray-100 px-2 py-1 rounded">
              フロント未実装
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
