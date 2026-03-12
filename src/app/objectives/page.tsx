import { Header } from '@/components/layout/Header';
import { ObjectiveTree } from '@/components/objectives/ObjectiveTree';
import { CreateItemButton } from '@/components/objectives/CreateItemButton';

export default function ObjectivesPage() {
  return (
    <>
      <Header title="OKR Tree" />
      <main className="pt-14 bg-[#f8f9fa] min-h-screen">
        <div className="max-w-[1600px] mx-auto px-8 py-10">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cây OKR</h1>
              <p className="text-sm text-gray-500 mt-1">
                Mục tiêu → Yếu tố thành công → Kết quả then chốt → Tính năng
              </p>
            </div>
            <CreateItemButton />
          </div>
          <ObjectiveTree />
        </div>
      </main>
    </>
  );
}
