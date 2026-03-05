import { Header } from '@/components/layout/Header';
import { OKRTable } from '@/components/list/OKRTable';

export default function ListPage() {
  return (
    <>
      <Header title="Danh sách" />
      <main className="pt-14 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Danh sách OKR</h2>
          <p className="text-sm text-gray-500 mt-1">
            Xem và lọc toàn bộ items với phân trang và tìm kiếm
          </p>
        </div>
        <OKRTable />
      </main>
    </>
  );
}
