import AnnouncingForm from '../../../features/announcing/AnnouncingForm';

export const metadata = {
  title: 'Announcing'
};

export default function Page() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_34%,#fff7ed_100%)] pb-16">
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative px-4">
        <AnnouncingForm />
      </div>
    </main>
  );
}
