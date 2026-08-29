import UserForm from "../../../islands/admin/users/UserForm.tsx";

interface Props {
  params: {
    id: string;
  };
}

export default function UserEditPage({ params }: Props) {
  const userId = Number(params.id);
  return (
    <UserForm
      mode="edit"
      userId={Number.isFinite(userId) ? userId : undefined}
    />
  );
}
