import React, { useState } from 'react';
import { ReceiptText, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';

export const InvoiceView: React.FC = () => {
  const [iframeKey, setIframeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const handleRefresh = () => {
    setIsLoading(true);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-3 flex flex-col h-full">
      {/* Top Header Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-2xs shrink-0">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>تسجيل فاتورة</span>
              <span className="text-3xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>مدمج داخل النظام</span>
              </span>
            </h2>
            <p className="text-2xs sm:text-xs text-slate-500">
              تسجيل وإصدار الفواتير مباشرة من خلال النظام دون مغادرة الصفحة
            </p>
          </div>
        </div>

        {/* Quick action: Refresh frame */}
        <button
          onClick={handleRefresh}
          className="p-2 sm:px-3 sm:py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors shadow-2xs"
          title="تحديث صفحة الفواتير"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">إعادة تحميل</span>
        </button>
      </div>

      {/* Embedded Iframe Container */}
      <div className="relative flex-1 min-h-[75vh] h-[calc(100vh-210px)] bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-2xs z-10 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              جارٍ تحميل نظام تسجيل الفواتير...
            </p>
          </div>
        )}

        <iframe
          key={iframeKey}
          src="https://mr-mrs-fashion.vercel.app/"
          title="تسجيل فاتورة"
          className="w-full h-full border-0"
          onLoad={() => setIsLoading(false)}
          allow="clipboard-read; clipboard-write; camera;"
        />
      </div>
    </div>
  );
};
