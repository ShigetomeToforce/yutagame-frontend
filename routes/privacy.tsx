import SitePage from "./_site_page.tsx";

export default function PrivacyPage() {
  return (
    <SitePage
      title="プライバシーポリシー"
      description="PACKAGE FROESSTにおける個人情報、問い合わせ、Cookie、計測、アフィリエイトの取り扱い方針です。"
      canonicalPath="/privacy"
    >
      <section class="space-y-3">
        <p>
          当サイトでは、お問い合わせフォームの送信時に、氏名、メールアドレス、件名、本文を取得する場合があります。
        </p>
        <p>
          取得した情報は、お問い合わせ対応、管理、必要な連絡のために利用します。
        </p>
        <p>
          Google Analytics などのアクセス解析を導入する場合は、Cookie
          を利用して訪問状況を計測することがあります。これらのデータは、サイト改善や利用状況の把握のために利用します。
        </p>
        <p>
          アフィリエイトリンクを設置する場合、リンク先サイトで独自に Cookie
          や計測が行われることがあります。リンク先の利用条件やプライバシーポリシーは各事業者の規定をご確認ください。
        </p>
        <p>
          問い合わせ内容や送信情報は、管理画面で適切に取り扱いますが、公開ページに表示される内容や外部リンク先の情報については、それぞれの責任範囲に従ってご利用ください。
        </p>
      </section>
    </SitePage>
  );
}
