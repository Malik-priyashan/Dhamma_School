import PrefectBoardForm from '@/app/features/prefectboard/PrefectBoardForm';

export const metadata = {
  title: 'Prefect Board'
};

export default function Page() {
  // This is a server component page that renders the client form
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#e0f2fe_0,#f8fafc_34%,#fff7ed_100%)] pb-16">
      <div className="pointer-events-none absolute left-0 top-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl" />
      <div className="relative px-4">
        <PrefectBoardForm />
      </div>
    </main>
  );
}
