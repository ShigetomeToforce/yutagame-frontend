import GameForm from "../../../islands/admin/games/GameForm.tsx";

interface Props {
  params: {
    code: string;
  };
}

export default function GameEditPage({ params }: Props) {
  return <GameForm mode="edit" gameCode={params.code} />;
}
