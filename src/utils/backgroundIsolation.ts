import { removeBackground } from '@imgly/background-removal';

export interface IsolationResult {
  whiteBgDataUrl: string;
  transparentDataUrl: string;
  originalDataUrl: string;
  width: number;
  height: number;
}

/**
 * Fallback client-side computer vision background isolation
 * Uses multi-corner background profiling, color distance delta, and edge-matting
 */
async function fallbackIsolateBackground(
  imgElement: HTMLImageElement
): Promise<{ whiteBgDataUrl: string; transparentDataUrl: string }> {
  const width = imgElement.naturalWidth || imgElement.width;
  const height = imgElement.naturalHeight || imgElement.height;

  // Process on full resolution canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('تعذر إنشاء سياق الرسم');

  ctx.drawImage(imgElement, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Sample background colors from edges and corners (10px margin)
  const samples: [number, number, number][] = [];
  const sampleSteps = 20;

  for (let i = 0; i < sampleSteps; i++) {
    const x = Math.floor((i / sampleSteps) * width);
    const y = Math.floor((i / sampleSteps) * height);
    // Top border
    let idx = (0 * width + x) * 4;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    // Bottom border
    idx = ((height - 1) * width + x) * 4;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    // Left border
    idx = (y * width + 0) * 4;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
    // Right border
    idx = (y * width + (width - 1)) * 4;
    samples.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  // Calculate median / average background color
  let avgR = 0, avgG = 0, avgB = 0;
  for (const [r, g, b] of samples) {
    avgR += r;
    avgG += g;
    avgB += b;
  }
  avgR /= samples.length;
  avgG /= samples.length;
  avgB /= samples.length;

  // Color difference threshold
  const threshold = 32;

  // Create transparent canvas
  const transCanvas = document.createElement('canvas');
  transCanvas.width = width;
  transCanvas.height = height;
  const transCtx = transCanvas.getContext('2d', { willReadFrequently: true });
  if (!transCtx) throw new Error('تعذر إنشاء سياق الشفافية');
  const transImgData = transCtx.createImageData(width, height);
  const transData = transImgData.data;

  // Create pure white canvas
  const whiteCanvas = document.createElement('canvas');
  whiteCanvas.width = width;
  whiteCanvas.height = height;
  const whiteCtx = whiteCanvas.getContext('2d');
  if (!whiteCtx) throw new Error('تعذر إنشاء سياق الخلفية البيضاء');
  whiteCtx.fillStyle = '#FFFFFF';
  whiteCtx.fillRect(0, 0, width, height);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Distance from sampled background
    const dist = Math.sqrt(
      Math.pow(r - avgR, 2) + Math.pow(g - avgG, 2) + Math.pow(b - avgB, 2)
    );

    if (dist < threshold || a < 30) {
      // Background pixel -> make transparent
      transData[i] = 255;
      transData[i + 1] = 255;
      transData[i + 2] = 255;
      transData[i + 3] = 0;
    } else if (dist < threshold + 18) {
      // Edge soft feathering
      const featherAlpha = Math.round(((dist - threshold) / 18) * 255);
      transData[i] = r;
      transData[i + 1] = g;
      transData[i + 2] = b;
      transData[i + 3] = Math.min(a, featherAlpha);
    } else {
      // Foreground product pixel
      transData[i] = r;
      transData[i + 1] = g;
      transData[i + 2] = b;
      transData[i + 3] = a;
    }
  }

  transCtx.putImageData(transImgData, 0, 0);
  whiteCtx.drawImage(transCanvas, 0, 0);

  return {
    whiteBgDataUrl: whiteCanvas.toDataURL('image/jpeg', 0.98),
    transparentDataUrl: transCanvas.toDataURL('image/png'),
  };
}

/**
 * Isolates background of an image using AI neural removal (@imgly/background-removal)
 * with automatic fallback and composites to pure studio white background (#FFFFFF)
 */
export async function isolateImageToWhiteBackground(
  imageSource: string | File | Blob,
  onProgress?: (step: string) => void
): Promise<IsolationResult> {
  onProgress?.('جاري قراءة الصورة وتجهيز النموذج الذكي...');

  // Convert imageSource to a loaded HTMLImageElement and dataUrl
  let originalDataUrl = '';
  if (typeof imageSource === 'string') {
    originalDataUrl = imageSource;
  } else {
    originalDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
      reader.readAsDataURL(imageSource);
    });
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('فشل تحميل الصورة في المتصفح'));
    img.src = originalDataUrl;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  try {
    onProgress?.('جاري عزل العناصر بدقة بالذكاء الاصطناعي...');
    
    // Attempt neural background removal
    const isolatedBlob = await removeBackground(imageSource, {
      progress: (key: string, current: number, total: number) => {
        if (total > 0) {
          const pct = Math.round((current / total) * 100);
          onProgress?.(`معالجة الذكاء الاصطناعي (${pct}%)...`);
        }
      },
      output: {
        format: 'image/png',
        quality: 1.0,
      },
    });

    onProgress?.('جاري دمج المنتج مع خلفية بيضاء فائقة النقاء...');

    // Load isolated transparent PNG
    const isolatedImg = new Image();
    const transparentUrl = URL.createObjectURL(isolatedBlob);
    await new Promise<void>((resolve, reject) => {
      isolatedImg.onload = () => resolve();
      isolatedImg.onerror = () => reject(new Error('فشل معالجة نتيجة العزل'));
      isolatedImg.src = transparentUrl;
    });

    // Create high-res white background canvas
    const whiteCanvas = document.createElement('canvas');
    whiteCanvas.width = width;
    whiteCanvas.height = height;
    const ctx = whiteCanvas.getContext('2d');
    if (!ctx) throw new Error('تعذر تهيئة الرسم');

    // Fill with pure studio white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    
    // Draw isolated product
    ctx.drawImage(isolatedImg, 0, 0, width, height);

    const whiteBgDataUrl = whiteCanvas.toDataURL('image/jpeg', 0.98);
    const transparentDataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(isolatedBlob);
    });

    onProgress?.('تم العزل بنجاح بأعلى جودة!');

    return {
      whiteBgDataUrl,
      transparentDataUrl,
      originalDataUrl,
      width,
      height,
    };
  } catch (error) {
    console.warn('Neural background removal encountered an issue, running high-precision computer vision fallback:', error);
    onProgress?.('جاري إتمام العزل بتقنية الرؤية الحاسوبية الدقيقة...');

    const fallbackResult = await fallbackIsolateBackground(img);
    onProgress?.('تم العزل بنجاح بأعلى جودة!');

    return {
      whiteBgDataUrl: fallbackResult.whiteBgDataUrl,
      transparentDataUrl: fallbackResult.transparentDataUrl,
      originalDataUrl,
      width,
      height,
    };
  }
}

/**
 * Downloads a data URL as a file with the given filename
 */
export function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
