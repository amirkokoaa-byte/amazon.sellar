import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, CheckCircle2, Sparkles, UploadCloud, Trash2 } from 'lucide-react';
import { CATEGORIES, Item, TaxProfitSettings } from '../types';
import { calculatePrices, formatCurrency, generateNextSerialNumber } from '../utils/pricing';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
  existingItems: Item[];
  settings: TaxProfitSettings;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSaveItem,
  existingItems,
  settings,
}) => {
  // Form fields
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [officialPriceStr, setOfficialPriceStr] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Success toast notice inside modal
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const [lastSavedName, setLastSavedName] = useState('');

  // Auto-generate serial number on mount/open
  useEffect(() => {
    if (isOpen) {
      setSerialNumber(generateNextSerialNumber(existingItems));
    }
  }, [isOpen, existingItems]);

  if (!isOpen) return null;

  // Realtime calculations
  const parsedOfficialPrice = parseFloat(officialPriceStr) || 0;
  const {
    priceWithProfit,
    priceAfterTax,
    profitBeforeTax,
    profitAfterTax,
    profitPerPiece,
    taxAmount,
  } = calculatePrices(
    parsedOfficialPrice,
    settings.taxRate,
    settings.profitRate
  );

  // Quick SKU suggestion generator
  const handleAutoGenerateSku = () => {
    const catCode = category.slice(0, 3).toUpperCase();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setSku(`${catCode}-${randomSuffix}`);
  };

  // Handle image upload with compression for Firebase Realtime DB
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم الصورة كبير، يرجى اختيار صورة أقل من 2 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawBase64 = reader.result as string;
        // Compress using offscreen canvas to keep RTDB node small (~30KB)
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            setImagePreview(compressed);
          } else {
            setImagePreview(rawBase64);
          }
        };
        img.src = rawBase64;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
  };

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('يرجى كتابة اسم الصنف');
      return;
    }

    if (!officialPriceStr || isNaN(parsedOfficialPrice) || parsedOfficialPrice <= 0) {
      alert('يرجى إدخال السعر الرسمي بشكل صحيح');
      return;
    }

    const newItemData = {
      serialNumber: serialNumber.trim() || generateNextSerialNumber(existingItems),
      category,
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      officialPrice: parsedOfficialPrice,
      priceWithProfit,
      priceAfterTax,
      profitBeforeTax,
      profitAfterTax,
      profitPerPiece,
      taxAmount,
      imageUrl: imagePreview || undefined,
    };

    onSaveItem(newItemData);

    // Save feedback
    setLastSavedName(name.trim());
    setShowSuccessNotice(true);
    setTimeout(() => {
      setShowSuccessNotice(false);
    }, 4000);

    // Reset fields for the next product while keeping the modal open
    setName('');
    setSku('');
    setOfficialPriceStr('');
    setImagePreview(null);
    setCategory(CATEGORIES[0]);

    // Generate the next serial number immediately
    const tempItems = [...existingItems, { ...newItemData, id: 'temp', createdAt: '' }];
    setSerialNumber(generateNextSerialNumber(tempItems));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              تسجيل صنف جديد (سحابي)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              نسبة الربح النشطة: {settings.profitRate}% | نسبة الضريبة: {settings.taxRate}% (على السعر بالمكسب)
            </p>
          </div>
          {/* Close button strictly on top left for RTL */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            title="إغلاق الشاشة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Success notice when saving consecutively */}
          {showSuccessNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <strong>تم حفظ المنتج في السحابة بنجاح:</strong> "{lastSavedName}". تم تفريغ الحقول وإعداد المسلسل التالي مباشرة!
              </div>
            </div>
          )}

          {/* Row 1: Serial number (editable anytime) & Category */}
          {/* Row 1: رقم المسلسل يظهر بجانبه القسم في سطر واحد في نسخة الهاتف دون مسطرة تحريك */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                رقم المسلسل
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="SN-0001"
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-2.5 sm:px-3.5 py-2 text-slate-800 font-mono font-bold text-xs sm:text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                القسم <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-2.5 sm:px-3.5 py-2 text-slate-800 font-medium text-xs sm:text-sm transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: SKU & Item Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-2xs sm:text-xs font-bold text-slate-700">
                  كود المنتج (SKU)
                </label>
                <button
                  type="button"
                  onClick={handleAutoGenerateSku}
                  className="text-2xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  توليد كود
                </button>
              </div>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="مثال: CLOTH-802"
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs sm:text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                اسم الصنف <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: فستان سهرة حريري"
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm transition-all"
              />
            </div>
          </div>

          {/* Pricing Section with Realtime Calculation */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
              <span className="text-xs font-bold text-slate-800">
                التسعير واحتساب الأرباح والضريبة
              </span>
              <span className="text-2xs text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-md">
                الضريبة بعد وضع السعر بالمكسب
              </span>
            </div>

            {/* Official Price Input */}
            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                السعر الرسمي (سعر التكلفة) ({settings.currency}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={officialPriceStr}
                  onChange={(e) => setOfficialPriceStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-emerald-500/80 focus:ring-3 focus:ring-emerald-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-base sm:text-lg transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-400 font-medium">
                  {settings.currency}
                </span>
              </div>
            </div>

            {/* الخانات المحسوبة في صف واحد بجانب بعضها مع مراعاة ظهور الجمل كاملة:
                1. السعر بالمكسب
                2. السعر بعد الضريبة (14%)
                3. مكسب قبل ضريبه */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-1">
              {/* 1. السعر بالمكسب */}
              <div className="bg-emerald-50/80 p-2 sm:p-3 rounded-xl border border-emerald-200 flex flex-col justify-between text-center">
                <span className="text-[10px] sm:text-xs text-emerald-800 font-bold block leading-snug whitespace-normal break-words">
                  السعر بالمكسب
                </span>
                <span className="text-xs sm:text-base font-bold text-emerald-700 font-mono block mt-1">
                  {formatCurrency(priceWithProfit, settings.currency)}
                </span>
              </div>

              {/* 2. السعر بعد الضريبة (14%) */}
              <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between text-center">
                <span className="text-[10px] sm:text-xs text-slate-600 font-bold block leading-snug whitespace-normal break-words">
                  السعر بعد الضريبة ({settings.taxRate}%)
                </span>
                <span className="text-xs sm:text-base font-bold text-slate-800 font-mono block mt-1">
                  {formatCurrency(priceAfterTax, settings.currency)}
                </span>
              </div>

              {/* 3. مكسب قبل ضريبه */}
              <div className="bg-teal-50/80 p-2 sm:p-3 rounded-xl border border-teal-200 flex flex-col justify-between text-center">
                <span className="text-[10px] sm:text-xs text-teal-800 font-bold block leading-snug whitespace-normal break-words">
                  مكسب قبل ضريبه
                </span>
                <span className="text-xs sm:text-base font-bold text-teal-700 font-mono block mt-1">
                  +{formatCurrency(profitBeforeTax, settings.currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              صورة المنتج (تُحفظ سحابياً بتقنية Base64 خفيفة)
            </label>
            {imagePreview ? (
              <div className="relative inline-block border border-slate-200 rounded-xl p-2 bg-slate-50">
                <img
                  src={imagePreview}
                  alt="معاينة المنتج"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="absolute -top-2 -left-2 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700 transition-colors"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">
                  اضغط لرفع صورة المنتج
                </span>
                <span className="text-2xs text-slate-400 mt-0.5">
                  تُحفظ وتُزامن سحابياً مع باقي الأجهزة تلقائياً
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-2xs text-slate-400">
              * عند الضغط على حفظ، يتم حفظ الصنف سحابياً وتفريغ الخانات لتسجيل صنف تالٍ مباشرة.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
              >
                إغلاق
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold shadow-sm shadow-emerald-200 transition-all"
              >
                حفظ الصنف
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
