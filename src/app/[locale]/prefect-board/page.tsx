import PrefectBoardForm from '@/app/components/prefectboard/PrefectBoardForm';
import { useLocale } from 'next-intl';

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
