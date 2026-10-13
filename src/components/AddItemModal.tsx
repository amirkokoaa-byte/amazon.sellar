import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, Sparkles, UploadCloud, Trash2, Loader2 } from 'lucide-react';
import { CATEGORIES, Item, TaxProfitSettings } from '../types';
import { calculatePrices, formatCurrency, generateNextSerialNumber } from '../utils/pricing';
import { uploadProductImage } from '../utils/imageUpload';
import { AiDescriptionModal } from './AiDescriptionModal';

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
  const [deliveryFeeStr, setDeliveryFeeStr] = useState<string>(
    settings.deliveryFee ? settings.deliveryFee.toString() : ''
  );
  const [description, setDescription] = useState<string>('');
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  
  // File and preview states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Success toast notice inside modal
  const [showSuccessNotice, setShowSuccessNotice] = useState(false);
  const [lastSavedName, setLastSavedName] = useState('');

  // نموذج كود SKU التلقائي المحدث لحظياً
  const categoryPrefixMap: Record<string, string> = {
    ملابس: 'CLOTH',
    اكسسوارات: 'ACC',
    منزل: 'HOME',
    إلكترونيات: 'ELEC',
    'مستحضرات تجميل': 'BEAUTY',
    'أحذية وحقائب': 'BAGS',
    أخرى: 'GEN',
  };

  const getAutoSkuModel = (cat: string, ser: string) => {
    const prefix = categoryPrefixMap[cat] || 'PRD';
    const num = ser.replace(/\D/g, '') || (existingItems.length + 1).toString();
    const padNum = num.padStart(3, '0');
    return `${prefix}-${padNum}`;
  };

  // Auto-generate serial number & SKU only on opening the modal (لا يتم تصفيره أثناء الكتابة)
  const prevIsOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const nextSerial = generateNextSerialNumber(existingItems);
      setSerialNumber(nextSerial);
      setDeliveryFeeStr(settings.deliveryFee ? settings.deliveryFee.toString() : '');
      const autoSku = getAutoSkuModel(category, nextSerial);
      setSku(autoSku);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  // Realtime calculations
  const parsedOfficialPrice = parseFloat(officialPriceStr) || 0;
  const parsedDeliveryFee = parseFloat(deliveryFeeStr) || 0;
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
    settings.profitRate,
    parsedDeliveryFee
  );

  // Quick SKU suggestion generator - عند الضغط على تحديث يتم تحديثه تلقائياً
  const handleAutoGenerateSku = () => {
    const autoSku = getAutoSkuModel(category, serialNumber);
    if (sku === autoSku) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setSku(`${autoSku}-${randomSuffix}`);
    } else {
      setSku(autoSku);
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً، يرجى اختيار صورة أصغر من 20 ميجابايت.');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

    if (!name.trim()) {
      alert('يرجى كتابة اسم الصنف');
      return;
    }

    if (!officialPriceStr || isNaN(parsedOfficialPrice) || parsedOfficialPrice <= 0) {
      alert('يرجى إدخال السعر الرسمي بشكل صحيح');
      return;
    }

    let finalImageUrl: string | undefined = undefined;

    // رفع الصورة إلى Firebase Storage بعد الضغط
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

    const newItemData = {
      serialNumber: serialNumber.trim() || generateNextSerialNumber(existingItems),
      category,
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      officialPrice: parsedOfficialPrice,
      deliveryFee: parsedDeliveryFee,
      isAvailable: true,
      priceWithProfit,
      priceAfterTax,
      profitBeforeTax,
      profitAfterTax,
      profitPerPiece,
      taxAmount,
      imageUrl: finalImageUrl,
      description: description.trim() || undefined,
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
    setDescription('');
    setOfficialPriceStr('');
    setDeliveryFeeStr(settings.deliveryFee ? settings.deliveryFee.toString() : '');
    setSelectedFile(null);
    setImagePreview(null);
    setCategory(CATEGORIES[0]);

    // Generate the next serial number immediately
    const tempItems = [...existingItems, { ...newItemData, id: 'temp', createdAt: '' }];
    const nextSer = generateNextSerialNumber(tempItems);
    setSerialNumber(nextSer);
    setSku(getAutoSkuModel(CATEGORIES[0], nextSer));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Success notice when saving consecutively */}
          {showSuccessNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <strong>تم حفظ المنتج في السحابة بنجاح:</strong> "{lastSavedName}". تم تفريغ الحقول وإعداد المسلسل التالي مباشرة!
              </div>
            </div>
          )}

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
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-3xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold"
                    title="نموذج كود SKU التلقائي"
                  >
                    نموذج: {getAutoSkuModel(category, serialNumber)}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSku}
                    className="text-2xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                    title="توليد كود SKU جديد"
                  >
                    <Sparkles className="w-3 h-3" />
                    تحديث
                  </button>
                </div>
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

            {/* صف واحد: السعر الرسمي بجانبه رسوم التوصيل على الهاتف والكمبيوتر */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div>
                <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                  السعر الرسمي <span className="text-rose-500">*</span>
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
                    className="w-full bg-white border border-emerald-500/80 focus:ring-3 focus:ring-emerald-200 rounded-xl px-2.5 sm:px-3.5 py-2 text-slate-900 font-mono font-bold text-sm sm:text-lg transition-all"
                  />
                  <span className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-2xs sm:text-sm text-slate-400 font-medium">
                    {settings.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-2xs sm:text-xs font-bold text-slate-700 mb-1">
                  رسوم التوصيل
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={deliveryFeeStr}
                    onChange={(e) => setDeliveryFeeStr(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl px-2.5 sm:px-3.5 py-2 text-slate-900 font-mono font-bold text-sm sm:text-lg transition-all"
                  />
                  <span className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-2xs sm:text-sm text-slate-400 font-medium">
                    {settings.currency}
                  </span>
                </div>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-2xs sm:text-xs font-bold text-slate-700">
                صورة المنتج
              </label>
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
                  onClick={handleClearImage}
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
                  اضغط لاختيار صورة المنتج
                </span>
                <span className="text-3xs sm:text-2xs text-slate-400 mt-0.5 text-center">
                  اختر صورة واضحة للمنتج لتظهر في السجل والتسويق
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}

            {/* زر أنشئ وصف للمنتج بالذكاء الاصطناعي أسفل اختيار صورة المنتج */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(true)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-200 flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 animate-pulse text-amber-200" />
                <span>أنشئ وصف للمنتج بالذكاء الاصطناعي</span>
              </button>

              {/* معاينة سريعة للوصف المحفوظ إن وجد */}
              {description && (
                <div className="mt-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start justify-between gap-2">
                  <div className="text-2xs text-emerald-900 leading-relaxed line-clamp-2">
                    <span className="font-bold block mb-0.5 text-emerald-800">الوصف المحفوظ:</span>
                    {description}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(true)}
                    className="text-2xs font-bold text-emerald-700 hover:underline shrink-0"
                  >
                    تعديل
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-2xs text-slate-400">
              * عند الضغط على حفظ، يتم رفع الصورة وحفظ الصنف وتفريغ الخانات لتسجيل صنف تالٍ مباشرة.
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
              >
                إغلاق
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-emerald-400 text-white font-bold shadow-sm shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الرفع والحفظ...</span>
                  </>
                ) : (
                  <span>حفظ الصنف</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* شاشة إنشاء وصف للمنتج بالذكاء الاصطناعي المنبثقة */}
      <AiDescriptionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        productName={name}
        productImage={imagePreview}
        category={category}
        officialPrice={parsedOfficialPrice}
        priceAfterTax={priceAfterTax}
        currency={settings.currency}
        initialDescription={description}
        onSaveDescription={(newDesc) => {
          setDescription(newDesc);
        }}
      />
    </div>
  );
};
