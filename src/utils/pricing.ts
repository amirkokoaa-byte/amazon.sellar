import { Item } from '../types';

export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculatePrices(
  officialPrice: number,
  taxRate: number,
  profitRate: number,
  deliveryFee: number = 0
) {
  const safeOfficial = isNaN(officialPrice) || officialPrice < 0 ? 0 : officialPrice;
  const safeTaxRate = isNaN(taxRate) ? 0 : taxRate;
  const safeProfitRate = isNaN(profitRate) ? 0 : profitRate;
  const safeDelivery = isNaN(deliveryFee) || deliveryFee < 0 ? 0 : deliveryFee;

  // 1. السعر بالمكسب (قبل الضريبة): السعر الرسمي + نسبة المكسب (دون رسوم التوصيل)
  const priceWithProfit = roundToTwo(safeOfficial * (1 + safeProfitRate / 100));

  // 2. المكسب في القطعة قبل الضريبة: السعر بالمكسب - السعر الرسمي (دون رسوم التوصيل)
  const profitBeforeTax = roundToTwo(priceWithProfit - safeOfficial);

  // 3. السعر بعد الضريبة: يُحسب على السعر بالمكسب + رسوم التوصيل لحظياً كما طُلب بالتحديد
  const priceAfterTax = roundToTwo(
    (priceWithProfit * (1 + safeTaxRate / 100)) + safeDelivery
  );

  // 4. قيمة الضريبة
  const taxAmount = roundToTwo(priceWithProfit * (safeTaxRate / 100));

  // 5. المكسب في القطعة بعد الضريبة
  const profitAfterTax = roundToTwo(profitBeforeTax * (1 - safeTaxRate / 100));

  return {
    officialPrice: safeOfficial,
    priceWithProfit,
    priceAfterTax,
    profitBeforeTax,
    profitAfterTax,
    profitPerPiece: profitBeforeTax, // للتوافق العام
    taxAmount,
    deliveryFee: safeDelivery,
  };
}

export function recalculateItems(
  items: Item[],
  taxRate: number,
  profitRate: number,
  defaultDeliveryFee: number = 0
): Item[] {
  return items.map((item) => {
    const delivery = item.deliveryFee !== undefined ? item.deliveryFee : defaultDeliveryFee;
    const calculated = calculatePrices(item.officialPrice, taxRate, profitRate, delivery);
    return {
      ...item,
      deliveryFee: delivery,
      priceWithProfit: calculated.priceWithProfit,
      priceAfterTax: calculated.priceAfterTax,
      profitBeforeTax: calculated.profitBeforeTax,
      profitAfterTax: calculated.profitAfterTax,
      profitPerPiece: calculated.profitPerPiece,
      taxAmount: calculated.taxAmount,
    };
  });
}

export function formatCurrency(amount: number, currency: string = 'ج.م'): string {
  if (isNaN(amount)) return `0.00 ${currency}`;
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

export interface FormattedDateTime {
  dayName: string;
  dateStr: string;
  numericDateStr: string;
  timeStr: string;
  fullDateArabic: string;
}

export function formatDateTime(isoString: string): FormattedDateTime {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return {
      dayName: 'غير محدد',
      dateStr: '--',
      numericDateStr: '--/--/----',
      timeStr: '--',
      fullDateArabic: '--',
    };
  }

  const daysArabic = [
    'الأحد',
    'الإثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ];

  const monthsArabic = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];

  const dayName = daysArabic[d.getDay()];
  const dateStr = `${d.getDate()} ${monthsArabic[d.getMonth()]} ${d.getFullYear()}`;
  
  // صيغة التاريخ أرقام فقط (يوم/شهر/سنة مثل 10/10/2026)
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const numericDateStr = `${day}/${month}/${year}`;

  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const timeStr = `${hours}:${minutes} ${ampm}`;

  return {
    dayName,
    dateStr,
    numericDateStr,
    timeStr,
    fullDateArabic: `${dayName}، ${dateStr} - الساعة ${timeStr}`,
  };
}

export function generateNextSerialNumber(existingItems: Item[]): string {
  let maxNum = 0;
  for (const it of existingItems) {
    if (!it.serialNumber) continue;
    const match = it.serialNumber.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `SN-${nextNum.toString().padStart(4, '0')}`;
}
