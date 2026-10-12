import { Item } from '../types';
import { calculatePrices } from './pricing';

export function getInitialItems(taxRate: number = 14, profitRate: number = 25): Item[] {
  const rawItems = [
    {
      id: 'item-1',
      serialNumber: 'SN-0001',
      category: 'ملابس',
      sku: 'CLOTH-901-XL',
      name: 'قميص أكسفورد قطن كلاسيكي',
      officialPrice: 450,
      imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
      createdAt: '2026-10-10T14:30:00.000Z',
    },
    {
      id: 'item-2',
      serialNumber: 'SN-0002',
      category: 'اكسسوارات',
      sku: 'ACC-LEATH-04',
      name: 'محفظة جلد طبيعي فاخرة',
      officialPrice: 280,
      imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&auto=format&fit=crop&q=80',
      createdAt: '2026-10-11T09:15:00.000Z',
    },
    {
      id: 'item-3',
      serialNumber: 'SN-0003',
      category: 'منزل',
      sku: 'HOME-LAMP-55',
      name: 'أباجورة مكتبية مودرن معدنية',
      officialPrice: 620,
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&auto=format&fit=crop&q=80',
      createdAt: '2026-10-11T16:45:00.000Z',
    },
    {
      id: 'item-4',
      serialNumber: 'SN-0004',
      category: 'إلكترونيات',
      sku: 'TECH-W-HEAD-8',
      name: 'سماعات بلوتوث لاسلكية عازلة للضوضاء',
      officialPrice: 1200,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80',
      createdAt: '2026-10-12T08:20:00.000Z',
    },
  ];

  return rawItems.map((item) => {
    const calc = calculatePrices(item.officialPrice, taxRate, profitRate);
    return {
      ...item,
      priceWithProfit: calc.priceWithProfit,
      priceAfterTax: calc.priceAfterTax,
      profitBeforeTax: calc.profitBeforeTax,
      profitAfterTax: calc.profitAfterTax,
      profitPerPiece: calc.profitPerPiece,
      taxAmount: calc.taxAmount,
    };
  });
}
