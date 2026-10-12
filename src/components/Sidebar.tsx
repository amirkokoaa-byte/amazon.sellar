import React from 'react';
import {
  Boxes,
  Archive,
  SlidersHorizontal,
  X,
  PackagePlus,
  Coins,
  ChevronLeft,
  ReceiptText,
} from 'lucide-react';
import { ActiveTab, Item, TaxProfitSettings } from '../types';

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
  settings,
  onOpenSettings,
  onOpenAddItem,
  isOpenMobile,
  onCloseMobile,
}) => {
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
        className={`fixed top-0 bottom-0 right-0 z-50 w-72 bg-white border-l border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
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

        {/* Navigation Links (تم إخفاء خانة الأرباح من القائمة الجانبية كما طُلب) */}
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

          {/* 3. تسجيل فاتورة (يفتح النظام مباشرة داخل التطبيق) */}
          <button
            onClick={() => {
              setActiveTab('invoice');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'invoice'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-bold'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ReceiptText
                className={`w-5 h-5 ${
                  activeTab === 'invoice' ? 'text-emerald-600' : 'text-slate-400'
                }`}
              />
              <span>تسجيل فاتورة</span>
            </div>
            <span className="text-2xs bg-emerald-100/80 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              مباشر
            </span>
          </button>

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
