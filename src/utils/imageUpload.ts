import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * ضغط الصورة باستخدام Canvas حتى لا يتعدى حجمها 300KB
 */
export async function compressImage(
  file: File,
  maxSizeInBytes: number = 300 * 1024
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('فشل تحميل الصورة في الذاكرة'));
      img.onload = () => {
        // تحديد الأبعاد القصوى للحفاظ على الدقة العالية مع صغر الحجم
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('فشل معالجة أبعاد الصورة'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // التدرج في جودة الضغط حتى الوصول لأقل من 300KB
        let quality = 0.82;
        const tryCompress = (q: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('فشل تحويل الصورة'));
                return;
              }
              if (blob.size <= maxSizeInBytes || q <= 0.35) {
                resolve(blob);
              } else {
                tryCompress(Math.max(0.3, q - 0.15));
              }
            },
            'image/jpeg',
            q
          );
        };

        tryCompress(quality);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * رفع الصورة المضغوطة إلى Firebase Storage في مجلد /products_images والحصول على الرابط
 */
export async function uploadProductImage(file: File): Promise<string> {
  // 1. ضغط الصورة أولاً بحيث لا تتعدى 300KB
  const compressedBlob = await compressImage(file, 300 * 1024);

  // 2. إنشاء اسم ومسار فريد في مجلد products_images
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-20);
  const filePath = `products_images/${timestamp}_${randomSuffix}_${cleanName}.jpg`;

  const fileRef = storageRef(storage, filePath);

  // 3. رفع الصورة إلى Firebase Storage
  const snapshot = await uploadBytes(fileRef, compressedBlob, {
    contentType: 'image/jpeg',
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  // 4. الحصول على رابط التحميل المباشر وحفظه فقط كنص في Realtime Database
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
}
