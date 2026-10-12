import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Filter,
  FileSpreadsheet,
  FileText,
  Plus,
  Archive,
  Edit3,
  Trash2,
  Tag,
  RotateCcw,
  CheckSquare,
  Square,
} from 'lucide-react';
import { CATEGORIES, Item, TaxProfitSettings } from '../types';
import { formatCurrency, formatDateTime } from '../utils/pricing';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface ItemsTableProps {
  items: Item[];
  settings: TaxProfitSettings;
  onOpenAddItem: () => void;
  onViewItemDetails: (item: Item) => void;
  onEditItem: (item: Item) => void;
  onArchiveItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  settings,
  onOpenAddItem,
  onViewItemDetails,
  onEditItem,
  onArchiveItem,
  onDeleteItem,
}) => {
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Selected row IDs for batch export
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  // Filter items logic
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search by name or SKU or serialNumber
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase().trim());

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;

      // Date filter (matches YYYY-MM-DD)
      const matchesDate =
        !selectedDate || item.createdAt.slice(0, 10) === selectedDate;

      return matchesSearch && matchesCategory && matchesDate;
    });
  }, [items, searchQuery, selectedCategory, selectedDate]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedItemIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedItemIds(next);
  };

  // Export handlers
  const getSelectedOrAllItems = (): Item[] => {
    if (selectedItemIds.size > 0) {
      return filteredItems.filter((i) => selectedItemIds.has(i.id));
    }
    return filteredItems;
  };

  const handleExportExcel = () => {
    const toExport = getSelectedOrAllItems();
    if (toExport.length === 0) {
      alert('لا توجد أصناف لتصديرها.');
      return;
    }
    exportToExcel(
      toExport,
      selectedItemIds.size > 0
        ? `أصناف_محددة_${selectedItemIds.size}`
        : 'سجل_الأصناف_الكامل'
    );
  };

  const handleExportPDF = () => {
    const toExport = getSelectedOrAllItems();
    if (toExport.length === 0) {
      alert('لا توجد أصناف لتصديرها.');
      return;
    }
    exportToPDF(
      toExport,
      selectedItemIds.size > 0
        ? `تقرير الأصناف المحددة (${selectedItemIds.size} صنف)`
        : 'تقرير سجل الأصناف العام',
      settings
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedDate('');
  };

  const hasActiveFilters =
    Boolean(searchQuery) || selectedCategory !== 'all' || Boolean(selectedDate);

  const isAllSelected =
    filteredItems.length > 0 && selectedItemIds.size === filteredItems.length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Action Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        {/* Title & Buttons row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <span>سجل الأصناف</span>
              <span className="text-2xs sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold">
                {filteredItems.length} صنف
              </span>
            </h2>
          </div>

          {/* Action Buttons: تصدير إكسيل + تصدير PDF + أضف منتج في سطر واحد تماماً بدون مسطرة تحريك */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="w-full py-2 px-1.5 sm:px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs whitespace-nowrap"
              title="تصدير إلى ملف Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">
                Excel {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
              </span>
            </button>

            <button
              onClick={handleExportPDF}
              className="w-full py-2 px-1.5 sm:px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shadow-2xs whitespace-nowrap"
              title="تصدير إلى ملف PDF"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                PDF {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''}
              </span>
            </button>

            <button
              onClick={onOpenAddItem}
              className="w-full py-2 px-1.5 sm:px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm shadow-emerald-200 transition-all whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">أضف صنف</span>
            </button>
          </div>
        </div>

        {/* Filter bar:
            الصف الأول: زر بحث وزر التاريخ في صف واحد
            الصف الثاني أسفلهم: اختيار الأقسام */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Row 1: Search + Date picker in ONE row */}
          <div className="grid grid-cols-2 gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم أو SKU..."
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl pr-8 pl-2.5 py-2 text-slate-800 text-xs sm:text-sm transition-all"
              />
            </div>

            {/* Date Picker */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-2.5 py-2 text-slate-800 text-xs sm:text-sm font-medium transition-all"
                title="فلترة بتاريخ معين"
              />
            </div>
          </div>

          {/* Row 2: Category dropdown below them */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm font-medium transition-all"
            >
              <option value="all">جميع الأقسام</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Reset Filters button if active */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shrink-0"
                title="إلغاء الفلاتر"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إلغاء</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Tag className="w-7 h-7" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-700">
              لا توجد أصناف مطابقة للبحث أو الفلتر
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              يمكنك مسح الفلاتر أو إضافة صنف جديد باستخدام الزر أدناه
            </p>
            <button
              onClick={onOpenAddItem}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة صنف الآن</span>
            </button>
          </div>
        ) : (
          <>
            {/* ========================================================
                MOBILE VIEW (نسخة الهاتف):
                يظهر فقط: المسلسل، الصورة، اسم الصنف، ولاين بالمكسب
                في سطر واحد مع مراعاة عدم وجود مسطرة لتحريك يمين أو يسار
                وعند الضغط على أي منتج يفتح شاشة التفاصيل بجميع البيانات.
               ======================================================== */}
            <div className="block md:hidden divide-y divide-slate-100">
              {/* Mobile Quick Select All Bar */}
              <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-2xs text-slate-500">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 font-bold hover:text-emerald-700 transition-colors"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                  <span>تحديد الكل ({filteredItems.length})</span>
                </button>
                <span>اضغط على أي صنف لعرض التفاصيل</span>
              </div>

              {filteredItems.map((item) => {
                const isSelected = selectedItemIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => onViewItemDetails(item)}
                    className={`p-3 transition-colors cursor-pointer select-none active:bg-emerald-50/60 ${
                      isSelected ? 'bg-emerald-50/70' : 'bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* زر التحديد (Checkbox) */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSelect(item.id, e)}
                        className="text-slate-400 hover:text-emerald-600 shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      {/* الصورة بحجم متوسط */}
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Tag className="w-5 h-5 text-slate-300" />
                        )}
                      </div>

                      {/* بجانبها المسمى وأسفل المسمى السريل والسعر بعد الضريبة */}
                      <div className="flex-1 min-w-0 pr-0.5">
                        {/* مسمى الصنف */}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug mb-1">
                          {item.name}
                        </h4>

                        {/* أسفل المسمى: السريل والسعر بعد الضريبة */}
                        <div className="flex items-center gap-1.5 text-2xs text-slate-600 font-mono">
                          <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded leading-none shrink-0">
                            {item.serialNumber}
                          </span>
                          <span className="text-slate-300 leading-none">•</span>
                          <span className="text-emerald-700 font-bold truncate leading-none">
                            {formatCurrency(item.priceAfterTax, settings.currency)}
                          </span>
                        </div>
                      </div>

                      {/* على اليسار: في الأسفل التاريخ الذي تم تسجيل به المنتج، وفي الأعلى المكسب */}
                      <div className="shrink-0 text-left pl-0.5 flex flex-col items-end justify-between self-stretch">
                        <span className="text-xs font-bold font-mono text-emerald-700 whitespace-nowrap leading-tight">
                          +{(item.profitBeforeTax ?? item.profitPerPiece ?? 0).toFixed(2)} {settings.currency}
                        </span>
                        {/* في الأسفل على اليسار: التاريخ الذي تم تسجيل به المنتج */}
                        <span className="text-3xs text-slate-400 font-mono flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDateTime(item.createdAt).dateStr}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ========================================================
                DESKTOP VIEW (نسخة الكمبيوتر):
                الجدول الكامل الغني بجميع الأعمدة والإجراءات السريعة
               ======================================================== */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 select-none">
                    <th className="p-3.5 w-10 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        className="text-slate-400 hover:text-emerald-600 transition-colors"
                        title={isAllSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
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
                    <th className="p-3.5 whitespace-nowrap font-mono text-left text-sky-700">
                      صافي الربح
                    </th>
                    <th className="p-3.5 whitespace-nowrap text-center">التاريخ</th>
                    <th className="p-3.5 whitespace-nowrap text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItemIds.has(item.id);
                    const dt = formatDateTime(item.createdAt);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => onViewItemDetails(item)}
                        className={`cursor-pointer transition-colors hover:bg-emerald-50/40 ${
                          isSelected ? 'bg-emerald-50/60' : 'bg-white'
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="p-3.5 text-center"
                          onClick={(e) => handleToggleSelect(item.id, e)}
                        >
                          <button
                            type="button"
                            className="text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Serial Number */}
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-xs text-slate-600">
                          {item.serialNumber}
                        </td>

                        {/* Image Thumbnail */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Tag className="w-4 h-4 text-slate-300" />
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="p-3.5 whitespace-nowrap font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                          {item.name}
                        </td>

                        {/* Category */}
                        <td className="p-3.5 whitespace-nowrap text-xs text-slate-600">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                            {item.category}
                          </span>
                        </td>

                        {/* SKU */}
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

                        {/* Net Profit After Tax */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-left font-bold text-sky-700">
                          +{(item.profitAfterTax ?? item.profitBeforeTax ?? item.profitPerPiece ?? 0).toFixed(2)}
                        </td>

                        {/* Date */}
                        <td className="p-3.5 whitespace-nowrap text-center text-xs text-slate-500">
                          <div>{dt.dateStr}</div>
                          <div className="text-2xs text-slate-400">{dt.timeStr}</div>
                        </td>

                        {/* Actions */}
                        <td
                          className="p-3.5 whitespace-nowrap text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onArchiveItem(item.id)}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              title="أرشفة الصنف"
                            >
                              <Archive className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditItem(item)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="تعديل الصنف"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف الصنف"
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
