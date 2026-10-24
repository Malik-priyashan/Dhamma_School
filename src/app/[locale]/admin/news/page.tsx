import AdminContentManagerPage from "../../../../app/features/admin/AdminContentManagerPage";

export default function NewsAdminPage() {
  return (
    <AdminContentManagerPage
      title="News"
      description="Review, add, edit, and delete school news entries from one admin screen. The table shows the topic, image, and date for each record."
      endpoint="/news"
      accentClassName="bg-blue-600"
      accentLabel="bg-blue-50 text-blue-700"
      addButtonLabel="Add News"
    />
  );
}
