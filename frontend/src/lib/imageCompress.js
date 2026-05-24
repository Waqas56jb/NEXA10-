/**
 * Compress an image File/Blob to a JPEG data URL ≤ targetKB by:
 *  1. drawing it into a canvas scaled so the longest side ≤ maxDim px
 *  2. retrying with descending quality if the result still exceeds the cap
 *
 * Resolves to a data URL string (`data:image/jpeg;base64,...`).
 * Rejects if the file isn't an image or compression fails.
 */
export async function compressImage(file, { maxDim = 1280, targetKB = 480 } = {}) {
  if (!file) throw new Error('No file');
  if (!file.type?.startsWith('image/')) throw new Error('Not an image file');

  const bitmap = await loadBitmap(file);
  const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, w, h);

  const target = targetKB * 1024;
  for (const q of [0.85, 0.75, 0.65, 0.55, 0.45, 0.35]) {
    const dataUrl = canvas.toDataURL('image/jpeg', q);
    if (dataUrl.length * 0.75 <= target) return dataUrl; // base64 → bytes ≈ *0.75
  }
  // Last resort: hand back the smallest quality even if slightly over the target
  return canvas.toDataURL('image/jpeg', 0.3);
}

function loadBitmap(file) {
  // createImageBitmap is faster but absent on some Safari builds — fallback to <img>
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadViaImg(file));
  }
  return loadViaImg(file);
}

function loadViaImg(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image file'));
    };
    img.src = url;
  });
}
