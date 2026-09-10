import SitePage from "./_site_page.tsx";

export default function AboutPage() {
  return (
    <SitePage
      title="サイトについて"
      description="PACKAGE FROESSTの目的、探し方、掲載方針、リンク案内をまとめたページです。"
      canonicalPath="/about"
    >
      <section class="space-y-3">
        <h2 class="text-lg font-bold text-white">このサイトについて</h2>
        <p>
          PACKAGE
          FROESSTは、所持しているゲームソフトや関連情報を、メーカー・機種・ジャンル・キーワードで探しやすく整理したゲームアーカイブサイトです。
        </p>
        <p>
          発売日、登録日、更新日、キーワードウェーブ、スポットライト表示など、ゲームを眺める楽しさと探しやすさの両方を重視しています。
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-white">おすすめの使い方</h2>
        <ul class="list-disc space-y-2 pl-5">
          <li>
            メーカー・機種・ジャンルのチップをクリックすると、同じ条件で検索結果へ移動します。
          </li>
          <li>
            キーワードをクリックすると、その語で絞り込んだ検索結果へ移動します。
          </li>
          <li>ゲーム画像やタイトル、本文エリアは詳細ページへ移動します。</li>
          <li>
            TOPの Keyword Wave
            は、気になる語を流し見しながら探す入口として使えます。
          </li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-lg font-bold text-white">運営方針</h2>
        <p>
          掲載内容は、所持ゲームの整理・検索性向上・視覚的な楽しさを優先して編集しています。紹介ページやリンクは、必要に応じてアフィリエイトを含む場合があります。
        </p>
      </section>
    </SitePage>
  );
}
