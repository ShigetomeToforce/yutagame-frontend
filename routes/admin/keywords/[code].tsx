import KeywordForm from "../../../islands/admin/keywords/KeywordForm.tsx";

interface Props {
  params: {
    code: string;
  };
}

export default function KeywordEditByCodePage({ params }: Props) {
  return <KeywordForm mode="edit" keywordCode={params.code} />;
}
