export interface Item {
  id: string;
  serialNumber: string;
  category: string;
  sku: string;
  name: string;
  officialPrice: number; // السعر الرسمي (التكلفة)
  priceWithProfit: number; // السعر بالمكسب (قبل الضريبة)
  priceAfterTax: number; // السعر بعد الضريبة (يُحسب على السعر بالمكسب)
  profitBeforeTax: number; // المكسب في القطعة قبل الضريبة
  profitAfterTax: number; // المكسب في القطعة بعد الضريبة (صافي الربح)
  profitPerPiece: number; // المكسب في القطعة (للتوافق)
  taxAmount?: number; // قيمة الضريبة
  imageUrl?: string;
  description?: string; // وصف المنتج (المولد بالذكاء الاصطناعي أو مخصص)
  deliveryFee?: number; // رسوم التوصيل
  isAvailable?: boolean; // حالة التوفر (متاح / غير متاح)
  stockQuantity?: number; // عدد القطع المتاحة عند التفعيل
  createdAt: string; // ISO date
  archivedAt?: string;
}

export interface TaxProfitSettings {
  taxRate: number; // e.g. 14 (%)
  profitRate: number; // e.g. 25 (%)
  deliveryFee?: number; // رسوم التوصيل الافتراضية
  siteTitle?: string; // عنوان الموقع بالأعلى (سجل الأصناف ج.م)
  currency: string; // e.g. "ج.م"
}

export type ActiveTab = 'registry' | 'archive' | 'invoice' | 'profits';

export const CATEGORIES = [
  'ملابس',
  'اكسسوارات',
  'منزل',
  'إلكترونيات',
  'مستحضرات تجميل',
  'أحذية وحقائب',
  'أخرى',
] as const;

export type CategoryType = (typeof CATEGORIES)[number];
