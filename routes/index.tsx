export default function Home() {
  return (
    <div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div class="bg-white p-8 rounded-xl shadow-md max-w-xl w-full text-center">
        <h1 class="text-3xl font-bold text-gray-800 mb-4">
          🎮 YUTAGAME レトロゲームコレクション
        </h1>
        <p class="text-gray-600 mb-8">
          ここは一般のエンドユーザー向けトップページです。（現在は準備中・ログイン不要）
        </p>

        <div class="border-t border-dashed border-gray-300 pt-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
            開発者用メニュー
          </h3>
          <p class="text-xs text-gray-400 mb-4">
            管理画面の認証や、今後のAPI繋ぎ込みテストはこちらから。
          </p>
          <a
            href="/admin"
            class="inline-block bg-gray-800 hover:bg-gray-900 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow"
          >
            管理画面トップへ移動 ➡️
          </a>
        </div>
      </div>
    </div>
  );
}
