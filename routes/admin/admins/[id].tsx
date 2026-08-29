import AdminForm from "../../../islands/admin/admins/AdminForm.tsx";

interface Props {
  params: {
    id: string;
  };
}

export default function AdminEditPage({ params }: Props) {
  const adminId = Number(params.id);
  return (
    <AdminForm
      mode="edit"
      adminId={Number.isFinite(adminId) ? adminId : undefined}
    />
  );
}
