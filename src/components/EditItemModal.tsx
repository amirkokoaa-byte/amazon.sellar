import React, { useState, useEffect } from 'react';
import { X, UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { CATEGORIES, Item, TaxProfitSettings } from '../types';
import { calculatePrices, formatCurrency } from '../utils/pricing';
import { uploadProductImage } from '../utils/imageUpload';

interface EditItemModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onUpdateItem: (updated: Item) => void;
  settings: TaxProfitSettings;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  item,
  onClose,
  onUpdateItem,
  settings,
}) => {
  const [serialNumber, setSerialNumber] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [officialPriceStr, setOfficialPriceStr] = useState<string>('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setSerialNumber(item.serialNumber || '');
      setCategory(item.category);
      setSku(item.sku);
      setName(item.name);
      setOfficialPriceStr(item.officialPrice.toString());
      setImagePreview(item.imageUrl || null);
      setSelectedFile(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 20 ميجابايت.');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    if (!name.trim()) {
      alert('يرجى كتابة اسم الصنف');
      return;
    }
    if (isNaN(parsedOfficialPrice) || parsedOfficialPrice <= 0) {
      alert('يرجى إدخال السعر الرسمي بشكل صحيح');
      return;
    }

    let finalImageUrl = imagePreview || undefined;

    // رفع الصورة الجديدة إلى Firebase Storage إذا تم اختيار ملف جديد
    if (selectedFile) {
      setIsUploading(true);
      try {
        finalImageUrl = await uploadProductImage(selectedFile);
      } catch (err) {
        console.error('Error uploading image to Firebase Storage:', err);
        alert('حدث خطأ أثناء رفع الصورة إلى Firebase Storage. يرجى التحقق من الاتصال.');
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onUpdateItem({
      ...item,
      serialNumber: serialNumber.trim() || item.serialNumber,
      category,
      sku: sku.trim() || item.sku,
      name: name.trim(),
      officialPrice: parsedOfficialPrice,
      priceWithProfit,
      priceAfterTax,
      profitBeforeTax,
      profitAfterTax,
      profitPerPiece,
      taxAmount,
      imageUrl: finalImageUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              تعديل بيانات الصنف ({item.serialNumber})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              تحديث الأسعار والمعلومات ومزامنتها سحابياً
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                رقم المسلسل
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-2.5 sm:px-3.5 py-2 text-slate-800 font-mono font-bold text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                القسم
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-2.5 sm:px-3.5 py-2 text-slate-800 font-medium text-xs sm:text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                كود المنتج (SKU)
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-slate-800 font-mono text-xs sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                اسم الصنف
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-3 py-2 text-slate-800 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
            <div>
              <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                السعر الرسمي ({settings.currency})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={officialPriceStr}
                onChange={(e) => setOfficialPriceStr(e.target.value)}
                className="w-full bg-white border border-emerald-500/80 focus:ring-3 focus:ring-emerald-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono font-bold text-base sm:text-lg"
              />
            </div>

            {/* الخانات المحسوبة في صف واحد بجانب بعضها:
                1. السعر بالمكسب
                2. السعر بعد الضريبة (14%)
                3. مكسب قبل ضريبه */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-1">
              <div className="bg-emerald-50/80 p-2 sm:p-3 rounded-xl border border-emerald-200 flex flex-col justify-between text-center">
                <span className="text-[10px] sm:text-xs text-emerald-800 font-bold block leading-snug whitespace-normal break-words">
                  السعر بالمكسب
                </span>
                <span className="text-xs sm:text-base font-bold text-emerald-700 font-mono block mt-1">
                  {formatCurrency(priceWithProfit, settings.currency)}
                </span>
              </div>

              <div className="bg-white p-2 sm:p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between text-center">
                <span className="text-[10px] sm:text-xs text-slate-600 font-bold block leading-snug whitespace-normal break-words">
                  السعر بعد الضريبة ({settings.taxRate}%)
                </span>
                <span className="text-xs sm:text-base font-bold text-slate-800 font-mono block mt-1">
                  {formatCurrency(priceAfterTax, settings.currency)}
                </span>
              </div>

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

          {/* Image */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-2xs sm:text-xs font-bold text-slate-700">
                صورة المنتج (Firebase Storage)
              </label>
              <span className="text-3xs text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full font-semibold">
                ضغط تلقائي &lt; 300KB
              </span>
            </div>
            {imagePreview ? (
              <div className="relative inline-block border border-slate-200 rounded-xl p-2 bg-slate-50">
                <img
                  src={imagePreview}
                  alt="معاينة المنتج"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedFile(null);
                  }}
                  className="absolute -top-2 -left-2 bg-rose-600 text-white rounded-full p-1 shadow hover:bg-rose-700 transition-colors"
                  title="حذف الصورة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all">
                <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 mb-1.5" />
                <span className="text-xs font-bold text-slate-700">
                  اضغط لرفع صورة جديدة
                </span>
                <span className="text-3xs sm:text-2xs text-slate-400 mt-0.5 text-center">
                  تُرفع إلى مجلد /products_images ويُحفظ رابط URL فقط
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

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold shadow-sm shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جارٍ الرفع والتحديث...</span>
                </>
              ) : (
                <span>حفظ التعديلات في السحابة</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
