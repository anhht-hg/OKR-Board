'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

interface FormulaRowProps {
  type: string;
  typeBg: string;
  typeText: string;
  formula: string;
  children?: string;
  example?: string;
  why: string;
}

function FormulaRow({ type, typeBg, typeText, formula, children, example, why }: FormulaRowProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${typeBg} ${typeText}`}>{type}</span>
        <span className="text-sm font-semibold text-gray-700 flex-1">{formula}</span>
        {open ? <ChevronDown size={14} className="text-gray-400 shrink-0" /> : <ChevronRight size={14} className="text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-gray-50/60 space-y-2 text-xs text-gray-500 border-t border-gray-100">
          {children && (
            <div><span className="font-semibold text-gray-600">Đầu vào:</span> {children}</div>
          )}
          {example && (
            <div className="bg-white border border-gray-100 rounded-lg px-3 py-2 font-mono text-[11px] text-gray-600">
              {example}
            </div>
          )}
          <div><span className="font-semibold text-gray-600">Tại sao?</span> {why}</div>
        </div>
      )}
    </div>
  );
}

function HierarchyDiagram() {
  const nodes = [
    { label: 'Objective', bg: 'bg-blue-600', text: 'text-white', indent: 0, note: '= 50% SF/KR + 50% Features' },
    { label: 'Success Factor', bg: 'bg-teal-500', text: 'text-white', indent: 1, note: '= avg(Key Results)' },
    { label: 'Key Result', bg: 'bg-slate-700', text: 'text-white', indent: 2, note: '= 60% Feature + 40% Adoption+Impact' },
    { label: 'Feature', bg: 'bg-pink-400', text: 'text-white', indent: 3, note: '= avg(User Capabilities) — UC only!' },
    { label: 'User Capability', bg: 'bg-purple-500', text: 'text-white', indent: 4, note: '→ drives Feature progress' },
    { label: 'Adoption', bg: 'bg-green-600', text: 'text-white', indent: 4, note: '→ drives Key Result (outcome side)' },
    { label: 'Impact', bg: 'bg-rose-400', text: 'text-white', indent: 4, note: '→ drives Key Result (outcome side)' },
  ];
  return (
    <div className="space-y-1.5">
      {nodes.map((n, i) => (
        <div key={i} className="flex items-center gap-2" style={{ paddingLeft: `${n.indent * 20}px` }}>
          {n.indent > 0 && <span className="text-gray-200 text-xs shrink-0">└</span>}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${n.bg} ${n.text}`}>{n.label}</span>
          <span className="text-xs text-gray-400">{n.note}</span>
        </div>
      ))}
    </div>
  );
}

