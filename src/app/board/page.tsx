import { Header } from '@/components/layout/Header';
import { KanbanBoard } from '@/components/board/KanbanBoard';

export default function BoardPage() {
  return (
    <>
      <Header title="Kanban Board" />
      <main className="pt-14 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Kanban Board</h2>
          <p className="text-sm text-gray-500 mt-1">
            Xem và cập nhật trạng thái theo cột
          </p>
        </div>
        <KanbanBoard />
      </main>
    </>
  );
}
