export default function AdminTopPage() {
  return (
    <div class="space-y-6">
      {/* 🧭 メニュー全体のセクション見出し */}
      <div class="border-b border-gray-200 pb-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          管理機能メニュー一覧
        </h2>
        <p class="text-xs text-gray-400 mt-1">
          実行したい管理操作を選択するか、左上のメニューボタンをご利用ください。
        </p>
      </div>

      {/* 📦 機能カードの一覧（グリッド配置） */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. 管理スタッフ管理 */}
        <a
          href="/admin/admins"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
              👤 管理スタッフ管理
            </div>
            <span class="text-gray-300 group-hover:text-blue-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            システムを利用する管理者アカウントの新規登録、編集、一覧表示、および権限の管理を行います。
          </p>
        </a>

        {/* 2. ゲーム在庫管理（準備中） */}
        <div class="bg-gray-50 p-6 rounded-xl border border-gray-200 border-dashed opacity-65 relative overflow-hidden group">
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-400 text-lg">🎮 ゲーム在庫管理</div>
            <span class="bg-gray-200 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
          <p class="text-sm text-gray-400 leading-relaxed">
            物理メディア（パッケージゲーム）のタイトル、製造メーカー、対応ハードウェア情報、および所持在庫のデータベースを管理します。
          </p>
        </div>
      </div>
    </div>
  );
}
