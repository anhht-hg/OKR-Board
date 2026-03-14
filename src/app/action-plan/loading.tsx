import { Header } from '@/components/layout/Header';

export default function ActionPlanLoading() {
  return (
    <>
      <Header title="Kế hoạch tháng" />
      <main className="pt-14 bg-[#f8f9fa] min-h-screen">
        <div className="max-w-[1400px] mx-auto px-8 py-8 animate-pulse space-y-6">
          {/* Month selector row */}
          <div className="flex items-center gap-4">
            <div className="h-9 w-32 bg-white rounded-xl border border-gray-100" />
            <div className="h-9 w-9 bg-white rounded-xl border border-gray-100" />
            <div className="h-9 w-9 bg-white rounded-xl border border-gray-100" />
            <div className="ml-auto h-9 w-36 bg-white rounded-xl border border-gray-100" />
          </div>
          {/* Plan cards */}
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 h-40">
                <div className="h-5 w-40 bg-gray-100 rounded" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-2 w-full bg-gray-100 rounded-full mt-4" />
              </div>
            ))}
          </div>
          {/* Detail table skeleton */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
            <div className="h-6 w-48 bg-gray-100 rounded" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-full bg-gray-50 rounded-lg border border-gray-100" />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
