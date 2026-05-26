import AdminContentManagerPage from "../../../../app/features/admin/AdminContentManagerPage";

export default function NewsAdminPage() {
  return (
    <AdminContentManagerPage
      title="News"
      description="Review, add, edit, and delete school news entries from one admin screen. The table shows the topic, image, and date for each record."
      endpoint="/news"
      accentClassName="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
      accentLabel="bg-emerald-50 text-emerald-700"
      addButtonLabel="Add News"
    />
  );
}