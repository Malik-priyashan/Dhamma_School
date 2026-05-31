import EventsSection from "../../features/home/events/EventsSection";

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#cfe3ff_0%,#f7fbff_34%,#c9e0ff_72%,#6ea8ff_100%)] px-4 pb-8 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pt-36">
      <div className="mx-auto max-w-6xl">
        <EventsSection mode="full" />
      </div>
    </main>
  );
}