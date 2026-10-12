import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Coins,
  PackageCheck,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  FileText,
  DollarSign,
  Clock,
  Sparkles,
  ArrowUpRight,
  Percent,
} from 'lucide-react';
import { Item, TaxProfitSettings } from '../types';
import { formatCurrency, formatDateTime } from '../utils/pricing';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface ProfitsViewProps {
  items: Item[];
  settings: TaxProfitSettings;
  onOpenAddItem: () => void;
  onViewItemDetails: (item: Item) => void;
}

type TimePeriod = 'day' | 'week' | 'month' | 'year';

export const ProfitsView: React.FC<ProfitsViewProps> = ({
  items,
  settings,
  onOpenAddItem,
  onViewItemDetails,
}) => {
  // Toggle for showing the timeline
  const [showTimeline, setShowTimeline] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  // Core metrics requested by the user:
  // 1. عدد المنتجات المعروضة
  const displayedCount = items.length;

  // 2. إجمالي الأسعار الرسمية
  const totalOfficialPrice = items.reduce(
    (sum, item) => sum + (item.officialPrice || 0),
    0
  );

  // 3. إجمالي الأرباح قبل الضريبة
  const totalProfitBeforeTax = items.reduce(
    (sum, item) => sum + (item.profitBeforeTax ?? item.profitPerPiece ?? 0),
    0
  );

  // 4. إجمالي الأسعار بعد الضريبة
  const totalPriceAfterTax = items.reduce(
    (sum, item) => sum + (item.priceAfterTax || 0),
    0
  );

  // 5. إجمالي الأرباح بعد الضريبة (صافي الربح الفعلي)
  const totalProfitAfterTax = items.reduce(
    (sum, item) =>
      sum +
      (item.profitAfterTax ??
        item.profitBeforeTax ??
        item.profitPerPiece ??
        0),
    0
  );

  // Time-series breakdown logic based on selected period
  const timelineData = useMemo(() => {
    const now = new Date();

    // Group items by period
    const groups: {
      [key: string]: {
        label: string;
        count: number;
        official: number;
        afterTax: number;
        profitBeforeTax: number;
        profitAfterTax: number;
        items: Item[];
      };
    } = {};

    // Sort items by date ascending for timeline
    const sorted = [...items].sort(
      (a, b) =>
        new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
    );

    if (sorted.length === 0) return [];

    sorted.forEach((item) => {
      const d = new Date(item.createdAt || now);
      let key = '';
      let label = '';

      if (selectedPeriod === 'day') {
        key = d.toISOString().slice(0, 10);
        const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        label = `${dayNames[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`;
      } else if (selectedPeriod === 'week') {
        const weekNum = Math.ceil(d.getDate() / 7);
        key = `${d.getFullYear()}-${d.getMonth() + 1}-W${weekNum}`;
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        label = `الأسبوع ${weekNum} - ${monthNames[d.getMonth()]}`;
      } else if (selectedPeriod === 'month') {
        key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      } else if (selectedPeriod === 'year') {
        key = `${d.getFullYear()}`;
        label = `عام ${d.getFullYear()}`;
      }

      if (!groups[key]) {
        groups[key] = {
          label,
          count: 0,
          official: 0,
          afterTax: 0,
          profitBeforeTax: 0,
          profitAfterTax: 0,
          items: [],
        };
      }

      groups[key].count += 1;
      groups[key].official += item.officialPrice || 0;
      groups[key].afterTax += item.priceAfterTax || 0;
      groups[key].profitBeforeTax += item.profitBeforeTax ?? item.profitPerPiece ?? 0;
      groups[key].profitAfterTax +=
        item.profitAfterTax ?? item.profitBeforeTax ?? item.profitPerPiece ?? 0;
      groups[key].items.push(item);
    });

    return Object.values(groups);
  }, [items, selectedPeriod]);

  // Max value for scaling bars
  const maxVolume = useMemo(() => {
    if (timelineData.length === 0) return 1;
    return Math.max(...timelineData.map((d) => d.afterTax), 1);
  }, [timelineData]);

  // Export handlers
  const handleExportExcel = () => {
    if (items.length === 0) {
      alert('لا توجد بيانات أصناف لتصدير تقرير الأرباح.');
      return;
    }
    exportToExcel(items, `تقرير_تحليل_الأرباح_${selectedPeriod}`);
  };

  const handleExportPDF = () => {
    if (items.length === 0) {
      alert('لا توجد بيانات أصناف لتصدير تقرير الأرباح.');
      return;
    }
    exportToPDF(
      items,
      `تقرير تحليل الأرباح والمسلسل الزمني (${settings.currency})`,
      settings
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-slate-900">
                  لوحة تحليلات الأرباح وحجم المبيعات
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  حسابات دقيقة للأسعار الرسمية وهوامش الربح مع مسلسل زمني تفاعلي
                </p>
              </div>
            </div>
          </div>

          {/* Export Actions & Timeline Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTimeline(!showTimeline)}
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                showTimeline
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showTimeline ? 'إخفاء المسلسل الزمني' : 'أظهر مسلسل زمني'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="py-2 px-2.5 sm:px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              title="تصدير تقرير إكسيل"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden xs:inline">Excel</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="py-2 px-2.5 sm:px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
              title="تصدير تقرير PDF"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">PDF</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            CORE STATS SECTION (الخانات المطلوبة بالتحديد بالاسم):
            1. عدد المنتجات المعروضة
            2. إجمالي الأسعار الرسمية
            3. إجمالي الأرباح قبل الضريبة
            4. إجمالي الأسعار بعد الضريبة
           ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mt-5">
          {/* 1. عدد المنتجات المعروضة */}
          <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-bold mb-1">
              عدد المنتجات المعروضة
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg sm:text-2xl font-bold text-slate-900 font-mono">
                {displayedCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">صنف معروض</span>
            </div>
            <div className="mt-2 text-2xs text-slate-400">
              منتجات نشطة في السجل
            </div>
          </div>

          {/* 2. إجمالي الأسعار الرسمية */}
          <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-xs text-slate-500 font-bold mb-1">
              إجمالي الأسعار الرسمية
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-bold text-slate-800 font-mono block">
                {formatCurrency(totalOfficialPrice, settings.currency)}
              </span>
            </div>
            <div className="mt-2 text-2xs text-slate-400">
              إجمالي تكلفة الشراء الأساسية
            </div>
          </div>

          {/* 3. إجمالي الأرباح قبل الضريبة */}
          <div className="bg-teal-50/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-teal-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-xs text-teal-800 font-bold mb-1">
              إجمالي الأرباح قبل الضريبة
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-bold text-teal-700 font-mono block">
                +{formatCurrency(totalProfitBeforeTax, settings.currency)}
              </span>
            </div>
            <div className="mt-2 text-2xs text-teal-700/80">
              بنسبة ربح {settings.profitRate}%
            </div>
          </div>

          {/* 4. إجمالي الأسعار بعد الضريبة */}
          <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-200/80 shadow-2xs flex flex-col justify-between">
            <span className="text-xs text-emerald-800 font-bold mb-1">
              إجمالي الأسعار بعد الضريبة
            </span>
            <div className="mt-1">
              <span className="text-base sm:text-xl font-bold text-emerald-700 font-mono block">
                {formatCurrency(totalPriceAfterTax, settings.currency)}
              </span>
            </div>
            <div className="mt-2 text-2xs text-emerald-700/80">
              القيمة البيعية الإجمالية للمستهلك
            </div>
          </div>
        </div>

        {/* إشعار صافي الأرباح بعد الضريبة */}
        <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center justify-between text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
            <span className="font-bold">صافي الأرباح بعد استقطاع الضريبة ({settings.taxRate}%):</span>
          </div>
          <span className="font-mono font-bold text-sm text-sky-700">
            +{formatCurrency(totalProfitAfterTax, settings.currency)}
          </span>
        </div>
      </div>

      {/* ========================================================
          TIMELINE SECTION (المسلسل الزمني لحجم المبيعات والأرباح):
          يظهر حجم المبيعات في خلال فترة معينة: يوم، أسبوع، شهر، سنة
         ======================================================== */}
      {showTimeline && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  المسلسل الزمني لحجم المبيعات والأرباح
                </h3>
                <p className="text-2xs sm:text-xs text-slate-500">
                  توزيع إجمالي الأسعار والأرباح وحجم المنتجات حسب الفترة الزمنية
                </p>
              </div>
            </div>

            {/* Time Period Selector: يوم | أسبوع | شهر | سنة */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setSelectedPeriod('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'day'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                يوم
              </button>
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'week'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                أسبوع
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'month'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                شهر
              </button>
              <button
                onClick={() => setSelectedPeriod('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedPeriod === 'year'
                    ? 'bg-white text-emerald-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                سنة
              </button>
            </div>
          </div>

          {/* Timeline Visual Representation */}
          {timelineData.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              لا توجد بيانات كافية لعرض المسلسل الزمني. قم بتسجيل أصناف في السجل أولاً.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Visual Bars Breakdown */}
              <div className="space-y-3">
                {timelineData.map((data, idx) => {
                  const percentage = Math.min(
                    100,
                    Math.round((data.afterTax / maxVolume) * 100)
                  );

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {data.label}
                          </span>
                          <span className="text-2xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            {data.count} صنف
                          </span>
                        </div>
                        <div className="flex items-center gap-3 font-mono font-bold">
                          <span className="text-slate-600">
                            القيمة: {formatCurrency(data.afterTax, settings.currency)}
                          </span>
                          <span className="text-emerald-700">
                            ربح: +{formatCurrency(data.profitBeforeTax, settings.currency)}
                          </span>
                        </div>
                      </div>

                      {/* Progress/Volume Bar */}
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>

                      {/* Mini summary row */}
                      <div className="flex items-center justify-between text-2xs text-slate-500 pt-1">
                        <span>
                          تكلفة رسمية: {formatCurrency(data.official, settings.currency)}
                        </span>
                        <span>
                          صافي الربح بعد الضريبة: +{formatCurrency(data.profitAfterTax, settings.currency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary of active timeline period */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
                <span>
                  إجمالي فترات المسلسل الزمني المسجلة: <strong>{timelineData.length} فترة</strong>
                </span>
                <span className="font-bold">
                  إجمالي حجم القيمة البيعية:{' '}
                  {formatCurrency(totalPriceAfterTax, settings.currency)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          DETAILED PRODUCTS PROFIT RANKING TABLE
         ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>تفاصيل أرباح الأصناف المعروضة</span>
            <span className="text-2xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
              {items.length} صنف
            </span>
          </h3>
          <span className="text-2xs text-slate-400">
            اضغط على أي صنف لعرض بطاقة تفاصيله الكاملة
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            لا توجد أصناف معروضة لعرض أرباحها.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold select-none">
                  <th className="p-3 whitespace-nowrap">المسلسل</th>
                  <th className="p-3 whitespace-nowrap">اسم الصنف</th>
                  <th className="p-3 whitespace-nowrap">القسم</th>
                  <th className="p-3 whitespace-nowrap font-mono text-left">
                    السعر الرسمي
                  </th>
                  <th className="p-3 whitespace-nowrap font-mono text-left text-emerald-700">
                    السعر بالمكسب
                  </th>
                  <th className="p-3 whitespace-nowrap font-mono text-left">
                    السعر بعد الضريبة
                  </th>
                  <th className="p-3 whitespace-nowrap font-mono text-left text-teal-700">
                    الربح قبل الضريبة
                  </th>
                  <th className="p-3 whitespace-nowrap font-mono text-left text-sky-700">
                    صافي الربح
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onViewItemDetails(item)}
                    className="hover:bg-emerald-50/30 cursor-pointer transition-colors"
                  >
                    <td className="p-3 whitespace-nowrap font-mono font-bold text-slate-600">
                      {item.serialNumber}
                    </td>
                    <td className="p-3 whitespace-nowrap font-bold text-slate-900">
                      {item.name}
                    </td>
                    <td className="p-3 whitespace-nowrap text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.category}
                      </span>
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-left font-medium text-slate-700">
                      {formatCurrency(item.officialPrice, settings.currency)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-left font-bold text-emerald-700">
                      {formatCurrency(item.priceWithProfit, settings.currency)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-left font-medium text-slate-800">
                      {formatCurrency(item.priceAfterTax, settings.currency)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-left font-bold text-teal-700">
                      +{formatCurrency(item.profitBeforeTax ?? item.profitPerPiece ?? 0, settings.currency)}
                    </td>
                    <td className="p-3 whitespace-nowrap font-mono text-left font-bold text-sky-700">
                      +{formatCurrency(item.profitAfterTax ?? item.profitBeforeTax ?? item.profitPerPiece ?? 0, settings.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
