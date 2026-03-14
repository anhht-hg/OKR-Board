import { Header } from '@/components/layout/Header';

export default function ObjectivesLoading() {
  return (
    <>
      <Header title="OKR Tree" />
      <main className="pt-14 bg-[#f8f9fa] min-h-screen">
        <div className="max-w-[1600px] mx-auto px-8 py-10 animate-pulse">
          <div className="mb-8 flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-7 w-32 bg-gray-200 rounded-lg" />
              <div className="h-4 w-72 bg-gray-100 rounded" />
            </div>
            <div className="h-9 w-28 bg-gray-200 rounded-xl" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-16 bg-blue-100 rounded-full" />
                  <div className="h-5 w-64 bg-gray-100 rounded" />
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full" />
                <div className="flex gap-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-4 w-20 bg-gray-100 rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
