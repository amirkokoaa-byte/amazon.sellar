import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Share2,
  Tag,
  ShoppingBag,
  Sliders,
  Send,
  Save,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export type ToneType = 'formal' | 'friendly' | 'engaging';
export type PlatformType = 'facebook' | 'instagram' | 'amazon' | 'general';

interface AiDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productImage: string | null;
  category: string;
  officialPrice?: number;
  priceAfterTax?: number;
  currency?: string;
  initialDescription?: string;
  onSaveDescription: (description: string) => void;
}

export const AiDescriptionModal: React.FC<AiDescriptionModalProps> = ({
  isOpen,
  onClose,
  productName,
  productImage,
  category,
  officialPrice = 0,
  priceAfterTax = 0,
  currency = 'ج.م',
  initialDescription = '',
  onSaveDescription,
}) => {
  const [tone, setTone] = useState<ToneType>('engaging');
  const [platform, setPlatform] = useState<PlatformType>('facebook');
  const [description, setDescription] = useState<string>(initialDescription || '');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [variantIndex, setVariantIndex] = useState<number>(0);

  // Generate templates based on tone, platform, and product details
  const generateDynamicDescription = (
    currentTone: ToneType,
    currentPlatform: PlatformType,
    index: number
  ) => {
    const pName = productName.trim() || 'المنتج المميز';
    const priceText = priceAfterTax > 0 ? `${priceAfterTax} ${currency}` : '';

    if (currentTone === 'formal') {
      // 1. طريقة رسمية: مواصفات دقيقة وجودة عالية ومناسبة لأمازون والمتاجر الرسمية
      const formalTemplates = [
        `✨ مواصفات المنتج الرسمية: ${pName}

• التصنيف: ${category}
• الجودة: مصنع من خامات فائقة الجودة لضمان أعلى مستويات المتانة والأناقة.
• السعر المعتمد: ${priceText ? `${priceText} (شامل الضريبة)` : 'سعر تنافسي للغاية'}.
• المزايا الأساسية:
  - تصميم عصري يلبي احتياجات الاستخدام اليومي والعملي.
  - تشطيب ممتاز يعكس أعلى معايير الحرفية والاهتمام بالتفاصيل.
  - مناسب للاقتناء الشخصي أو تقديمه كهدية قيمة.

📦 متوفر للشحن السريع مع ضمان المعاينة عند الاستلام.
لطلب المنتج، يُرجى التواصل معنا مباشرة أو إتمام الطلب عبر المتجر.`,

        `📋 تقرير وبيانات الصنف: ${pName}

نقدم لكم صنف "${pName}" المصمم خصيصاً ليجمع بين الكفاءة العالية والمظهر الراقي ضمن قسم (${category}).

المواصفات الفنية:
1. الجودة والمتانة: مواد منتقاة بعناية لمقاومة الاستخدام المتكرر.
2. القيمة السعرية: ${priceText || 'أفضل سعر مقابل القيمة'}.
3. ملائمة الاستخدام: صُمم ليوفر أقصى درجات الراحة والعملية.

متاح الآن للطلب الفوري مع خيارات توصيل آمنة وتغليف محكم يحافظ على سلامة المنتج.`,

        `⭐️ الإصدار الفاخر: ${pName}

صُمم صنف "${pName}" ليلبي تطلعات الباحثين عن التميز والاعتمادية في فئة ${category}.

أبرز المواصفات:
• خامات معتمدة ومطابقة لأعلى المواصفات القياسية.
• السعر الحالي: ${priceText || 'عرض خاص'}.
• ضمان الجودة وسهولة الاستخدام.
• خدمة عملاء ومتابعة مستمرة بعد البيع.

اطلبه الآن وتمتع بتجربة شراء احترافية وموثوقة.`
      ];
      return formalTemplates[index % formalTemplates.length];
    } else if (currentTone === 'friendly') {
      // 2. طريقة فريندلي: ودودة ومبهجة ومناسبة لإنستجرام وتيك توك
      const friendlyTemplates = [
        `من أجمل القطع اللي هتحبها وتعتمد عليها كل يوم! 😍❤️

صنفنا الجديد والحصري: "${pName}" في قسم (${category}) 🔥
لو بتدور على حاجة شياكة، عملية، وتعيش معاك وتفرق في يومك.. القطعة دي اتعملت مخصوص علشانك! ✨

إيه اللي بيميزه؟
🥰 شكل تحفة وخامة هتحس بفرقها من أول لمسة.
👌 سعره خيالي: ${priceText ? `فقط ${priceText} بعد الضريبة!` : 'أحسن سعر في السوق!'}
🎁 ينفعك جداً أو تقدمه لأغلى الناس عندك كهدية تفرحهم.

اطلب نسختك دلوقتي قبل نفاذ الكمية، وخلي يومك أجمل! 💬 ابعتلنا رسالة في الخاص للتفاصيل والشحن السريع.
#عروض #شياكة #${category.replace(/\s+/g, '_')} #فاشون #موضة`,

        `لقينا لك الحل الأمثل والقطعة اللي كانت ناقصاك! 🥰💫

مع صنف "${pName}" هتستمتع بأفضل تجربة في (${category}) بدون أي مجهود!
خامة مريحة، شكل جذاب، وسعر على قد الإيد: ${priceText || 'سعر لا يُقاوم'} 🌟

مين مستني يجربها؟
اطلبها حالا ومتقلقش، المعاينة حقك قبل الاستلام! 🚚💨
اكتبلنا تم في الكومنتات وهنرد عليك فوراً بكل التفاصيل! ✨`,

        `سر الأناقة والراحة في قطعة واحدة! 🥳💖

الجمال دا كله في صنف "${pName}" الجديد كلياً من قسم ${category}!
مش بس شكله يجنن، كمان خامته عملية جداً وسعره: ${priceText || 'عرض مميز جداً'} 🎉

جاهز تدلع نفسك؟ اطلبه دلوقتي وابعتلنا على الرسايل! 💌`
      ];
      return friendlyTemplates[index % friendlyTemplates.length];
    } else {
      // 3. طريقة تجذب العملاء: تسويقية قوية تحفز الشراء الفوري وإعلانات الفيسبوك
      const engagingTemplates = [
        `🔥 عرض حصري ولفترة محدودة جداً! 🔥

هل تبحث عن الأفضل دائماً؟ إليك صنف "${pName}" في تشكيلة (${category}) الأكثر طلباً ومبيعاً! 🚀

لماذا يختاره الجميع؟
✅ جودة استثنائية وخامات ممتازة تدوم طويلاً.
✅ سعر مغري جداً: ${priceText ? `فقط ${priceText} (شامل الضريبة)` : 'لفترة محدودة'}!
✅ تقييمات إيجابية 100% ورضا تام من جميع العملاء.
✅ ضمان استبدال ومعاينة كاملة عند الاستلام لراحتك.

⚡️ الكميات محدودة والطلب مرتفع جداً!
اضغط على الرابط أو راسلنا عبر الرسائل الآن لحجز نسختك قبل انتهاء العرض! 🛒👇
#عرض_خاص #أفضل_سعر #${category.replace(/\s+/g, '_')} #تسوق_أونلاين`,

        `💥 فرصة لا تتكرر! احصل على "${pName}" بأقوى سعر في السوق! 💥

وفر وقتك وفلوسك مع أفضل اختيار في قسم (${category}) ✨
تم تصميم "${pName}" ليمنحك الأناقة والراحة القصوى بدون أي تنازل عن الجودة.

🌟 العرض متاح الآن بسعر استثنائي: ${priceText ? `${priceText} فقط!` : 'سعر ترويجي خاص!'}
🚚 شحن وتوصيل فوري حتى باب منزلك مع إمكانية الدفع عند الاستلام.

لا تنتظر طويلاً.. سارع بالطلب الآن والكميات محدودة للغاية! ⏳🏃‍♂️`,

        `🚀 الأكثر مبيعاً لهذا الموسم: "${pName}"! 🌟

إذا كنت تبحث عن الفخامة والعملية معاً، فالإجابة هي "${pName}" من فئة (${category})!
تصميم مبتكر يواكب أحدث الصيحات العالمية وبسعر خاص جداً: ${priceText || 'عرض مميز اليوم'}.

✔️ خامة أصلية ومضمونة.
✔️ تغليف أنيق وجاهز للإهداء.
✔️ شحن سريع لجميع المحافظات.

احجز طلبك الآن عبر إرسال رسالة للصفحة أو الواتساب، العرض ينتهي قريباً! 📲✨`
      ];
      return engagingTemplates[index % engagingTemplates.length];
    }
  };

  // Generate with real Gemini if apiKey exists, else fallback to templates
  const handleGenerate = async (targetTone: ToneType, targetPlatform: PlatformType, newIndex: number) => {
    setIsGenerating(true);
    setCopied(false);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const toneDescriptions = {
          formal: 'طريقة رسمية احترافية، مناسبة لأمازون والمتاجر الرسمية، تركز على المواصفات الدقيقة والجودة العالية والضمانات.',
          friendly: 'طريقة ودودة ولطيفة (Friendly)، مناسبة لإنستجرام وتيك توك، استخدام إيموجيز بشكل جميل، نبرة مبهجة وقريبة من القلب.',
          engaging: 'طريقة تسويقية قوية وجذابة (Engaging Copywriting)، تخلق رغبة ملحة للشراء وتبرز العرض الحصري مع دعوة واضحة لاتخاذ إجراء (Call to Action).'
        };

        const prompt = `أنت خبير تسويق إلكتروني ومحترف كتابة إعلانات لمنتجات التجارة الإلكترونية باللغة العربية.
المطلوب: كتابة وصف ترويجي وإعلاني جذاب ومكتمل لمنتج تجاري.
بيانات المنتج:
- اسم المنتج: ${productName || 'منتج مميز'}
- القسم: ${category}
- السعر الرسمي والتكلفة: ${officialPrice} ${currency}
- السعر بعد الضريبة للعميل: ${priceAfterTax > 0 ? `${priceAfterTax} ${currency}` : 'سعر منافس'}
- النبرة المطلوبة: ${toneDescriptions[targetTone]}
- المنصة المستهدفة: ${targetPlatform}
- رقم النموذج المطلوب: نموذج رقم ${newIndex + 1} (اجعله فريداً ومختلفاً في الصياغة عن النماذج السابقة).

الشروط:
1. الوصف يجب أن يكون جاهزاً للنشر فوراً على الفيس بوك أو الإنستجرام أو أمازون.
2. يتضمن عنواناً جذاباً، أهم المميزات، السعر، ودعوة للطلب والشحن.
3. التنسيق بالنقاط والإيموجيز المناسبة.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text && response.text.trim()) {
          setDescription(response.text.trim());
          setIsGenerating(false);
          return;
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to smart dynamic generator:', err);
      }
    }

    // Dynamic generator fallback
    const generated = generateDynamicDescription(targetTone, targetPlatform, newIndex);
    setDescription(generated);
    setIsGenerating(false);
  };

  // Initial generation on open if empty
  useEffect(() => {
    if (isOpen) {
      if (!description) {
        handleGenerate(tone, platform, 0);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToneChange = (newTone: ToneType) => {
    setTone(newTone);
    setVariantIndex(0);
    handleGenerate(newTone, platform, 0);
  };

  const handleRequestAnotherModel = () => {
    const nextIndex = variantIndex + 1;
    setVariantIndex(nextIndex);
    handleGenerate(tone, platform, nextIndex);
  };

  const handleCopy = async () => {
    if (!description) return;
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert('تم تحديد النص، يرجى الضغط على نسخ يدوياً.');
    }
  };

  const handleSave = () => {
    onSaveDescription(description);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-70 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto">
        {/* Modal Top Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                إنشاء وصف للمنتج بالذكاء الاصطناعي
              </h3>
              <p className="text-2xs text-slate-500 hidden sm:block">
                نماذج إعلانية احترافية جاهزة للنشر على فيسبوك، إنستجرام، وأمازون
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 overflow-x-hidden">
          {/* اختيار النبرة في صف واحد سطر واحد بحجم مناسب للهاتف */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                <span>اختر أسلوب كتابة الوصف:</span>
              </label>
              <span className="text-3xs text-slate-400">
                نموذج رقم #{variantIndex + 1}
              </span>
            </div>

            {/* الاختيارات جميعها في صف واحد سطر واحد مع تصغير الحجم لتناسب الهاتف دون اختفاء أي كلمة */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => handleToneChange('engaging')}
                className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl border text-[10.5px] xs:text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden ${
                  tone === 'engaging'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>🔥</span>
                <span>طريقة تجذب العملاء</span>
              </button>

              <button
                type="button"
                onClick={() => handleToneChange('friendly')}
                className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl border text-[10.5px] xs:text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden ${
                  tone === 'friendly'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>😊</span>
                <span>طريقة فريندلي</span>
              </button>

              <button
                type="button"
                onClick={() => handleToneChange('formal')}
                className={`py-1.5 sm:py-2 px-1 sm:px-2 rounded-xl border text-[10.5px] xs:text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden ${
                  tone === 'formal'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>📋</span>
                <span>طريقة رسمية</span>
              </button>
            </div>
          </div>

          {/* خانة الوصف المقترح */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                <span>الوصف المقترح:</span>
              </label>

              {/* أزرار العمليات السريعة (نموذج آخر + نسخ) */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleRequestAnotherModel}
                  disabled={isGenerating}
                  className="px-2.5 py-1 text-2xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="توليد صياغة أخرى جديدة"
                >
                  <RefreshCw className={`w-3 h-3 text-emerald-600 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>نموذج آخر</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-2.5 py-1 text-2xs font-bold rounded-lg flex items-center gap-1 transition-all ${
                    copied
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title="نسخ إلى الحافظة"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>نسخ</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* صندوق النص يظهر مباشرة في الشاشة دون الحاجة لتحريك لأعلى أو لأسفل ودون تحريك يمين أو يسار */}
            <div className="relative">
              <textarea
                rows={7}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="سيظهر هنا الوصف المولد بالذكاء الاصطناعي تلقائياً..."
                className="w-full h-44 sm:h-52 bg-slate-50/80 border border-slate-300 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl p-3 text-slate-900 text-xs sm:text-sm font-sans leading-relaxed transition-all resize-none overflow-y-auto overflow-x-hidden"
              />
              {isGenerating && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-700">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>جارٍ إنشاء النموذج الذكي...</span>
                </div>
              )}
            </div>

            <p className="text-3xs text-slate-500">
              * يمكنك التعديل المباشر على النص في أي وقت، والضغط على "نموذج آخر" للحصول على أفكار إعلانية إضافية.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-4 sm:px-5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm shadow-emerald-200 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ الوصف</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
