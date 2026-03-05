'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, ChevronRight } from 'lucide-react';

const TERMS = [
  {
    type: 'Objective',
    vn: 'Mục tiêu chiến lược',
    abbr: 'MT',
    en: 'Objective',
    dot: 'bg-blue-600',
    badge: 'bg-blue-600 text-white',
    border: 'border-l-blue-500',
    textColor: 'text-blue-700',
    desc: 'Mục tiêu cấp cao nhất của tổ chức. Định hướng toàn bộ hoạt động trong kỳ kế hoạch.',
    formula: '50% × tb.(YTTC/KCTK) + 50% × tb.(Tính năng)',
    role: 'Định hướng chiến lược',
  },
  {
    type: 'SuccessFactor',
    vn: 'Yếu tố thành công',
    abbr: 'YTTC',
    en: 'Success Factor',
    dot: 'bg-teal-500',
    badge: 'bg-teal-500 text-white',
    border: 'border-l-teal-500',
    textColor: 'text-teal-700',
    desc: 'Điều kiện cần thiết để mục tiêu được hoàn thành. Chứa các Kết quả then chốt để đo lường.',
    formula: 'Trung bình tiến độ các Kết quả then chốt con',
    role: 'Điều kiện thành công',
  },
  {
    type: 'KeyResult',
    vn: 'Kết quả then chốt',
    abbr: 'KCTK',
    en: 'Key Result',
    dot: 'bg-slate-600',
    badge: 'bg-slate-700 text-white',
    border: 'border-l-slate-500',
    textColor: 'text-slate-700',
    desc: 'Chỉ số đo lường cụ thể, có thể kiểm chứng. Chứa các Tính năng cần xây dựng để đạt được.',
    formula: '60% × tb.(Tính năng) + 40% × tb.(Tiếp nhận + Tác động)',
    role: 'Đo lường kết quả',
  },
  {
    type: 'Feature',
    vn: 'Tính năng',
    abbr: 'TN',
    en: 'Feature',
    dot: 'bg-pink-500',
    badge: 'bg-pink-400 text-white',
    border: 'border-l-pink-400',
    textColor: 'text-pink-700',
    desc: 'Chức năng sản phẩm cần xây dựng và triển khai. Tiến độ được tính từ các Năng lực người dùng bên trong.',
    formula: 'Trung bình tiến độ các Năng lực người dùng con',
    role: 'Xây dựng sản phẩm',
  },
  {
    type: 'UserCapability',
    vn: 'Năng lực người dùng',
    abbr: 'NLND',
    en: 'User Capability',
    dot: 'bg-purple-500',
    badge: 'bg-purple-500 text-white',
    border: 'border-l-purple-500',
    textColor: 'text-purple-700',
    desc: 'Khả năng cụ thể mà người dùng có được sau khi tính năng hoàn thành. Đơn vị nhỏ nhất trong triển khai.',
    formula: 'Cập nhật thủ công theo trạng thái',
    role: 'Năng lực người dùng',
  },
  {
    type: 'Adoption',
    vn: 'Mức độ tiếp nhận',
    abbr: 'TNDG',
    en: 'Adoption',
    dot: 'bg-green-600',
    badge: 'bg-green-600 text-white',
    border: 'border-l-green-500',
    textColor: 'text-green-700',
    desc: 'Mức độ người dùng thực sự sử dụng tính năng sau khi ra mắt. Tín hiệu kết quả kinh doanh về phía người dùng.',
    formula: 'Cập nhật thủ công / tính từ chỉ số thực tế',
    role: 'Tiếp nhận thị trường',
  },
  {
    type: 'Impact',
    vn: 'Tác động',
    abbr: 'TĐ',
    en: 'Impact',
    dot: 'bg-rose-400',
    badge: 'bg-rose-400 text-white',
    border: 'border-l-rose-400',
    textColor: 'text-rose-700',
    desc: 'Tác động kinh doanh thực tế — doanh thu, tiết kiệm chi phí, hiệu quả vận hành. Kết quả đầu ra cuối cùng.',
    formula: 'Cập nhật thủ công / tính từ chỉ số thực tế',
    role: 'Tác động kinh doanh',
  },
];

