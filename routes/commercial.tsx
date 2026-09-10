import SitePage from "./_site_page.tsx";

export default function CommercialPage() {
  return (
    <SitePage
      title="特定商取引法に基づく表記"
      description="PACKAGE FROESSTにおける特定商取引法関連の案内です。現時点の提供形態を記載しています。"
      canonicalPath="/commercial"
    >
      <section class="space-y-3">
        <p>当サイトは、ゲーム情報の閲覧・検索を目的とした情報サイトです。</p>
        <p>
          現時点では、当サイト上で直接の商品販売、予約販売、デジタル商品の決済、課金サービスは行っていません。
        </p>
        <p>
          アフィリエイトリンクを掲載する場合がありますが、販売主体は各リンク先の事業者です。
        </p>
        <p>
          そのため、現状は特定商取引法に基づく表記の対象となる直接販売はありません。今後、販売・課金機能を追加する場合は、必要事項を追記します。
        </p>
      </section>
    </SitePage>
  );
}