export function ProgressLogicExplainer() {
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'formulas' | 'example'>('hierarchy');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
          <Info size={15} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">Cách tính tiến độ</h3>
          <p className="text-xs text-gray-400">Logic đằng sau các con số progress</p>
        </div>
        {/* Tabs */}
        <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {([
            { key: 'hierarchy', label: 'Cấu trúc' },
            { key: 'formulas',  label: 'Công thức' },
            { key: 'example',   label: 'Ví dụ' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">

        {/* Tab: Cấu trúc */}
        {activeTab === 'hierarchy' && (
          <div className="space-y-5">
            <p className="text-sm text-gray-500">
              Mỗi loại item đóng vai trò khác nhau trong việc tính tiến độ. Nhấn vào từng loại để xem chi tiết.
            </p>
            <HierarchyDiagram />
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 space-y-1">
              <p className="font-semibold">⚠️ Lưu ý quan trọng</p>
              <p>Adoption và Impact <strong>không ảnh hưởng</strong> đến tiến độ Feature. Chúng chỉ ảnh hưởng đến Key Result (phía kết quả đạt được).</p>
              <p className="mt-1">Vì vậy: Feature hoàn thành = chúng ta đã xây xong. KR hoàn thành = người dùng đã thực sự dùng và tạo ra giá trị.</p>
            </div>
          </div>
        )}

        {/* Tab: Công thức */}
        {activeTab === 'formulas' && (
          <div className="space-y-2">
            <FormulaRow
              type="User Capability"
              typeBg="bg-purple-500" typeText="text-white"
              formula="progressPct = STATUS_WEIGHT[status]"
              children="Trạng thái của chính item đó"
              example={'Hoàn thành → 100%\nĐang triển khai → 50%\nChưa bắt đầu → 0%'}
              why="UC là lá cây — không có con, chỉ dùng trạng thái của chính nó."
            />
            <FormulaRow
              type="Adoption / Impact"
              typeBg="bg-green-600" typeText="text-white"
              formula="progressPct = STATUS_WEIGHT[status]"
              children="Trạng thái của chính item đó"
              example={'Hoàn thành → 100%\nĐang triển khai → 50%\nChưa bắt đầu → 0%'}
              why="Adoption và Impact cũng là lá cây. Chúng tác động lên Key Result, không phải Feature."
            />
            <FormulaRow
              type="Feature"
              typeBg="bg-pink-400" typeText="text-white"
              formula="progressPct = avg(User Capability children)"
              children="Chỉ tính các User Capability con — bỏ qua Adoption & Impact"
              example={'FE-2 có 4 UC:\n  UC-1: Hoàn thành (100%)\n  UC-2: Hoàn thành (100%)\n  UC-3: Hoàn thành (100%)\n  UC-4: Hoàn thành (100%)\n→ FE-2 = 100%'}
              why="Feature đo lường việc xây dựng — chỉ UC phản ánh việc chức năng đã được triển khai. Adoption/Impact là kết quả sau khi user dùng, không phải quá trình xây."
            />
            <FormulaRow
              type="Key Result"
              typeBg="bg-slate-700" typeText="text-white"
              formula="progressPct = 60% × avg(Features) + 40% × avg(Adoption+Impact)"
              children="Feature children (đã tính theo UC) + Adoption/Impact grandchildren (qua Feature)"
              example={'KR có 3 Features: avg = 70%\nKR có 5 Adoption+Impact: avg = 30%\n→ KR = 60% × 70% + 40% × 30%\n→ KR = 42% + 12% = 54%'}
              why="KR cần đo cả hai chiều: chúng ta đã xây xong chưa (60%) VÀ kết quả thực tế có không (40%). 60/40 vì delivery đến trước, outcome đến sau."
            />
            <FormulaRow
              type="Success Factor"
              typeBg="bg-teal-500" typeText="text-white"
              formula="progressPct = avg(Key Result children)"
              children="Tất cả Key Results thuộc SF này"
              example={'SF có 3 KR:\n  KR-1: 54%\n  KR-2: 20%\n  KR-3: 0%\n→ SF = (54+20+0)/3 = 25%'}
              why="SF là tập hợp các KR. Nếu tất cả KR đều đạt, SF đạt. Đơn giản và trực quan."
            />
            <FormulaRow
              type="Objective"
              typeBg="bg-blue-600" typeText="text-white"
              formula="progressPct = 50% × avg(SF+KR) + 50% × avg(Features)"
              children="Tất cả SF/KR con trực tiếp + tất cả Feature trong toàn bộ cây con"
              example={'OBJ có SF/KR avg = 30%\nOBJ có tất cả Features avg = 45%\n→ OBJ = 50% × 30% + 50% × 45%\n→ OBJ = 15% + 22.5% = 38%'}
              why="Objective là mục tiêu lớn nhất. Cần thấy cả hai: chiến lược (SF/KR đang đi đúng hướng?) và thực thi (chúng ta đang ship?). 50/50 để cân bằng hai tín hiệu."
            />
          </div>
        )}

        {/* Tab: Ví dụ thực tế */}
        {activeTab === 'example' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Ví dụ tính toán cho một Key Result điển hình:</p>

            {/* Tree example */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-xs font-mono">
              <div className="text-gray-400 text-[10px] uppercase font-sans font-semibold mb-2">Cấu trúc ví dụ</div>

              <div className="flex items-center gap-2">
                <span className="bg-slate-700 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-sans">KR</span>
                <span className="text-gray-700 font-sans">Thời gian thao tác phân phối giảm 50%</span>
              </div>

              <div className="pl-5 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">└</span>
                  <span className="bg-pink-400 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-sans">FE</span>
                  <span className="text-gray-600 font-sans">FE-1 <span className="text-emerald-500">(100%)</span></span>
                </div>
                <div className="pl-5 space-y-1">
                  {['UC: Hoàn thành (100%)', 'UC: Hoàn thành (100%)'].map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-gray-200">└</span>
                      <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-sans">UC</span>
                      <span className="text-gray-500 font-sans">{t}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="text-gray-300">└</span>
                  <span className="bg-green-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-sans">AD</span>
                  <span className="text-gray-600 font-sans">Adoption: Hoàn thành <span className="text-emerald-500">(100%)</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">└</span>
                  <span className="bg-rose-400 text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-sans">IM</span>
                  <span className="text-gray-600 font-sans">Impact: Đang triển khai <span className="text-orange-500">(50%)</span></span>
                </div>
              </div>
            </div>

            {/* Calculation steps */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-pink-50 border border-pink-100 rounded-xl px-4 py-3">
                <span className="bg-pink-400 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5">FE</span>
                <div className="text-xs text-gray-600">
                  <span className="font-semibold">Bước 1 — Feature:</span>
                  {' '}avg(UC) = (100% + 100%) / 2 = <span className="font-bold text-pink-600">100%</span>
                  <p className="text-gray-400 mt-0.5">Adoption và Impact bị bỏ qua ở bước này.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <span className="bg-slate-700 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 mt-0.5">KR</span>
                <div className="text-xs text-gray-600 space-y-1">
                  <span className="font-semibold">Bước 2 — Key Result:</span>
                  <div className="font-mono text-[11px] bg-white border border-gray-100 rounded px-2 py-1.5 mt-1">
                    Delivery  = avg(Features)         = 100%{'\n'}
                    Outcomes  = avg(Adoption+Impact)  = (100+50)/2 = 75%{'\n'}
                    KR = 60% × 100% + 40% × 75%{'\n'}
                    KR = 60% + 30% = <span className="text-indigo-600 font-bold">90%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
              <p className="font-semibold mb-1">💡 Điều gì xảy ra nếu Feature = 100% nhưng Adoption = 0%?</p>
              <p>KR = 60% × 100% + 40% × 0% = <strong>60%</strong>. Nghĩa là: chúng ta đã xây xong nhưng chưa ai dùng. KR chỉ đạt 60% để cảnh báo đây là rủi ro.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
