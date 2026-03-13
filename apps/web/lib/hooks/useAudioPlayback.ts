import { useRef, useCallback } from 'react';

export function useAudioPlayback() {
	const playbackCtxRef = useRef<AudioContext | null>(null);
	const nextPlayAtRef = useRef(0);

	const playAudio = useCallback((payload: string) => {
		if (!playbackCtxRef.current) {
			playbackCtxRef.current = new AudioContext({ sampleRate: 16000 });
			nextPlayAtRef.current = playbackCtxRef.current.currentTime;
		}
		const playbackCtx = playbackCtxRef.current;
		try {
			const binary = atob(payload);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

			const i16 = new Int16Array(bytes.buffer);
			const f32 = new Float32Array(i16.length);
			for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x7fff;

			const buf = playbackCtx.createBuffer(1, f32.length, 16000);
			buf.getChannelData(0).set(f32);

			const src = playbackCtx.createBufferSource();
			src.buffer = buf;
			src.connect(playbackCtx.destination);

			if (nextPlayAtRef.current < playbackCtx.currentTime)
				nextPlayAtRef.current = playbackCtx.currentTime;
			src.start(nextPlayAtRef.current);
			nextPlayAtRef.current += buf.duration;
		} catch (e) {
			console.error('Playback error:', e);
		}
	}, []);

	const stopPlayback = useCallback(() => {
		if (playbackCtxRef.current) {
			playbackCtxRef.current.close().catch(() => {});
			playbackCtxRef.current = null;
			nextPlayAtRef.current = 0;
		}
	}, []);

	return { playAudio, stopPlayback };
}
