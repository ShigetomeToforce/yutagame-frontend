import SitePage from "./_site_page.tsx";

export default function AdvertisingPage() {
  return (
    <SitePage
      title="広告掲載について"
      description="PACKAGE FROESSTへの広告掲載をご検討中の事業者様向けのご案内です。"
      canonicalPath="/advertising"
    >
      <div class="space-y-6">
        <section class="space-y-3">
          <h2 class="text-lg font-bold text-white">広告掲載のご案内</h2>
          <p>
            PACKAGE
            FROESSTでは、ゲームを楽しむ方に役立つ商品・サービス・イベント等の広告掲載をご相談いただけます。掲載内容や媒体、期間、費用は個別にご案内します。
          </p>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-bold text-white">掲載の基本方針</h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>
              ゲーム、エンターテインメント、関連サービスとの親和性を考慮します。
            </li>
            <li>
              広告であることが分かるよう、必要に応じて広告表記を行います。
            </li>
            <li>
              掲載位置、形式、期間はサイト運営上の都合により調整する場合があります。
            </li>
            <li>掲載後も、内容の変更や掲載終了をご相談する場合があります。</li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-bold text-white">掲載できない内容</h2>
          <ul class="list-disc space-y-2 pl-5">
            <li>法令・公序良俗に反するもの、またはそのおそれがあるもの</li>
            <li>虚偽、誤認を招く表現、第三者の権利を侵害するもの</li>
            <li>過度な成人向け表現、差別的表現、危険行為を助長するもの</li>
            <li>
              サイト利用者に不利益や不快感を与えると当サイトが判断したもの
            </li>
          </ul>
        </section>

        <section class="space-y-3">
          <h2 class="text-lg font-bold text-white">お申し込み・お問い合わせ</h2>
          <p>
            広告掲載をご希望の場合は、掲載を希望する内容、URL、希望時期などを添えてお問い合わせください。内容を確認のうえ、掲載可否や詳細をご案内します。
          </p>
          <a
            href="/contact"
            class="inline-flex items-center rounded-lg border border-cyan-200/60 bg-cyan-400/15 px-4 py-2 text-sm font-semibold text-cyan-50 hover:bg-cyan-400/25"
          >
            お問い合わせへ
          </a>
        </section>
      </div>
    </SitePage>
  );
}
