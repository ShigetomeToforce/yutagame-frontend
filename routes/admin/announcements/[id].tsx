import AnnouncementForm from "../../../islands/admin/announcements/AnnouncementForm.tsx";

interface Props {
  params: { id: string };
}

export default function AnnouncementEditPage({ params }: Props) {
  return <AnnouncementForm mode="edit" announcementId={Number(params.id)} />;
}
