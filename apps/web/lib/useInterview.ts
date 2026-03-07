import { useEffect, useRef, useState, useCallback } from 'react';

export function useInterview() {
	const [isConnected, setIsConnected] = useState(false);
	const [feedback, setFeedback] = useState<string[]>([]);
	const socketRef = useRef<WebSocket | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const screenStreamRef = useRef<MediaStream | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

	const connect = useCallback(() => {
		const ws = new WebSocket('ws://localhost:8000/ws/live');
		ws.onopen = () => {
			setIsConnected(true);
			startStreaming();
		};
		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === 'text') {
				setFeedback((prev) => [...prev, data.payload]);
			}
		};
		ws.onclose = () => setIsConnected(false);
		ws.onerror = (err) => console.error('WebSocket Error:', err);
		socketRef.current = ws;
	}, []);

	const startStreaming = async () => {
		try {
			// Capture Microphone (16kHz mono as required by Gemini Live)
			const audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });
			mediaStreamRef.current = audioStream;
			setupAudioProcessing(audioStream);

			// Capture Screen (Low frame rate to save bandwidth)
			const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
                video: { frameRate: 5 },
                audio: false
            });
			screenStreamRef.current = screenStream;
			setupScreenProcessing(screenStream);
		} catch (error) {
			console.error('Error starting media streams:', error);
		}
	};

	const setupAudioProcessing = (stream: MediaStream) => {
		const audioContext = new AudioContext({ sampleRate: 16000 });
		audioContextRef.current = audioContext;
		const source = audioContext.createMediaStreamSource(stream);
		const processor = audioContext.createScriptProcessor(4096, 1, 1);

		source.connect(processor);
		processor.connect(audioContext.destination);

		processor.onaudioprocess = (e) => {
			const inputData = e.inputBuffer.getChannelData(0);
			// Convert to 16-bit PCM
			const pcmData = new Int16Array(inputData.length);
			for (let i = 0; i < inputData.length; i++) {
				pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
			}
			
			if (socketRef.current?.readyState === WebSocket.OPEN) {
				const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
				socketRef.current.send(JSON.stringify({ type: 'audio', payload: base64Audio }));
			}
		};
	};

	const setupScreenProcessing = (stream: MediaStream) => {
		const videoTrack = stream.getVideoTracks()[0];
		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

		frameIntervalRef.current = setInterval(() => {
			if (socketRef.current?.readyState === WebSocket.OPEN && video.readyState >= 2) {
				try {
					canvas.width = video.videoWidth;
					canvas.height = video.videoHeight;
					ctx?.drawImage(video, 0, 0);
                    // Use a reasonable quality for JPEG
					const base64Frame = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
					socketRef.current.send(JSON.stringify({ type: 'frame', payload: base64Frame }));
				} catch (err) {
					console.error('Error capturing frame:', err);
				}
			}
		}, 200); // 5 fps (every 200ms)
	};

	const disconnect = useCallback(() => {
		socketRef.current?.close();
		mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
		screenStreamRef.current?.getTracks().forEach((t) => t.stop());
		if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
		audioContextRef.current?.close();
        setIsConnected(false);
	}, []);

	return { isConnected, feedback, connect, disconnect };
}
