import SitePage from "./_site_page.tsx";

export default function FAQPage() {
  return (
    <SitePage
      title="FAQ"
      description="PACKAGE FROESSTの使い方、掲載基準、更新頻度、画像出典などをまとめたFAQです。"
    >
      <section class="space-y-2">
        <h2 class="text-lg font-bold text-white">
          Q. このサイトは何を扱っていますか？
        </h2>
        <p>
          ゲームソフトの基本情報、関連キーワード、メーカー、機種、ジャンル、公式サイトなどをまとめています。
        </p>
      </section>
      <section class="space-y-2">
        <h2 class="text-lg font-bold text-white">Q. 掲載基準はありますか？</h2>
        <p>
          基本的には、管理者が保有・整理しているデータを掲載しています。詳細情報は編集により追加・修正されます。
        </p>
      </section>
      <section class="space-y-2">
        <h2 class="text-lg font-bold text-white">
          Q. 更新頻度はどのくらいですか？
        </h2>
        <p>
          追加・修正のタイミングで随時更新します。お知らせページに更新内容を掲載する予定です。
        </p>
      </section>
      <section class="space-y-2">
        <h2 class="text-lg font-bold text-white">Q. 画像の出典は？</h2>
        <p>
          登録情報に紐づく画像を表示しています。出典や権利関係に配慮し、必要な場合は公式サイトへのリンクを優先します。
        </p>
      </section>
      <section class="space-y-2">
        <h2 class="text-lg font-bold text-white">
          Q. 問い合わせはできますか？
        </h2>
        <p>
          お問い合わせページから送信できます。管理画面で内容を確認・管理します。
        </p>
      </section>
    </SitePage>
  );
}
