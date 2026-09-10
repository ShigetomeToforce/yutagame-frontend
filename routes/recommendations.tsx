import GameRecommendationForm from "../islands/app/GameRecommendationForm.tsx";
import SitePage from "./_site_page.tsx";

export default function RecommendationsPage() {
  return (
    <SitePage
      title="おすすめゲーム"
      description="おすすめのゲームを投稿できます。"
      canonicalPath="/recommendations"
    >
      <div class="space-y-6">
        <p class="text-sm text-cyan-50/85">
          あなたのおすすめゲームを教えてください。ゲーム名称とおすすめの理由をご入力ください。
        </p>
        <GameRecommendationForm />
      </div>
    </SitePage>
  );
}
