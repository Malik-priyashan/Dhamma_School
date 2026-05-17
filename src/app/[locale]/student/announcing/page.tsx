import AnnouncingForm from '../../../features/announcing/AnnouncingForm';

export const metadata = {
  title: 'Announcing'
};

export default function Page() {
  return (
    <main className="min-h-screen py-12 bg-slate-50">
      <div className="px-4">
        <AnnouncingForm />
      </div>
    </main>
  );
}
