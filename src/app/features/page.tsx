import { Header } from '@/components/layout/Header';
import { FeatureList } from '@/components/features/FeatureList';

export default function FeaturesPage() {
  return (
    <>
      <Header title="Quản lý Tính năng" />
      <main className="pt-14 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Quản lý Tính năng</h2>
          <p className="text-sm text-gray-500 mt-1">
            CRUD đầy đủ: Features, User Capabilities, Adoptions, Impacts
          </p>
        </div>
        <FeatureList />
      </main>
    </>
  );
}
