import NewsSection from "../../features/home/news/NewsSection";

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <NewsSection mode="full" />
      </div>
    </main>
  );
}