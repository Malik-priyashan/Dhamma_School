import AdminContentManagerPage from "../../../../app/features/admin/AdminContentManagerPage";

export default function EventsAdminPage() {
  return (
    <AdminContentManagerPage
      title="Events"
      description="Review, add, edit, and delete school events from one admin screen. The table shows the topic, image, and date for each record."
      endpoint="/events"
      accentClassName="bg-blue-600"
      accentLabel="bg-blue-50 text-blue-700"
      addButtonLabel="Add Event"
    />
  );
}
