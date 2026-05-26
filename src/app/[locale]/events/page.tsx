import EventsSection from "../../features/home/events/EventsSection";

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <EventsSection mode="full" />
      </div>
    </main>
  );
}