export default function AdminTopPage() {
  return (
    <div class="space-y-6">
      {/* 🧭 メニュー全体のセクション見出し */}
      <div class="border-b border-gray-200 pb-3">
        <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          管理機能メニュー
        </h2>
        <p class="text-xs text-gray-400 mt-1">
          実行したい管理操作を選択してください。
        </p>
      </div>

      {/* 📦 機能カードの一覧（グリッド配置） */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/admin/dashboard"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
              📊 ダッシュボード
            </div>
            <span class="text-gray-300 group-hover:text-blue-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            デイリー・マンスリーKPIと検索条件の上位傾向を確認します。
          </p>
        </a>

        <a
          href="/admin/games"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-violet-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-violet-600 transition-colors">
              🎮 ゲーム管理
            </div>
            <span class="text-gray-300 group-hover:text-violet-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            ゲームタイトルの一覧表示、検索、メーカーや機種、ジャンル、キーワードの絞り込みを行います。
          </p>
        </a>

        <a
          href="/admin/machines"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-indigo-600 transition-colors">
              🖥️ 機種管理
            </div>
            <span class="text-gray-300 group-hover:text-indigo-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            対応ハードウェアの一覧表示、名称検索、メーカー別の絞り込みを管理します。
          </p>
        </a>

        <a
          href="/admin/genres"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-amber-600 transition-colors">
              🏷️ ジャンル管理
            </div>
            <span class="text-gray-300 group-hover:text-amber-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            ジャンルの一覧表示、検索、編集、削除などを行います。
          </p>
        </a>

        <a
          href="/admin/manufacturers"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-emerald-600 transition-colors">
              🏭 メーカー管理
            </div>
            <span class="text-gray-300 group-hover:text-emerald-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            製造メーカーの一覧表示、検索、登録、更新、削除などを管理します。
          </p>
        </a>

        <a
          href="/admin/keywords"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-cyan-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-cyan-600 transition-colors">
              🔑 キーワード管理
            </div>
            <span class="text-gray-300 group-hover:text-cyan-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            キーワード情報の一覧表示、検索、編集、削除などを管理します。
          </p>
        </a>

        <a
          href="/admin/rankings"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-cyan-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-cyan-600 transition-colors">
              🏆 ランキング管理
            </div>
            <span class="text-gray-300 group-hover:text-cyan-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            ゲームのランキングなどを管理します。
          </p>
        </a>

        <a
          href="/admin/announcements"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-fuchsia-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-fuchsia-600 transition-colors">
              📰 お知らせ管理
            </div>
            <span class="text-gray-300 group-hover:text-fuchsia-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            更新履歴や特集案内をHTML本文つきで作成・公開・管理します。
          </p>
        </a>

        <a
          href="/admin/contacts"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-teal-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-teal-600 transition-colors">
              ✉️ 問い合わせ管理
            </div>
            <span class="text-gray-300 group-hover:text-teal-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            送信されたお問い合わせを一覧管理し、対応状況や管理メモを更新します。
          </p>
        </a>

        <div class="col-span-full border-t border-gray-200 my-2" />

        <a
          href="/admin/admins"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
              👤 Adminユーザー管理
            </div>
            <span class="text-gray-300 group-hover:text-blue-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            システムを利用するAdminユーザーアカウントの新規登録、編集、一覧表示、および権限の管理を行います。
          </p>
        </a>

        <a
          href="/admin/users"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-sky-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-sky-600 transition-colors">
              👥 ユーザー管理
            </div>
            <span class="text-gray-300 group-hover:text-sky-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            一般ユーザーの一覧表示、検索、登録、編集、削除などを管理します。
          </p>
        </a>

        <a
          href="/admin/logs"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-slate-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-slate-600 transition-colors">
              🧾 ログ管理
            </div>
            <span class="text-gray-300 group-hover:text-slate-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            日付やイベント種別でフィルタして、アクセスログの詳細を追跡します。
          </p>
        </a>

        <a
          href="/admin/maintenance"
          class="block bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5 transition-all group"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="font-bold text-gray-800 text-lg group-hover:text-amber-600 transition-colors">
              🛠️ メンテナンス管理
            </div>
            <span class="text-gray-300 group-hover:text-amber-500 transition-colors text-xl font-mono">
              →
            </span>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">
            公開ページを一時停止するメンテナンスモードのON/OFFを切り替えます。
          </p>
        </a>
      </div>
    </div>
  );
}
