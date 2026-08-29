import MachineForm from "../../../islands/admin/machines/MachineForm.tsx";

interface Props {
  params: {
    code: string;
  };
}

export default function MachineEditPage({ params }: Props) {
  return <MachineForm mode="edit" machineCode={params.code} />;
}
