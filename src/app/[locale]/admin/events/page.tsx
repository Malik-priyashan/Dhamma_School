import AdminContentManagerPage from "../../../../app/features/admin/AdminContentManagerPage";

export default function EventsAdminPage() {
  return (
    <AdminContentManagerPage
      title="Events"
      description="Review, add, edit, and delete school events from one admin screen. The table shows the topic, image, and date for each record."
      endpoint="/events"
      accentClassName="bg-gradient-to-r from-sky-500 via-blue-500 to-cyan-500"
      accentLabel="bg-sky-50 text-sky-700"
      addButtonLabel="Add Event"
    />
  );
}