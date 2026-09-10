import BannerForm from "../../../islands/admin/banners/BannerForm.tsx";

export default function BannerEditPage({ params }: { params: { id: string } }) {
  return <BannerForm id={Number(params.id)} />;
}
