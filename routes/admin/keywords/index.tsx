import KeywordList from "../../../islands/admin/keywords/KeywordList.tsx";

export default function KeywordListPage() {
  return (
    <div class="space-y-4">
      <div class="flex justify-end">
        <a
          href="/admin/keywords/create"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded text-sm transition-colors shadow flex items-center gap-1"
        >
          <span>➕</span> 新規キーワード登録
        </a>
      </div>

      <KeywordList />
    </div>
  );
}
