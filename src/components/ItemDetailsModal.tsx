import React from 'react';
import {
  X,
  Calendar,
  Clock,
  Tag,
  FileSpreadsheet,
  FileText,
  Edit3,
  Archive,
  Trash2,
} from 'lucide-react';
import { Item, TaxProfitSettings } from '../types';
import { formatCurrency, formatDateTime } from '../utils/pricing';
import { exportSingleItemPDF, exportToExcel } from '../utils/exportUtils';

interface ItemDetailsModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  settings: TaxProfitSettings;
  onEdit?: (item: Item) => void;
  onArchive?: (itemId: string) => void;
  onDelete?: (itemId: string) => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  item,
  onClose,
  settings,
  onEdit,
  onArchive,
  onDelete,
}) => {
  if (!isOpen || !item) return null;

  const dt = formatDateTime(item.createdAt);
  const profitBefore = item.profitBeforeTax ?? item.profitPerPiece ?? 0;
  const profitAfter = item.profitAfterTax ?? profitBefore;

  const handleExportItemExcel = () => {
    exportToExcel([item], `تفاصيل_المنتج_${item.sku}`);
  };

  const handleExportItemPDF = () => {
    exportSingleItemPDF(item, settings);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header with Date, Day & Time */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-lg w-fit mb-1.5">
              <span>رقم المسلسل:</span>
              <span className="font-mono">{item.serialNumber}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{dt.dayName}، {dt.dateStr}</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{dt.timeStr}</span>
              </span>
            </div>
          </div>
          {/* Close button on top left */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            title="إغلاق الشاشة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Visual & Info Row */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            {/* Product Image */}
            <div className="w-full sm:w-44 h-44 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-4 text-slate-400">
                  <Tag className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <span className="text-xs">بدون صورة</span>
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-3">
              <div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {item.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {item.name}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">كود الصنف (SKU)</span>
                  <span className="font-bold text-slate-800 font-mono text-sm">
                    {item.sku}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">القسم</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {item.category}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Details Cards */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              تفاصيل التسعير وهوامش الربح والضريبة
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {/* Official Price */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-2xs text-slate-500 block mb-1">
                  السعر الرسمي
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                  {formatCurrency(item.officialPrice, settings.currency)}
                </span>
              </div>

              {/* Price with Profit */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-2xs text-emerald-800 block mb-1 font-semibold">
                  بالمكسب ({settings.profitRate}%)
                </span>
                <span className="text-sm sm:text-base font-bold text-emerald-700 font-mono">
                  {formatCurrency(item.priceWithProfit, settings.currency)}
                </span>
              </div>

              {/* Price After Tax */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <span className="text-2xs text-slate-500 block mb-1">
                  بعد الضريبة ({settings.taxRate}%)
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-900 font-mono">
                  {formatCurrency(item.priceAfterTax, settings.currency)}
                </span>
              </div>

              {/* Profit before tax */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 text-center">
                <span className="text-2xs text-teal-800 block mb-1 font-semibold">
                  المكسب (قبل الضريبة)
                </span>
                <span className="text-sm sm:text-base font-bold text-teal-700 font-mono">
                  +{formatCurrency(profitBefore, settings.currency)}
                </span>
              </div>

              {/* Net profit after tax */}
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                <span className="text-2xs text-sky-800 block mb-1 font-semibold">
                  صافي الربح (بعد الضريبة)
                </span>
                <span className="text-sm sm:text-base font-bold text-sky-700 font-mono">
                  +{formatCurrency(profitAfter, settings.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions: تعديل، أرشفة، حذف في الأسفل */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 space-y-3">
          {/* أزرار تعديل، أرشفة، وحذف المطلوبة بالأسفل */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                if (onEdit) {
                  onClose();
                  onEdit(item);
                }
              }}
              className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-200 transition-all"
            >
              <Edit3 className="w-4 h-4 shrink-0" />
              <span className="truncate">تعديل</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onArchive) {
                  onClose();
                  onArchive(item.id);
                }
              }}
              className="py-2.5 px-3 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 border border-amber-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Archive className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="truncate">أرشفة</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onDelete) {
                  onClose();
                  onDelete(item.id);
                }
              }}
              className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200/80 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Trash2 className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">حذف</span>
            </button>
          </div>

          {/* Quick Export bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
            <span className="text-2xs text-slate-400 hidden xs:inline">
              تصدير بطاقة هذا المنتج:
            </span>
            <div className="flex items-center gap-2 w-full xs:w-auto">
              <button
                type="button"
                onClick={handleExportItemExcel}
                className="flex-1 xs:flex-none px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold text-2xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel</span>
              </button>
              <button
                type="button"
                onClick={handleExportItemPDF}
                className="flex-1 xs:flex-none px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-2xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
