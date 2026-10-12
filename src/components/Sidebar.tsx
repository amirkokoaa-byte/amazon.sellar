import React from 'react';
import {
  Boxes,
  Archive,
  SlidersHorizontal,
  X,
  PackagePlus,
  Coins,
  ChevronLeft,
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { ActiveTab, Item, TaxProfitSettings } from '../types';
import { formatCurrency } from '../utils/pricing';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  registryCount: number;
  archiveCount: number;
  items: Item[];
  settings: TaxProfitSettings;
  onOpenSettings: () => void;
  onOpenAddItem: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  registryCount,
  archiveCount,
  items,
  settings,
  onOpenSettings,
  onOpenAddItem,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Stats for the Profits section in sidebar
  const totalOfficialPrice = items.reduce(
    (sum, i) => sum + (i.officialPrice || 0),
    0
  );
  const totalProfitBeforeTax = items.reduce(
    (sum, i) => sum + (i.profitBeforeTax ?? i.profitPerPiece ?? 0),
    0
  );
  const totalPriceAfterTax = items.reduce(
    (sum, i) => sum + (i.priceAfterTax || 0),
    0
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 right-0 z-50 w-76 bg-white border-l border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-200 font-bold">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                سجل الأصناف والتسعير
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                لوحة التحكم الذكية
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Button */}
        <div className="p-3.5 sm:p-4 pb-2">
          <button
            onClick={() => {
              onOpenAddItem();
              onCloseMobile();
            }}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition-all hover:shadow"
          >
            <PackagePlus className="w-5 h-5" />
            <span>أضف صنف جديد</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto">
          {/* 1. سجل الأصناف */}
          <button
            onClick={() => {
              setActiveTab('registry');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'registry'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Boxes
                className={`w-5 h-5 ${
                  activeTab === 'registry' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>سجل الأصناف</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'registry'
                  ? 'bg-emerald-200/70 text-emerald-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {registryCount}
            </span>
          </button>

          {/* 2. أرشيف المنتجات */}
          <button
            onClick={() => {
              setActiveTab('archive');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'archive'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <Archive
                className={`w-5 h-5 ${
                  activeTab === 'archive' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>أرشيف المنتجات</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                activeTab === 'archive'
                  ? 'bg-emerald-200/70 text-emerald-900'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {archiveCount}
            </span>
          </button>

          {/* 3. اختيار الأرباح في القائمة الجانبية (مع التفاصيل المطلوبة بدقة) */}
          <div
            className={`rounded-2xl transition-all border ${
              activeTab === 'profits'
                ? 'bg-emerald-50/50 border-emerald-200 shadow-2xs'
                : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-50'
            }`}
          >
            {/* الأرباح Header Button */}
            <button
              onClick={() => {
                setActiveTab('profits');
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-bold text-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <TrendingUp
                  className={`w-5 h-5 ${
                    activeTab === 'profits' ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                />
                <span>الأرباح</span>
              </div>
              <span className="hidden lg:inline-flex text-2xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                تحليلات
              </span>
            </button>

            {/* تفاصيل بند الأرباح تظهر على الكمبيوتر وتُخفى على الهاتف لتخفيف القائمة */}
            <div className="hidden lg:block px-3.5 pb-3 pt-1 space-y-2 text-xs border-t border-slate-200/50">
              {/* عدد المنتجات المعروضة */}
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium">عدد المنتجات المعروضة:</span>
                <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                  {registryCount} صنف
                </span>
              </div>

              {/* أسفلها: إجمالي الأسعار الرسمية واجمالي الأرباح قبل الضريبة واجمالي الأسعار بعد الضريبة */}
              <div className="space-y-1.5 pt-1 text-2xs">
                {/* إجمالي الأسعار الرسمية */}
                <div className="flex items-center justify-between text-slate-500">
                  <span>إجمالي الأسعار الرسمية:</span>
                  <span className="font-bold font-mono text-slate-700">
                    {formatCurrency(totalOfficialPrice, settings.currency)}
                  </span>
                </div>

                {/* إجمالي الأرباح قبل الضريبة */}
                <div className="flex items-center justify-between text-teal-700 font-semibold">
                  <span>إجمالي الأرباح قبل الضريبة:</span>
                  <span className="font-bold font-mono">
                    +{formatCurrency(totalProfitBeforeTax, settings.currency)}
                  </span>
                </div>

                {/* إجمالي الأسعار بعد الضريبة */}
                <div className="flex items-center justify-between text-emerald-700 font-semibold">
                  <span>إجمالي الأسعار بعد الضريبة:</span>
                  <span className="font-bold font-mono">
                    {formatCurrency(totalPriceAfterTax, settings.currency)}
                  </span>
                </div>
              </div>

              {/* زر أظهر مسلسل زمني */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('profits');
                  onCloseMobile();
                }}
                className="w-full mt-2 py-2 px-2.5 bg-white hover:bg-emerald-600 text-slate-700 hover:text-white rounded-xl text-2xs font-bold border border-slate-200 hover:border-emerald-600 flex items-center justify-center gap-1.5 shadow-2xs transition-all group"
                title="عرض المسلسل الزمني لحجم المبيعات (يوم، أسبوع، شهر، سنة)"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                <span>أظهر مسلسل زمني (يوم/أسبوع/شهر/سنة)</span>
              </button>
            </div>
          </div>

          {/* 4. إعدادات الضريبة والربح */}
          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group"
          >
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
              <span>إعدادات الضريبة والربح</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
          </button>
        </nav>

        {/* Bottom Current Rates Box */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
          <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">النسب النشطة</span>
              <button
                onClick={onOpenSettings}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
              >
                تعديل
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block mb-0.5 text-2xs">الضريبة</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {settings.taxRate}%
                </span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block mb-0.5 text-2xs">الربح</span>
                <span className="font-bold text-emerald-700 font-mono text-sm">
                  {settings.profitRate}%
                </span>
              </div>
            </div>
            <div className="mt-1.5 text-center text-2xs text-slate-400 font-mono">
              العملة: {settings.currency}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
