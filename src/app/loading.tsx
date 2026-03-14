import { Header } from '@/components/layout/Header';

export default function DashboardLoading() {
  return (
    <>
      <Header title="Dashboard" />
      <main className="pt-14 bg-[#f8f9fa] min-h-screen">
        <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-6 animate-pulse">
          {/* Stat cards row */}
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-28 border border-gray-100" />
            ))}
          </div>
          {/* Two wide panels */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white rounded-2xl h-64 border border-gray-100" />
            <div className="bg-white rounded-2xl h-64 border border-gray-100" />
          </div>
          {/* Bottom row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl h-48 border border-gray-100" />
            <div className="bg-white rounded-2xl h-48 border border-gray-100" />
          </div>
        </div>
      </main>
    </>
  );
}
