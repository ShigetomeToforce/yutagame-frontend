import KeywordForm from "../../../../islands/admin/keywords/KeywordForm.tsx";

interface Props {
  params: {
    id: string;
  };
}

export default function KeywordEditPage({ params }: Props) {
  const keywordId = Number(params.id);

  return (
    <KeywordForm
      mode="edit"
      keywordId={Number.isFinite(keywordId) ? keywordId : undefined}
    />
  );
}
