import ManufacturerForm from "../../../islands/admin/manufacturers/ManufacturerForm.tsx";

interface Props {
  params: {
    code: string;
  };
}

export default function ManufacturerEditPage({ params }: Props) {
  return <ManufacturerForm mode="edit" manufacturerCode={params.code} />;
}
