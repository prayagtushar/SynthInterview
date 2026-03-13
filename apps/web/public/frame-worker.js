// frame-worker.js — Offscreen canvas JPEG encoder for screen capture frames.
// Runs in a Web Worker so the main thread (React / Monaco) stays responsive.

let canvas = null;
let ctx = null;

// Deduplication: 8×8 thumbnail canvas for fast pixel checksum comparison.
// Avoids the expensive convertToBlob when the screen hasn't changed.
const THUMB = 8;
const THUMB_PIXELS = THUMB * THUMB; // 64 pixels × 3 channels = 192 values
// Threshold: mean per-channel difference of ~8/255 triggers a send.
const DEDUP_THRESHOLD = THUMB_PIXELS * 3 * 8;
let thumbCanvas = new OffscreenCanvas(THUMB, THUMB);
let thumbCtx = thumbCanvas.getContext("2d");
let prevChecksum = -1;

function computeChecksum() {
  thumbCtx.drawImage(canvas, 0, 0, THUMB, THUMB);
  const data = thumbCtx.getImageData(0, 0, THUMB, THUMB).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] + data[i + 1] + data[i + 2]; // RGB, skip alpha
  }
  return sum;
}

self.onmessage = async (e) => {
  const { bitmap, maxDim, quality } = e.data;

  // Compute target size
  let w = bitmap.width;
  let h = bitmap.height;
  if (w > h) {
    if (w > maxDim) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    }
  } else {
    if (h > maxDim) {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
  }

  // Lazy-init the OffscreenCanvas
  if (!canvas || canvas.width !== w || canvas.height !== h) {
    canvas = new OffscreenCanvas(w, h);
    ctx = canvas.getContext("2d");
    prevChecksum = -1; // force send after resize
  }

  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close(); // release GPU resources

  // Skip encoding if the frame is visually identical to the previous one
  const checksum = computeChecksum();
  if (Math.abs(checksum - prevChecksum) < DEDUP_THRESHOLD) {
    self.postMessage({ b64: null }); // signal: no change, don't send
    return;
  }
  prevChecksum = checksum;

  try {
    const blob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: quality || 0.7,
    });
    const reader = new FileReaderSync();
    const dataUrl = reader.readAsDataURL(blob);
    const b64 = dataUrl.split(",")[1];
    self.postMessage({ b64 });
  } catch (err) {
    // Fallback: encode via array buffer
    try {
      const blob = await canvas.convertToBlob({
        type: "image/jpeg",
        quality: quality || 0.7,
      });
      const ab = await blob.arrayBuffer();
      const bytes = new Uint8Array(ab);
      let binary = "";
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
      }
      self.postMessage({ b64: btoa(binary) });
    } catch (err2) {
      console.error("[FrameWorker] encode error:", err2);
      self.postMessage({ b64: null });
    }
  }
};
