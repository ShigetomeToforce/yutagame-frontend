import GameRecommendationForm from "../../../islands/admin/recommendations/GameRecommendationForm.tsx";
export default function GameRecommendationDetailPage(
  { params }: { params: { id: string } },
) {
  return <GameRecommendationForm recommendationId={Number(params.id)} />;
}
