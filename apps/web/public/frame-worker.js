// frame-worker.js — Offscreen canvas JPEG encoder for screen capture frames.
// Runs in a Web Worker so the main thread (React / Monaco) stays responsive.

let canvas = null;
let ctx = null;

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
		ctx = canvas.getContext('2d');
	}

	ctx.drawImage(bitmap, 0, 0, w, h);
	bitmap.close(); // release GPU resources

	try {
		const blob = await canvas.convertToBlob({
			type: 'image/jpeg',
			quality: quality || 0.7,
		});
		const reader = new FileReaderSync();
		const dataUrl = reader.readAsDataURL(blob);
		const b64 = dataUrl.split(',')[1];
		self.postMessage({ b64 });
	} catch (err) {
		// Fallback: encode via array buffer
		try {
			const blob = await canvas.convertToBlob({
				type: 'image/jpeg',
				quality: quality || 0.7,
			});
			const ab = await blob.arrayBuffer();
			const bytes = new Uint8Array(ab);
			let binary = '';
			const chunkSize = 8192;
			for (let i = 0; i < bytes.length; i += chunkSize) {
				binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
			}
			self.postMessage({ b64: btoa(binary) });
		} catch (err2) {
			console.error('[FrameWorker] encode error:', err2);
			self.postMessage({ b64: null });
		}
	}
};
