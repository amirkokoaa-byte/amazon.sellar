import * as XLSX from 'xlsx';
import { Item, TaxProfitSettings } from '../types';
import { formatCurrency, formatDateTime } from './pricing';

export function exportToExcel(
  items: Item[],
  fileName: string = 'سجل_الأصناف_والتسعير'
) {
  if (!items || items.length === 0) {
    alert('لا توجد عناصر محددة للتصدير.');
    return;
  }

  const exportData = items.map((item, index) => {
    const dt = formatDateTime(item.createdAt);
    const profitBefore = item.profitBeforeTax ?? item.profitPerPiece ?? 0;
    const profitAfter = item.profitAfterTax ?? profitBefore;
    return {
      'م': index + 1,
      'رقم المسلسل': item.serialNumber,
      'كود الصنف (SKU)': item.sku,
      'اسم الصنف': item.name,
      'القسم': item.category,
      'السعر الرسمي': item.officialPrice,
      'السعر بالمكسب (قبل الضريبة)': item.priceWithProfit,
      'السعر بعد الضريبة': item.priceAfterTax,
      'المكسب قبل الضريبة': profitBefore,
      'صافي المكسب بعد الضريبة': profitAfter,
      'تاريخ التسجيل': `${dt.dayName} ${dt.dateStr} - ${dt.timeStr}`,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set RTL direction for the worksheet
  if (!worksheet['!views']) {
    worksheet['!views'] = [{ rightToLeft: true }];
  }

  // Adjust column widths
  worksheet['!cols'] = [
    { wch: 5 },  // م
    { wch: 14 }, // المسلسل
    { wch: 16 }, // SKU
    { wch: 25 }, // اسم الصنف
    { wch: 14 }, // القسم
    { wch: 14 }, // السعر الرسمي
    { wch: 22 }, // السعر بالمكسب
    { wch: 18 }, // السعر بعد الضريبة
    { wch: 18 }, // المكسب قبل الضريبة
    { wch: 22 }, // صافي المكسب بعد الضريبة
    { wch: 28 }, // التاريخ
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الأصناف');

  const cleanName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(workbook, cleanName);
}

export function exportToPDF(
  items: Item[],
  title: string = 'تقرير سجل الأصناف والأسعار',
  settings: TaxProfitSettings
) {
  if (!items || items.length === 0) {
    alert('لا توجد عناصر محددة للتصدير.');
    return;
  }

  const nowDt = formatDateTime(new Date().toISOString());

  const totalOfficial = items.reduce((acc, i) => acc + i.officialPrice, 0);
  const totalPriceWithProfit = items.reduce((acc, i) => acc + i.priceWithProfit, 0);
  const totalProfitBefore = items.reduce(
    (acc, i) => acc + (i.profitBeforeTax ?? i.profitPerPiece ?? 0),
    0
  );
  const totalProfitAfter = items.reduce(
    (acc, i) => acc + (i.profitAfterTax ?? i.profitBeforeTax ?? i.profitPerPiece ?? 0),
    0
  );

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لتوليد ملف PDF.');
    return;
  }

  const rowsHtml = items
    .map((item, idx) => {
      const dt = formatDateTime(item.createdAt);
      const profitBefore = item.profitBeforeTax ?? item.profitPerPiece ?? 0;
      const profitAfter = item.profitAfterTax ?? profitBefore;
      return `
      <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 0 ? 'background-color: #f8fafc;' : ''}">
        <td style="padding: 10px 8px; text-align: center; font-weight: bold; color: #475569;">${item.serialNumber}</td>
        <td style="padding: 10px 8px; text-align: center; font-family: monospace; font-size: 13px;">${item.sku}</td>
        <td style="padding: 10px 8px; font-weight: 600; color: #0f172a;">${item.name}</td>
        <td style="padding: 10px 8px; text-align: center;">${item.category}</td>
        <td style="padding: 10px 8px; text-align: left; font-family: monospace;">${item.officialPrice.toFixed(2)}</td>
        <td style="padding: 10px 8px; text-align: left; font-family: monospace; font-weight: bold; color: #047857;">${item.priceWithProfit.toFixed(2)}</td>
        <td style="padding: 10px 8px; text-align: left; font-family: monospace;">${item.priceAfterTax.toFixed(2)}</td>
        <td style="padding: 10px 8px; text-align: left; font-family: monospace; font-weight: bold; color: #0d9488;">${profitBefore.toFixed(2)}</td>
        <td style="padding: 10px 8px; text-align: left; font-family: monospace; font-weight: bold; color: #0284c7;">${profitAfter.toFixed(2)}</td>
        <td style="padding: 10px 8px; text-align: center; font-size: 11px; color: #64748b;">${dt.dateStr}</td>
      </tr>
    `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Cairo', Arial, sans-serif;
          margin: 0;
          padding: 24px;
          color: #1e293b;
          direction: rtl;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0f766e;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 22px;
          color: #0f766e;
          font-weight: 800;
        }
        .header .meta {
          text-align: left;
          font-size: 12px;
          color: #64748b;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 14px;
        }
        .stat-card .label {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .stat-card .val {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          font-family: monospace;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }
        th {
          background-color: #0f766e;
          color: #ffffff;
          padding: 10px 6px;
          text-align: right;
          font-size: 11px;
          font-weight: 700;
        }
        th:nth-child(1), th:nth-child(2), th:nth-child(4), th:nth-child(10) {
          text-align: center;
        }
        th:nth-child(5), th:nth-child(6), th:nth-child(7), th:nth-child(8), th:nth-child(9) {
          text-align: left;
        }
        .footer {
          margin-top: 30px;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
        }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <div style="font-size: 13px; color: #475569; margin-top: 4px;">منظومة سجل الأصناف وتسعير المنتجات الذكية - Firebase Realtime</div>
        </div>
        <div class="meta">
          <div><strong>تاريخ التقرير:</strong> ${nowDt.dayName}، ${nowDt.dateStr}</div>
          <div><strong>وقت الطباعة:</strong> ${nowDt.timeStr}</div>
          <div><strong>نسبة الربح:</strong> ${settings.profitRate}% | <strong>نسبة الضريبة:</strong> ${settings.taxRate}%</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">إجمالي عدد الأصناف</div>
          <div class="val">${items.length} صنف</div>
        </div>
        <div class="stat-card">
          <div class="label">إجمالي السعر بالمكسب</div>
          <div class="val" style="color: #047857;">${totalPriceWithProfit.toFixed(2)} ${settings.currency}</div>
        </div>
        <div class="stat-card">
          <div class="label">المكسب قبل الضريبة</div>
          <div class="val" style="color: #0d9488;">${totalProfitBefore.toFixed(2)} ${settings.currency}</div>
        </div>
        <div class="stat-card">
          <div class="label">صافي المكسب بعد الضريبة</div>
          <div class="val" style="color: #0284c7;">${totalProfitAfter.toFixed(2)} ${settings.currency}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>المسلسل</th>
            <th>كود SKU</th>
            <th>اسم الصنف</th>
            <th>القسم</th>
            <th>الرسمي (${settings.currency})</th>
            <th>بالمكسب (${settings.profitRate}%)</th>
            <th>بعد الضريبة (${settings.taxRate}%)</th>
            <th>المكسب قبل الضريبة</th>
            <th>صافي المكسب بعد الضريبة</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>تم استخراج هذا التقرير آلياً عبر لوحة إدارة المنتجات.</div>
        <div>صفحة 1 من 1</div>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function exportSingleItemPDF(
  item: Item,
  settings: TaxProfitSettings
) {
  const dt = formatDateTime(item.createdAt);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة لتحميل تقرير المنتج.');
    return;
  }

  const profitBefore = item.profitBeforeTax ?? item.profitPerPiece ?? 0;
  const profitAfter = item.profitAfterTax ?? profitBefore;

  const imageHtml = item.imageUrl
    ? `<img src="${item.imageUrl}" style="max-width: 180px; max-height: 180px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;" alt="${item.name}" />`
    : `<div style="width: 140px; height: 140px; background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 13px;">لا توجد صورة</div>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>بيانات المنتج - ${item.name}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Cairo', Arial, sans-serif;
          margin: 0;
          padding: 30px;
          color: #1e293b;
          direction: rtl;
        }
        .card {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 24px;
          background: #ffffff;
        }
        .header {
          border-bottom: 2px solid #0f766e;
          padding-bottom: 16px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 200px 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }
        .price-boxes {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-top: 20px;
        }
        .p-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .p-box .p-title {
          font-size: 11px;
          color: #64748b;
          margin-bottom: 4px;
        }
        .p-box .p-num {
          font-size: 16px;
          font-weight: 700;
          font-family: monospace;
          color: #0f172a;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div>
            <h1 style="margin: 0; font-size: 22px; color: #0f766e;">بطاقة تفاصيل المنتج الرسمية</h1>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">رقم المسلسل: <strong>${item.serialNumber}</strong></div>
          </div>
          <div style="text-align: left; font-size: 12px; color: #64748b;">
            <div><strong>تاريخ التسجيل:</strong> ${dt.dayName}، ${dt.dateStr}</div>
            <div><strong>ساعة التسجيل:</strong> ${dt.timeStr}</div>
          </div>
        </div>

        <div class="details-grid">
          <div>${imageHtml}</div>
          <div>
            <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #0f172a;">${item.name}</h2>
            <div style="font-size: 14px; margin-bottom: 8px;"><strong>كود الصنف (SKU):</strong> <span style="font-family: monospace;">${item.sku}</span></div>
            <div style="font-size: 14px; margin-bottom: 8px;"><strong>القسم:</strong> ${item.category}</div>
            <div style="font-size: 14px; margin-bottom: 8px;"><strong>نسبة الربح المحتسبة:</strong> ${settings.profitRate}%</div>
            <div style="font-size: 14px; margin-bottom: 8px;"><strong>نسبة الضريبة المحتسبة:</strong> ${settings.taxRate}% (محتسبة على السعر بالمكسب)</div>
          </div>
        </div>

        <div class="price-boxes">
          <div class="p-box">
            <div class="p-title">السعر الرسمي</div>
            <div class="p-num">${formatCurrency(item.officialPrice, settings.currency)}</div>
          </div>
          <div class="p-box" style="border-color: #059669; background: #ecfdf5;">
            <div class="p-title" style="color: #065f46;">بالمكسب (${settings.profitRate}%)</div>
            <div class="p-num" style="color: #047857;">${formatCurrency(item.priceWithProfit, settings.currency)}</div>
          </div>
          <div class="p-box">
            <div class="p-title">بعد الضريبة (${settings.taxRate}%)</div>
            <div class="p-num">${formatCurrency(item.priceAfterTax, settings.currency)}</div>
          </div>
          <div class="p-box" style="border-color: #0d9488; background: #f0fdfa;">
            <div class="p-title" style="color: #115e59;">المكسب قبل الضريبة</div>
            <div class="p-num" style="color: #0d9488;">${formatCurrency(profitBefore, settings.currency)}</div>
          </div>
          <div class="p-box" style="border-color: #0284c7; background: #f0f9ff;">
            <div class="p-title" style="color: #0369a1;">صافي المكسب بعد الضريبة</div>
            <div class="p-num" style="color: #0284c7;">${formatCurrency(profitAfter, settings.currency)}</div>
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px;">
          تم استخراج هذه البطاقة آلياً من نظام سجل الأصناف وتسعير المنتجات السحابي
        </div>
      </div>

      <script>
        window.onload = function() {
          window.focus();
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
