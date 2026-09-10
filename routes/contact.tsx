import ContactForm from "../islands/app/ContactForm.tsx";
import SitePage from "./_site_page.tsx";

export default function ContactPage() {
  return (
    <SitePage
      title="お問い合わせ"
      description="PACKAGE FROESSTへのお問い合わせページです。ニックネームでの送信も可能です。"
      canonicalPath="/contact"
    >
      <div class="space-y-6">
        <p class="text-sm text-cyan-50/85">
          ご意見、ご要望、掲載内容の修正依頼などはこちらからお送りください。お名前はニックネームで差し支えありません。メールアドレスは返信が必要な場合のみ、任意でご入力ください。
        </p>
        <p class="rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          当サイトでは個人情報の入力を推奨していません。送信内容は管理上必要な範囲でのみ確認し、内容の正確性や返信可否、リンク先の利用結果について当サイトは責任を負いません。
        </p>
        <ContactForm />
      </div>
    </SitePage>
  );
}
