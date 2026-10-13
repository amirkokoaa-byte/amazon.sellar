import React, { useState, useEffect } from 'react';
import {
  X,
  Wand2,
  Download,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  isolateImageToWhiteBackground,
  IsolationResult,
  triggerDownload,
} from '../utils/backgroundIsolation';

export interface UploadedImageItem {
  id: string;
  previewUrl: string;
  file?: File;
  name?: string;
}

interface BackgroundIsolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: UploadedImageItem[];
  productName?: string;
  onApplyIsolatedImage?: (index: number, isolatedDataUrl: string) => void;
}

export const BackgroundIsolationModal: React.FC<BackgroundIsolationModalProps> = ({
  isOpen,
  onClose,
  images,
  productName = 'منتج',
  onApplyIsolatedImage,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isolatedResults, setIsolatedResults] = useState<Record<number, IsolationResult>>({});
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');
  const [viewMode, setViewMode] = useState<'isolated' | 'original' | 'split'>('isolated');
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  // When modal opens or images change, reset and isolate current image if not yet isolated
  useEffect(() => {
    if (isOpen && images.length > 0) {
      if (selectedIndex >= images.length) {
        setSelectedIndex(0);
      }
      // If selected image not yet isolated, isolate it
      if (!isolatedResults[selectedIndex] && !isProcessing) {
        handleIsolateImage(selectedIndex);
      }
    }
  }, [isOpen, selectedIndex, images.length]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[selectedIndex] || images[0];
  const currentResult = isolatedResults[selectedIndex];

  // Process isolation for an image by index
  const handleIsolateImage = async (idx: number) => {
    const target = images[idx];
    if (!target) return;

    setIsProcessing(true);
    setProgressText('جاري بدء عزل الخلفية بأحدث التقنيات...');
    try {
      const source = target.file || target.previewUrl;
      const res = await isolateImageToWhiteBackground(source, (step) => {
        setProgressText(step);
      });
      setIsolatedResults((prev) => ({
        ...prev,
        [idx]: res,
      }));
    } catch (err) {
      console.error('Failed to isolate background:', err);
      alert('حدث خطأ أثناء عزل الخلفية، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process all uploaded images (1, 2, or 3)
  const handleIsolateAll = async () => {
    setIsProcessing(true);
    for (let i = 0; i < images.length; i++) {
      if (!isolatedResults[i]) {
        setProgressText(`جاري عزل الصورة رقم ${i + 1} من ${images.length}...`);
        try {
          const source = images[i].file || images[i].previewUrl;
          const res = await isolateImageToWhiteBackground(source, (step) => {
            setProgressText(`صورة ${i + 1}: ${step}`);
          });
          setIsolatedResults((prev) => ({
            ...prev,
            [i]: res,
          }));
        } catch (e) {
          console.error(`Failed to isolate image ${i}`, e);
        }
      }
    }
    setIsProcessing(false);
  };

  // Download high-res white background image
  const handleDownloadWhiteBg = () => {
    if (!currentResult) return;
    const cleanName = (productName.trim() || 'product').replace(/\s+/g, '_');
    const filename = `${cleanName}-isolated-white-${selectedIndex + 1}.jpg`;
    triggerDownload(currentResult.whiteBgDataUrl, filename);
  };

  // Download high-res transparent PNG image
  const handleDownloadTransparent = () => {
    if (!currentResult) return;
    const cleanName = (productName.trim() || 'product').replace(/\s+/g, '_');
    const filename = `${cleanName}-isolated-transparent-${selectedIndex + 1}.png`;
    triggerDownload(currentResult.transparentDataUrl, filename);
  };

  // Apply isolated image back to AddItemModal form
  const handleApplyToProduct = () => {
    if (!currentResult || !onApplyIsolatedImage) return;
    onApplyIsolatedImage(selectedIndex, currentResult.whiteBgDataUrl);
    setAppliedIndex(selectedIndex);
    setTimeout(() => {
      setAppliedIndex(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-50/70 via-purple-50/50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
              <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-violet-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  عزل خلفية الصورة (خلفية بيضاء)
                </h3>
                <span className="text-3xs bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full border border-violet-200">
                  AI ستوديو
                </span>
              </div>
              <p className="text-3xs sm:text-2xs text-slate-500">
                عزل احترافي فائق الدقة بخلفية بيضاء ناصعة بجودة تسويقية عالية
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            title="إغلاق الشاشة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5">
          
          {/* Multiple Images Selector (If 2 or 3 images uploaded) */}
          {images.length > 1 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-3xs font-bold text-slate-600 shrink-0 ml-1">
                  الصور المرفوعة ({images.length}):
                </span>
                {images.map((img, idx) => {
                  const isDone = !!isolatedResults[idx];
                  return (
                    <button
                      key={img.id || idx}
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-2xs font-bold transition-all border ${
                        selectedIndex === idx
                          ? 'bg-violet-600 text-white border-violet-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="w-5 h-5 object-cover rounded shrink-0"
                      />
                      <span>صورة {idx + 1}</span>
                      {isDone && (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 ${
                            selectedIndex === idx ? 'text-violet-200' : 'text-emerald-500'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Isolate all button */}
              <button
                type="button"
                onClick={handleIsolateAll}
                disabled={isProcessing}
                className="text-3xs font-bold text-violet-700 hover:text-violet-900 bg-violet-100/80 hover:bg-violet-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1 shrink-0"
              >
                <Sparkles className="w-3 h-3" />
                <span>عزل الكل</span>
              </button>
            </div>
          )}

          {/* View Modes (Isolated / Original / Split) */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('isolated')}
                className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-all ${
                  viewMode === 'isolated'
                    ? 'bg-white text-violet-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                خلفية بيضاء
              </button>
              <button
                type="button"
                onClick={() => setViewMode('original')}
                className={`px-2.5 py-1 text-2xs font-bold rounded-md transition-all ${
                  viewMode === 'original'
                    ? 'bg-white text-violet-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الصورة الأصلية
              </button>
            </div>

            {currentResult && (
              <div className="flex items-center gap-1.5 text-3xs font-mono text-slate-500">
                <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  أعلى دقة: {currentResult.width}×{currentResult.height}
                </span>
              </div>
            )}
          </div>

          {/* Preview Area */}
          <div className="relative w-full aspect-square max-h-[340px] sm:max-h-[380px] mx-auto rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-white shadow-inner">
            
            {/* Loading state */}
            {isProcessing && (
              <div className="absolute inset-0 z-20 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
                <div className="relative mb-3">
                  <div className="w-12 h-12 rounded-full border-4 border-violet-200 border-t-violet-600 animate-spin" />
                  <Wand2 className="w-5 h-5 text-violet-600 absolute inset-0 m-auto" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-800 mb-1">
                  جاري عزل الخلفية بالذكاء الاصطناعي
                </p>
                <p className="text-3xs sm:text-2xs text-violet-600 font-medium animate-pulse">
                  {progressText || 'يتم تحليل وتفريغ الصورة بأحدث التقنيات...'}
                </p>
              </div>
            )}

            {/* Displaying Image */}
            {viewMode === 'isolated' ? (
              currentResult ? (
                <div className="w-full h-full flex items-center justify-center bg-white p-2">
                  <img
                    src={currentResult.whiteBgDataUrl}
                    alt="معزولة بخلفية بيضاء"
                    className="max-w-full max-h-full object-contain drop-shadow-xs"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                  <ImageIcon className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-bold">لم يتم العزل بعد</p>
                  <button
                    type="button"
                    onClick={() => handleIsolateImage(selectedIndex)}
                    className="mt-2 text-2xs bg-violet-600 hover:bg-violet-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-2xs"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>بدء العزل الآن</span>
                  </button>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 p-2">
                <img
                  src={currentImage.previewUrl}
                  alt="الصورة الأصلية"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {/* Watermark/Studio Label */}
            {viewMode === 'isolated' && currentResult && (
              <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-xs font-mono font-bold flex items-center gap-1 shadow-xs">
                <span>Studio White #FFFFFF</span>
              </div>
            )}
          </div>

          {/* Success notice after applying to product */}
          {appliedIndex === selectedIndex && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>تم اعتماد الصورة المعزولة بنجاح كصورة أساسية للمنتج في السجل!</span>
            </div>
          )}

          {/* Action and Download Buttons */}
          <div className="space-y-2 pt-1">
            {/* Primary Download Button (الطلب الأساسي: زر تحميل بأعلى جودة يمكن الوصول إليها) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadWhiteBg}
                disabled={!currentResult || isProcessing}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
                title="تحميل الصورة المعزولة بخلفية بيضاء بأعلى دقة"
              >
                <Download className="w-4 h-4" />
                <span>تحميل الصورة بأعلى جودة (خلفية بيضاء)</span>
              </button>

              {/* Apply directly to product registration form */}
              {onApplyIsolatedImage && (
                <button
                  type="button"
                  onClick={handleApplyToProduct}
                  disabled={!currentResult || isProcessing}
                  className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs flex items-center justify-center gap-2 transition-all"
                  title="اعتماد الصورة المعزولة للمنتج الحالي"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد كصورة للمنتج</span>
                </button>
              )}
            </div>

            {/* Secondary actions: Re-isolate and Transparent PNG option */}
            <div className="flex items-center justify-between gap-2 pt-1 text-2xs">
              <button
                type="button"
                onClick={() => handleIsolateImage(selectedIndex)}
                disabled={isProcessing}
                className="text-slate-600 hover:text-violet-700 font-bold flex items-center gap-1 transition-colors px-2 py-1 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة معالجة العزل</span>
              </button>

              {currentResult && (
                <button
                  type="button"
                  onClick={handleDownloadTransparent}
                  className="text-violet-700 hover:text-violet-900 font-bold flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-violet-50"
                  title="تحميل نسخة شفافة مفرغة بصيغة PNG"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>تحميل كصورة شفافة (PNG)</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-3xs text-slate-500 font-medium">
            تقنية العزل الذكي متوافقة مع متطلبات عرض المتاجر والمنصات التسويقية.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-2xs"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
