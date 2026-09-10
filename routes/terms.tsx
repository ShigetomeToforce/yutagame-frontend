import SitePage from "./_site_page.tsx";

export default function TermsPage() {
  return (
    <SitePage
      title="利用規約"
      description="PACKAGE FROESSTの利用条件、免責、リンク、禁止事項をまとめた利用規約です。"
      canonicalPath="/terms"
    >
      <section class="space-y-3">
        <p>
          当サイトの利用にあたっては、掲載内容の正確性・完全性・最新性を保証しません。
        </p>
        <p>
          ゲーム情報、リンク先、表示内容の利用により生じたいかなる損害についても、当サイトは責任を負いません。
        </p>
        <p>
          当サイトに投稿・送信されたお問い合わせ等の内容は、管理および回答の目的で扱います。
        </p>
        <p>
          当サイトのコンテンツや画像、HTML構造等を無断で大規模に転載・再配布する行為はご遠慮ください。
        </p>
        <p>
          会員機能やコメント機能は現時点では提供していませんが、将来追加する際は本規約を更新します。
        </p>
      </section>
    </SitePage>
  );
}
