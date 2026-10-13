import React, { useState, useEffect } from 'react';
import { X, Percent, TrendingUp, Check } from 'lucide-react';
import { TaxProfitSettings } from '../types';
import { calculatePrices, formatCurrency } from '../utils/pricing';

interface TaxProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TaxProfitSettings;
  onSaveSettings: (newSettings: TaxProfitSettings) => void;
}

export const TaxProfitModal: React.FC<TaxProfitModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [taxRate, setTaxRate] = useState<number>(settings.taxRate);
  const [profitRate, setProfitRate] = useState<number>(settings.profitRate);
  const [deliveryFee, setDeliveryFee] = useState<number>(settings.deliveryFee || 0);
  const [siteTitle, setSiteTitle] = useState<string>(settings.siteTitle || 'سجل الأصناف');
  const [currency, setCurrency] = useState<string>(settings.currency);

  useEffect(() => {
    if (isOpen) {
      setTaxRate(settings.taxRate);
      setProfitRate(settings.profitRate);
      setDeliveryFee(settings.deliveryFee || 0);
      setSiteTitle(settings.siteTitle || 'سجل الأصناف');
      setCurrency(settings.currency);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taxRate < 0 || profitRate < 0 || deliveryFee < 0) {
      alert('لا يمكن إدخال نسب أو رسوم سالبة');
      return;
    }
    onSaveSettings({
      taxRate: Number(taxRate),
      profitRate: Number(profitRate),
      deliveryFee: Number(deliveryFee),
      siteTitle: siteTitle.trim() || 'سجل الأصناف',
      currency: currency.trim() || 'ج.م',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              إعدادات الضريبة والربح (السحابية)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تحديث النسب سيُعيد احتساب الأسعار فورياً عبر Firebase لجميع الأجهزة
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            title="إغلاق الشاشة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="space-y-3.5">
            {/* Profit Rate Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نسبة الربح المستهدفة (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="500"
                  required
                  value={profitRate}
                  onChange={(e) => setProfitRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono font-bold text-base transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                  %
                </span>
              </div>
              <span className="text-2xs text-slate-400 mt-1 block">
                تُضاف على السعر الرسمي لتحديد السعر بالمكسب قبل الضريبة
              </span>
            </div>

            {/* Tax Rate Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                نسبة الضريبة المضافة (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono font-bold text-base transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                  %
                </span>
              </div>
              <span className="text-2xs text-slate-400 mt-1 block">
                تُحسب على السعر بعد وضع السعر بالمكسب لمعرفة صافي الربح
              </span>
            </div>

            {/* Delivery Fee Field (رسوم التوصيل) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رسوم التوصيل ({currency})
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-2.5 text-slate-900 font-mono font-bold text-base transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                  {currency}
                </span>
              </div>
              <span className="text-2xs text-slate-400 mt-1 block">
                تُضاف لحظياً إلى السعر بعد الضريبة (14%) دون التأثير على السعر بالمكسب أو مكسب القطعة
              </span>
            </div>

            {/* Website Title Field (تغيير عنوان الموقع بالأعلى) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                عنوان الموقع بالأعلى <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                placeholder="سجل الأصناف"
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold text-sm transition-all"
              />
              <span className="text-2xs text-slate-400 mt-1 block">
                العنوان الذي يظهر في شريط الهيدر أعلى الصفحة الرئيسية (بجانب العملة {currency})
              </span>
            </div>

            {/* Currency Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رمز العملة
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="ج.م"
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-4 py-2.5 text-slate-800 font-bold transition-all"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold shadow-sm shadow-emerald-200 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتحديث سحابي</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