export function GlossaryButton() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const modal = open && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal — wide, two-column */}
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-8 py-5 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <BookOpen size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Bảng thuật ngữ OKR</h2>
                  <p className="text-xs text-blue-200 mt-0.5">7 loại hạng mục · Tên tiếng Việt · Viết tắt · Công thức tiến độ</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── Body ── */}
            <div className="overflow-y-auto flex-1">

              {/* Hierarchy strip */}
              <div className="px-8 py-4 bg-gray-50 border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cấu trúc phân cấp</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { abbr: 'MT', label: 'Mục tiêu', dot: 'bg-blue-600' },
                    { abbr: 'YTTC', label: 'Yếu tố thành công', dot: 'bg-teal-500' },
                    { abbr: 'KCTK', label: 'Kết quả then chốt', dot: 'bg-slate-600' },
                    { abbr: 'TN', label: 'Tính năng', dot: 'bg-pink-500' },
                  ].map((h, i, arr) => (
                    <div key={h.abbr} className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${h.dot}`} />
                        <span className="text-xs font-bold text-gray-700">{h.abbr}</span>
                        <span className="text-xs text-gray-400">{h.label}</span>
                      </div>
                      {i < arr.length - 1 && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
                    </div>
                  ))}
                  {/* Branch for leaf outcomes */}
                  <div className="flex items-center gap-1.5 ml-2 pl-3 border-l-2 border-dashed border-gray-200">
                    <span className="text-[10px] text-gray-400 font-semibold">con của TN:</span>
                    {[
                      { abbr: 'NLND', label: 'Năng lực NĐ', dot: 'bg-purple-500' },
                      { abbr: 'TNDG', label: 'Tiếp nhận', dot: 'bg-green-600' },
                      { abbr: 'TĐ', label: 'Tác động', dot: 'bg-rose-400' },
                    ].map(o => (
                      <div key={o.abbr} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <span className={`w-2.5 h-2.5 rounded-full ${o.dot}`} />
                        <span className="text-xs font-bold text-gray-700">{o.abbr}</span>
                        <span className="text-xs text-gray-400">{o.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Term grid — 2 columns */}
              <div className="px-8 py-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {TERMS.map(t => (
                  <div
                    key={t.type}
                    className={`rounded-2xl border border-gray-100 border-l-4 ${t.border} bg-white shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3`}
                  >
                    {/* Top row */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-lg shrink-0 ${t.badge}`}>
                            {t.abbr}
                          </span>
                          <span className={`text-sm font-bold leading-tight ${t.textColor}`}>{t.vn}</span>
                        </div>
                        <span className="text-[11px] text-gray-400 italic">{t.en}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap mt-0.5">
                        {t.role}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 leading-relaxed">{t.desc}</p>

                    {/* Formula */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-2.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Công thức tiến độ</span>
                      <span className="text-xs text-gray-700 font-medium">{t.formula}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick reference table */}
              <div className="px-8 pb-8">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Bảng tra cứu nhanh</p>
                <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide w-24">Viết tắt</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tiếng Việt</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tiếng Anh gốc</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Vai trò trong OKR</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Công thức</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {TERMS.map((t) => (
                        <tr key={t.type} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3">
                            <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-lg ${t.badge}`}>{t.abbr}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-sm font-semibold ${t.textColor}`}>{t.vn}</span>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-500 italic">{t.en}</td>
                          <td className="px-5 py-3 text-sm text-gray-600">{t.role}</td>
                          <td className="px-5 py-3">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg font-medium">{t.formula}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* ── Footer ── */}
            <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/60">
              <p className="text-xs text-gray-400">HG Entertainment · OKR Board 2026</p>
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl transition-colors"
              >
                <X size={14} /> Đóng
              </button>
            </div>
          </div>
        </div>
  );

  return (
    <>
      {/* Trigger — pill button with icon + label */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all"
      >
        <BookOpen size={14} />
        <span>Thuật ngữ</span>
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
