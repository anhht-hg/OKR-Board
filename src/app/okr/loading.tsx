import { Header } from '@/components/layout/Header';

export default function OkrLoading() {
  return (
    <>
      <Header title="OKR Chi tiết" />
      <main className="pt-14 bg-[#f8f9fa] min-h-screen">
        <div className="max-w-[1600px] mx-auto px-8 py-10 animate-pulse space-y-4">
          {/* Objective tabs bar */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-9 w-36 bg-white rounded-xl border border-gray-100" />
            ))}
          </div>
          {/* Main content card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <div className="h-6 w-64 bg-gray-100 rounded-lg" />
            <div className="h-4 w-96 bg-gray-100 rounded" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 bg-gray-50 rounded-xl border border-gray-100" />
              ))}
            </div>
          </div>
          {/* Detail rows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-20" />
          ))}
        </div>
      </main>
    </>
  );
}
