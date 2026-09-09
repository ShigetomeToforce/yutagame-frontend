import ContactInquiryForm from "../../../islands/admin/contacts/ContactInquiryForm.tsx";

interface Props {
  params: { id: string };
}

export default function ContactInquiryDetailPage({ params }: Props) {
  return <ContactInquiryForm inquiryId={Number(params.id)} />;
}
