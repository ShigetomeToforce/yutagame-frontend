import GenreForm from "../../../islands/admin/genres/GenreForm.tsx";

interface Props {
  params: {
    code: string;
  };
}

export default function GenreEditPage({ params }: Props) {
  return <GenreForm mode="edit" genreCode={params.code} />;
}
