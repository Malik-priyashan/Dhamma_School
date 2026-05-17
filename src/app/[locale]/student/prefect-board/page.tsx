import PrefectBoardForm from '@/app/features/prefectboard/PrefectBoardForm';

export const metadata = {
  title: 'Prefect Board'
};

export default function Page() {
  // This is a server component page that renders the client form
  return (
    <main>
      <PrefectBoardForm />
    </main>
  );
}
