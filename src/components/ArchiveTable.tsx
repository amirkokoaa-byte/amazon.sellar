import React, { useState, useMemo } from 'react';
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  FileSpreadsheet,
  FileText,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Item, TaxProfitSettings } from '../types';
import { formatCurrency, formatDateTime } from '../utils/pricing';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface ArchiveTableProps {
  archivedItems: Item[];
  settings: TaxProfitSettings;
  onRestoreItem: (itemId: string) => void;
  onDeletePermanently: (itemId: string) => void;
  onViewItemDetails: (item: Item) => void;
  onBackToRegistry: () => void;
}

export const ArchiveTable: React.FC<ArchiveTableProps> = ({
  archivedItems,
  settings,
  onRestoreItem,
  onDeletePermanently,
  onViewItemDetails,
  onBackToRegistry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArchived = useMemo(() => {
    return archivedItems.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [archivedItems, searchQuery]);

  const handleExportExcel = () => {
    if (filteredArchived.length === 0) {
      alert('لا توجد أصناف في الأرشيف لتصديرها.');
      return;
    }
    exportToExcel(filteredArchived, 'أرشيف_المنتجات_المؤرشفة');
  };

  const handleExportPDF = () => {
    if (filteredArchived.length === 0) {
      alert('لا توجد أصناف في الأرشيف لتصديرها.');
      return;
    }
    exportToPDF(filteredArchived, 'تقرير أرشيف المنتجات', settings);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Banner & Actions */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBackToRegistry}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors shrink-0"
              title="العودة إلى سجل الأصناف"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <span>أرشيف المنتجات (سحابي)</span>
                <span className="text-2xs sm:text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
                  {archivedItems.length} مؤرشف
                </span>
              </h2>
            </div>
          </div>

          {/* Action buttons in single row on mobile */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="w-full py-2 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>Excel الأرشيف</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="w-full py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>PDF الأرشيف</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في الأرشيف باسم الصنف أو SKU..."
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl pr-8 pl-3 py-2 text-slate-800 text-xs sm:text-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* Archive Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredArchived.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
              <Archive className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-700">
              {archivedItems.length === 0
                ? 'الأرشيف السحابي فارغ حالياً'
                : 'لا توجد نتائج مطابقة في الأرشيف'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              عند الضغط على زر "أرشفة" لأي منتج من السجل الرئيسي، سينتقل سحابياً إلى هنا.
            </p>
            <button
              onClick={onBackToRegistry}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>الذهاب إلى سجل الأصناف</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile View: Single compact row with restore button */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredArchived.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onViewItemDetails(item)}
                  className="px-3 py-2.5 flex items-center gap-2.5 transition-colors cursor-pointer select-none bg-white hover:bg-slate-50 active:bg-amber-50/60"
                >
                  {/* Serial */}
                  <span className="font-mono text-2xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                    {item.serialNumber}
                  </span>

                  {/* Thumbnail */}
                  <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover grayscale-40"
                      />
                    ) : (
                      <Tag className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <span className="text-2xs text-slate-400 truncate block">
                      {item.category}
                    </span>
                  </div>

                  {/* Profit Line */}
                  <div className="shrink-0 text-left pl-1">
                    <span className="text-2xs text-slate-400 block font-normal leading-none mb-0.5">
                      قبل الضريبة
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-700 whitespace-nowrap leading-none block">
                      +{(item.profitBeforeTax ?? item.profitPerPiece ?? 0).toFixed(2)} {settings.currency}
                    </span>
                  </div>

                  {/* Restore Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRestoreItem(item.id);
                    }}
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 shrink-0 transition-colors"
                    title="استعادة سحابية للسجل"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 select-none">
                    <th className="p-3.5 whitespace-nowrap">المسلسل</th>
                    <th className="p-3.5 whitespace-nowrap">الصورة</th>
                    <th className="p-3.5 whitespace-nowrap">اسم الصنف</th>
                    <th className="p-3.5 whitespace-nowrap">القسم</th>
                    <th className="p-3.5 whitespace-nowrap">كود SKU</th>
                    <th className="p-3.5 whitespace-nowrap font-mono text-left">
                      الرسمي ({settings.currency})
                    </th>
                    <th className="p-3.5 whitespace-nowrap font-mono text-left text-emerald-700">
                      بالمكسب ({settings.profitRate}%)
                    </th>
                    <th className="p-3.5 whitespace-nowrap font-mono text-left">
                      بعد الضريبة ({settings.taxRate}%)
                    </th>
                    <th className="p-3.5 whitespace-nowrap font-mono text-left text-teal-700">
                      قبل الضريبة
                    </th>
                    <th className="p-3.5 whitespace-nowrap text-center">تاريخ الأرشفة</th>
                    <th className="p-3.5 whitespace-nowrap text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredArchived.map((item) => {
                    const archDt = formatDateTime(item.archivedAt || item.createdAt);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onViewItemDetails(item)}
                        className="cursor-pointer hover:bg-amber-50/40 transition-colors bg-white"
                      >
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-xs text-slate-600">
                          {item.serialNumber}
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover grayscale-40"
                              />
                            ) : (
                              <Tag className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-bold text-slate-900">
                          {item.name}
                        </td>

                        <td className="p-3.5 whitespace-nowrap text-xs text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {item.category}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap font-mono text-xs text-slate-500">
                          {item.sku}
                        </td>

                        {/* Official Price */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-left font-medium text-slate-700">
                          {item.officialPrice.toFixed(2)}
                        </td>

                        {/* Price With Profit */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-left font-bold text-emerald-700">
                          {item.priceWithProfit.toFixed(2)}
                        </td>

                        {/* Price After Tax */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-left font-medium text-slate-700">
                          {item.priceAfterTax.toFixed(2)}
                        </td>

                        {/* Profit Before Tax */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-left font-bold text-teal-700">
                          +{(item.profitBeforeTax ?? item.profitPerPiece ?? 0).toFixed(2)}
                        </td>

                        <td className="p-3.5 whitespace-nowrap text-center text-xs text-slate-500">
                          <div>{archDt.dateStr}</div>
                          <div className="text-2xs text-slate-400">{archDt.timeStr}</div>
                        </td>

                        <td
                          className="p-3.5 whitespace-nowrap text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onRestoreItem(item.id)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
                              title="استعادة الصنف إلى السجل الرئيسي"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>استعادة</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeletePermanently(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف نهائي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
