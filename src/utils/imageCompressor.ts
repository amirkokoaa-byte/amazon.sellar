import { storage, storageRef, uploadBytes, getDownloadURL } from '../firebase';

export interface CompressionResult {
  blob: Blob;
  previewUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
}

/**
 * ضغط الصورة باستخدام Canvas في المتصفح لضمان ألا تتعدى 300 كيلوبايت قبل الرفع إلى Firebase Storage
 */
export async function compressImageTo300KB(file: File): Promise<CompressionResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));

    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('فشل تحميل الصورة'));

      img.onload = async () => {
        try {
          const maxTargetBytes = 300 * 1024; // 300 KB الحد الأقصى المطلوب بدقة

          // أبعاد أولية مناسبة للعرض عالي الجودة مع الحفاظ على التناسب
          let targetWidth = img.width;
          let targetHeight = img.height;
          const maxInitialDimension = 1200;

          if (targetWidth > maxInitialDimension || targetHeight > maxInitialDimension) {
            if (targetWidth > targetHeight) {
              targetHeight = Math.round((targetHeight * maxInitialDimension) / targetWidth);
              targetWidth = maxInitialDimension;
            } else {
              targetWidth = Math.round((targetWidth * maxInitialDimension) / targetHeight);
              targetHeight = maxInitialDimension;
            }
          }

          let canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          let ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('فشل تهيئة Canvas لضغط الصورة');
          }

          // خلفية بيضاء للصور الشفافة (PNG) لتجنب السواد عند التحويل إلى JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // محاولة ضغط تدرجي حتى نصل لأقل من 300KB
          let quality = 0.85;
          let blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));

          let attempts = 0;
          while (blob && blob.size > maxTargetBytes && attempts < 8) {
            attempts++;
            if (quality > 0.4) {
              quality -= 0.12;
            } else {
              // إذا كانت الجودة منخفضة ولا يزال الحجم كبيراً، نقلل الأبعاد بنسبة 20%
              targetWidth = Math.round(targetWidth * 0.8);
              targetHeight = Math.round(targetHeight * 0.8);
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, targetWidth, targetHeight);
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              }
              quality = 0.7;
            }
            blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality));
          }

          if (!blob) {
            throw new Error('فشل تحويل الصورة إلى Blob');
          }

          const compressedSizeKb = Math.round(blob.size / 1024);
          const previewUrl = URL.createObjectURL(blob);

          resolve({
            blob,
            previewUrl,
            originalSizeKb,
            compressedSizeKb,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * رفع الصورة المضغوطة إلى Firebase Storage في مسار /products_images والحصول على رابط التحميل (Download URL)
 */
export async function uploadProductImageToStorage(
  imageBlob: Blob,
  prefix: string = 'prod'
): Promise<string> {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const fileName = `${prefix}_${timestamp}_${randomStr}.jpg`;
  const imagePath = `products_images/${fileName}`;

  const fileRef = storageRef(storage, imagePath);

  // رفع مع تحديد نوع الملف
  const snapshot = await uploadBytes(fileRef, imageBlob, {
    contentType: 'image/jpeg',
    customMetadata: {
      uploadedAt: new Date().toISOString(),
      fileSize: `${Math.round(imageBlob.size / 1024)}KB`,
    },
  });

  // استخراج رابط التحميل
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}
