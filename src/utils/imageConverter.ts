/**
 * Converts any image (PNG, WebP, GIF, HEIC/HEIF blob, BMP, SVG, Camera frame, etc.)
 * into a genuine, standard JPEG format (image/jpeg) with optimal compression.
 */

export interface ConvertedJpgImage {
  dataUrl: string; // Genuine data:image/jpeg;base64,...
  sizeBytes: number;
  width: number;
  height: number;
  format: 'image/jpeg';
  fileName: string;
}

export async function convertToGenuineJpg(
  source: File | Blob | string,
  suggestedName?: string
): Promise<ConvertedJpgImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanUp = () => {
      img.onload = null;
      img.onerror = null;
    };

    img.onload = () => {
      try {
        let { width, height } = img;
        const maxDimension = 1600;

        // Proportional resize if exceptionally large to ensure performance and prevent browser memory crash
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
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanUp();
          reject(new Error('HTML Canvas 2D context not available'));
          return;
        }

        // Fill solid white background (crucial for PNGs with transparency so JPEG doesn't render black voids)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to genuine JPEG format (quality 0.88)
        const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.88);

        // Calculate genuine byte length from base64 string
        const base64Content = jpgDataUrl.split(',')[1] || '';
        const sizeBytes = Math.round((base64Content.length * 3) / 4);

        const baseName = suggestedName
          ? suggestedName.replace(/\.[^/.]+$/, '')
          : `civic_evidence_${Date.now()}`;
        const finalFileName = `${baseName}.jpg`;

        cleanUp();
        resolve({
          dataUrl: jpgDataUrl,
          sizeBytes,
          width: canvas.width,
          height: canvas.height,
          format: 'image/jpeg',
          fileName: finalFileName,
        });
      } catch (err) {
        cleanUp();
        reject(err);
      }
    };

    img.onerror = (e) => {
      cleanUp();
      reject(new Error('Failed to load image for JPG conversion: ' + e));
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.onerror = (e) => {
        cleanUp();
        reject(e);
      };
      reader.readAsDataURL(source);
    }
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
