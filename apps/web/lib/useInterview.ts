'use client';

import { useRef, useState, useCallback } from 'react';

export function useInterview(sessionId: string = 'default-session') {
	const [isConnected, setIsConnected] = useState(false);
	const [feedback, setFeedback] = useState<string[]>([]);
	const [currentState, setCurrentState] = useState<string>('IDLE');
	const socketRef = useRef<WebSocket | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// ── Helper: send a JSON event over WebSocket ────────────────────────────
	const send = useCallback((obj: object) => {
		if (socketRef.current?.readyState === WebSocket.OPEN) {
			socketRef.current.send(JSON.stringify(obj));
		}
	}, []);

	const sendEvent = useCallback(
		(type: string, payload?: unknown) => {
			send({ type: 'event', payload: type, data: payload });
		},
		[send],
	);

	// ── Request media permissions (must be in user gesture) ─────────────────
	const acquireMediaStreams = async (): Promise<boolean> => {
		try {
			const audioStream = await navigator.mediaDevices.getUserMedia({
				audio: {
					sampleRate: 16000,
					channelCount: 1,
					echoCancellation: true,
					noiseSuppression: true,
				},
			});
			mediaStreamRef.current = audioStream;

			const screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: { frameRate: 5 },
				audio: false,
			});
			screenStreamRef.current = screenStream;
			return true;
		} catch (err) {
			console.error('Media acquisition failed:', err);
			return false;
		}
	};

	// ── AudioWorklet: PCM16 capture → WebSocket ──────────────────────────────
	/** Convert ArrayBuffer → base64 safely (avoids call-stack overflow for large buffers) */
	const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
		const bytes = new Uint8Array(buffer);
		let binary = '';
		const chunkSize = 8192;
		for (let i = 0; i < bytes.length; i += chunkSize) {
			binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
		}
		return btoa(binary);
	};

	const setupAudioProcessing = async (stream: MediaStream): Promise<void> => {
		const ctx = new AudioContext({ sampleRate: 16000 });
		audioContextRef.current = ctx;
		if (ctx.state === 'suspended') await ctx.resume();
		const source = ctx.createMediaStreamSource(stream);

		try {
			await ctx.audioWorklet.addModule('/audio-processor.js');
			const node = new AudioWorkletNode(ctx, 'audio-processor');
			console.log('[Audio] AudioWorklet loaded successfully');

			let audioChunksSent = 0;
			node.port.onmessage = (e: MessageEvent) => {
				if (socketRef.current?.readyState !== WebSocket.OPEN) return;
				try {
					const b64 = arrayBufferToBase64(e.data as ArrayBuffer);
					send({ type: 'audio', payload: b64 });
					audioChunksSent++;
					if (audioChunksSent === 1 || audioChunksSent % 50 === 0) {
						console.log(`[Audio] Sent ${audioChunksSent} chunks to backend`);
					}
				} catch (err) {
					console.error('[Audio] Failed to encode/send chunk:', err);
				}
			};

			source.connect(node);
			node.connect(ctx.destination);
		} catch (err) {
			console.error('[Audio] AudioWorklet setup failed:', err);
		}
	};

	// ── Screen frame capture → WebSocket ────────────────────────────────────
	const setupScreenProcessing = (stream: MediaStream): void => {
		const canvas = document.createElement('canvas');
		const ctx2d = canvas.getContext('2d');
		const video = document.createElement('video');
		video.srcObject = stream;
		video.play();

		frameIntervalRef.current = setInterval(() => {
			if (socketRef.current?.readyState !== WebSocket.OPEN) return;
			if (video.readyState < 2) return;
			try {
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				ctx2d?.drawImage(video, 0, 0);
				const b64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
				send({ type: 'frame', payload: b64 });
			} catch (err) {
				console.error('Frame capture error:', err);
			}
		}, 200); // 5 fps
	};

	// ── Connect: gesture → streams → WS → start sending ────────────────────
	const connect = useCallback(async () => {
		// 1. Acquire media inside the user gesture so browsers allow it
		const ok = await acquireMediaStreams();
		if (!ok) {
			alert(
				'Failed to access microphone or screen — please check permissions.',
			);
			return;
		}

		// 2. Open WebSocket
		const ws = new WebSocket(`ws://localhost:8000/ws/live/${sessionId}`);
		socketRef.current = ws;

		// 3. Playback state for incoming AI audio
		let playbackCtx: AudioContext | null = null;
		let nextPlayAt = 0;

		const initPlayback = () => {
			if (!playbackCtx) {
				playbackCtx = new AudioContext({ sampleRate: 16000 });
				nextPlayAt = playbackCtx.currentTime;
			}
		};

		// 4. WS lifecycle
		ws.onopen = async () => {
			setIsConnected(true);

			// Start mic + screen capture AFTER socket is confirmed open
			if (mediaStreamRef.current)
				await setupAudioProcessing(mediaStreamRef.current);
			if (screenStreamRef.current)
				setupScreenProcessing(screenStreamRef.current);

			// Fire events in order: connect first, then screen_share_active
			// (backend state machine: IDLE→GREETING on connect, GREETING→ENV_CHECK on screen_share)
			sendEvent('candidate_connect');
			// Small delay so GREETING state is set before ENV_CHECK transition
			setTimeout(() => sendEvent('screen_share_active'), 500);
		};

		ws.onmessage = (ev) => {
			const data = JSON.parse(ev.data);

			if (data.type === 'text') {
				setFeedback((prev) => [...prev, data.payload]);
			} else if (data.type === 'state_update') {
				setCurrentState(data.payload);
			} else if (data.type === 'audio') {
				// Play AI voice output
				initPlayback();
				if (!playbackCtx) return;
				try {
					const binary = atob(data.payload);
					const bytes = new Uint8Array(binary.length);
					for (let i = 0; i < binary.length; i++)
						bytes[i] = binary.charCodeAt(i);

					const i16 = new Int16Array(bytes.buffer);
					const f32 = new Float32Array(i16.length);
					for (let i = 0; i < i16.length; i++) f32[i] = i16[i] / 0x7fff;

					const buf = playbackCtx.createBuffer(1, f32.length, 16000);
					buf.getChannelData(0).set(f32);

					const src = playbackCtx.createBufferSource();
					src.buffer = buf;
					src.connect(playbackCtx.destination);

					if (nextPlayAt < playbackCtx.currentTime)
						nextPlayAt = playbackCtx.currentTime;
					src.start(nextPlayAt);
					nextPlayAt += buf.duration;
				} catch (e) {
					console.error('Playback error:', e);
				}
			} else if (data.type === 'error') {
				console.error('Server error:', data.payload);
			}
		};

		ws.onclose = () => setIsConnected(false);
		ws.onerror = (e) => console.error('WebSocket error:', e);
	}, [sessionId, send, sendEvent]);

	// ── Disconnect ───────────────────────────────────────────────────────────
	const disconnect = useCallback(() => {
		socketRef.current?.close();
		mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
		screenStreamRef.current?.getTracks().forEach((t) => t.stop());
		if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
		audioContextRef.current?.close();
		setIsConnected(false);
	}, []);

	return {
		isConnected,
		feedback,
		currentState,
		connect,
		disconnect,
		sendEvent,
	};
}
