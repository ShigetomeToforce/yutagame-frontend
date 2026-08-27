import KeywordList from "../../../islands/admin/keywords/KeywordList.tsx";

export default function KeywordListPage() {
  return (
    <div class="space-y-4">
      <KeywordList createHref="/admin/keywords/create" />
    </div>
  );
}
