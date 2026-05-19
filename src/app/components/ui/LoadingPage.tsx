export default function LoadingPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50/80 backdrop-blur-sm fixed inset-0 z-[100]">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-300">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-800">Loading</h3>
          <p className="text-sm text-slate-500 font-medium mt-1">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
}
