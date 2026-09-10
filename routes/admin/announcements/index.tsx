import AnnouncementList from "../../../islands/admin/announcements/AnnouncementList.tsx";
import AnnouncementPublishOrder from "../../../islands/admin/announcements/AnnouncementPublishOrder.tsx";

export default function AnnouncementListPage() {
  return (
    <div class="space-y-6">
      <AnnouncementList createHref="/admin/announcements/create" />
      <AnnouncementPublishOrder />
    </div>
  );
}
