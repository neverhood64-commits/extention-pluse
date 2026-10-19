import { LOGO_ASSET_PATH } from '../data/defaultSites';

let cachedTransparentDataUrl: string | null = null;
let processingPromise: Promise<string> | null = null;

/**
 * Removes the outer white/light background around the logo using an edge-seeded
 * flood-fill + anti-alias halo removal + tight bounding-box crop, while preserving
 * the white emblem inside the logo.
 */
export function getTransparentLogoDataUrl(): Promise<string> {
  if (cachedTransparentDataUrl) {
    return Promise.resolve(cachedTransparentDataUrl);
  }
  if (processingPromise) {
    return processingPromise;
  }

  processingPromise = new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(LOGO_ASSET_PATH);
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const visited = new Uint8Array(w * h);
        const isBackground = new Uint8Array(w * h);

        // Helper to check if a pixel is part of the white/neutral outer background
        const isOuterBgPixel = (idx: number): boolean => {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a < 20) return true;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const diff = max - min;
          // Pure white or light gray shadow in the outer margin
          return min >= 200 && diff <= 32;
        };

        // Queue for BFS starting from all 4 image edges
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const pushIfBg = (x: number, y: number) => {
          const pos = y * w + x;
          if (visited[pos]) return;
          visited[pos] = 1;
          const idx = pos * 4;
          if (isOuterBgPixel(idx)) {
            isBackground[pos] = 1;
            queue[tail++] = pos;
          }
        };

        for (let x = 0; x < w; x++) {
          pushIfBg(x, 0);
          pushIfBg(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          pushIfBg(0, y);
          pushIfBg(w - 1, y);
        }

        while (head < tail) {
          const pos = queue[head++];
          const x = pos % w;
          const y = (pos - x) / w;

          if (x > 0) pushIfBg(x - 1, y);
          if (x + 1 < w) pushIfBg(x + 1, y);
          if (y > 0) pushIfBg(x, y - 1);
          if (y + 1 < h) pushIfBg(x, y + 1);
        }

        // Clear background pixels and feather 1-2px border halo to eliminate white fringes
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const pos = y * w + x;
            const idx = pos * 4;
            if (isBackground[pos]) {
              data[idx + 3] = 0;
            } else {
              // Check if adjacent to a background pixel to smooth anti-aliased white edge
              const hasBgNeighbor =
                (x > 0 && isBackground[pos - 1]) ||
                (x + 1 < w && isBackground[pos + 1]) ||
                (y > 0 && isBackground[pos - w]) ||
                (y + 1 < h && isBackground[pos + w]);

              if (hasBgNeighbor) {
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const saturation = max - min;
                if (min > 175 && saturation < 55) {
                  // Softly fade out pale edge halo pixel
                  data[idx + 3] = Math.max(0, Math.min(255, saturation * 4));
                }
              }
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);

        // Find tight bounding box of the actual logo so excess outer margin is cropped out
        let minX = w;
        let minY = h;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const alpha = data[(y * w + x) * 4 + 3];
            if (alpha > 25) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }

        if (maxX > minX && maxY > minY) {
          const pad = 4;
          const cropX = Math.max(0, minX - pad);
          const cropY = Math.max(0, minY - pad);
          const cropW = Math.min(w - cropX, maxX - minX + 1 + pad * 2);
          const cropH = Math.min(h - cropY, maxY - minY + 1 + pad * 2);

          const croppedCanvas = document.createElement('canvas');
          croppedCanvas.width = cropW;
          croppedCanvas.height = cropH;
          const croppedCtx = croppedCanvas.getContext('2d');
          if (croppedCtx) {
            croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
            cachedTransparentDataUrl = croppedCanvas.toDataURL('image/png');
            resolve(cachedTransparentDataUrl);
            return;
          }
        }

        cachedTransparentDataUrl = canvas.toDataURL('image/png');
        resolve(cachedTransparentDataUrl);
      } catch {
        resolve(LOGO_ASSET_PATH);
      }
    };
    img.onerror = () => resolve(LOGO_ASSET_PATH);
    img.src = LOGO_ASSET_PATH;
  });

  return processingPromise;
}
