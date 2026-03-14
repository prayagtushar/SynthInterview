'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { QuestionData, ScorecardData } from './types';
import { useAudioPlayback } from './hooks/useAudioPlayback';
import { useTabMonitoring } from './hooks/useTabMonitoring';
import { useMedia } from './hooks/useMedia';

const ACTIVE_STATES = new Set([
	'GREETING',
	'ENV_CHECK',
	'PROBLEM_DELIVERY',
	'THINK_TIME',
	'APPROACH_LISTEN',
	'CODING',
	'HINT_DELIVERY',
	'TESTING',
	'OPTIMIZATION',
	'FLAGGED',
	'SCREEN_NOT_VISIBLE',
]);

export function useInterview(sessionId: string = 'default-session') {
	const [isConnected, setIsConnected] = useState(false);
	const [feedback, setFeedback] = useState<string[]>([]);
	const [currentState, setCurrentState] = useState<string>('IDLE');
	const [screenLost, setScreenLost] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [isUserSpeaking, setIsUserSpeaking] = useState(false);
	const [violationReason, setViolationReason] = useState<string | null>(null);
	const [tabSwitchWarning, setTabSwitchWarning] = useState<{
		count: number;
		max: number;
	} | null>(null);
	const [screenViolation, setScreenViolation] = useState<{
		box_2d: [number, number, number, number];
		probability: number;
		reason: string;
	} | null>(null);
	const [webcamViolation, setWebcamViolation] = useState<{
		box_2d: [number, number, number, number];
		probability: number;
		reason: string;
	} | null>(null);
	const [isTerminated, setIsTerminated] = useState(false);
	const [sessionBlocked, setSessionBlocked] = useState<{
		type: 'terminated' | 'completed';
		reason: string;
	} | null>(null);
	const [resetKey, setResetKey] = useState(0);
	const [greetingDone, setGreetingDone] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [questionData, setQuestionData] = useState<QuestionData | null>(null);
	const [scorecardData, setScorecardData] = useState<ScorecardData | null>(
		null,
	);
	const [restoredCode, setRestoredCode] = useState<string | null>(null);

	const socketRef = useRef<WebSocket | null>(null);
	const isSpeakingRef = useRef(false);
	const isMutedRef = useRef(false);
	const isTerminatedRef = useRef(false);
	const sessionBlockedRef = useRef(false);
	const reconnectAttemptRef = useRef(0);
	const screenShareLostPendingRef = useRef(false);
	const currentStateRef = useRef<string>('IDLE');
	const codeSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
	const lastCopiedTextRef = useRef<string>('');
	const beforeUnloadRef = useRef<(() => void) | null>(null);
	const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
	const vadSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const { playAudio, stopPlayback } = useAudioPlayback();

	useEffect(() => {
		currentStateRef.current = currentState;
	}, [currentState]);

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

	const onTerminate = useCallback(
		(reason: string) => {
			setIsTerminated(true);
			send({ type: 'event', payload: 'terminate_session', data: { reason } });
		},
		[send],
	);

	const {
		acquireMediaStreams,
		setupAudioProcessing,
		setupScreenProcessing,
		stopMedia,
		stopScreenShare,
		reshareScreen,
		toggleMute: toggleMediaMute,
		setScreenActive,
		setIsSpeaking: setMediaSpeaking,
		mediaStream,
		screenStream,
		webcamStream,
		faceVideoRef,
	} = useMedia({
		onAudioData: (b64, rms) => {
			if (isMutedRef.current) {
				setIsUserSpeaking(false);
				return;
			}
			send({ type: 'audio', payload: b64 });

			const VAD_THRESHOLD = 0.01;
			if (rms > VAD_THRESHOLD) {
				setIsUserSpeaking(true);
				if (vadSilenceTimerRef.current) {
					clearTimeout(vadSilenceTimerRef.current);
					vadSilenceTimerRef.current = null;
				}
			} else if (!vadSilenceTimerRef.current) {
				vadSilenceTimerRef.current = setTimeout(() => {
					setIsUserSpeaking(false);
					vadSilenceTimerRef.current = null;
				}, 400);
			}
		},
		onFrameData: (b64, source) => send({ type: 'frame', payload: b64, source }),
		onScreenLost: (pending) => {
			setScreenLost(true);
			if (pending) {
				screenShareLostPendingRef.current = true;
			} else {
				send({ type: 'event', payload: 'screen_share_ended' });
			}
		},
		onScreenRestored: () => {
			setScreenLost(false);
			send({ type: 'event', payload: 'screen_share_active' });
		},
		onTerminate,
	});

	const { startMonitoring, stopMonitoring } = useTabMonitoring({
		currentState,
		onViolation: (count) => {
			setTabSwitchWarning({ count, max: 3 });
			send({ type: 'event', payload: 'tab_switch', data: { count } });
		},
		onTimeout: () => {
			setIsTerminated(true);
			send({
				type: 'event',
				payload: 'end_interview',
				data: { reason: 'tab_switch_limit' },
			});
			setTimeout(() => socketRef.current?.close(), 5000);
		},
	});

	const toggleMute = useCallback(() => {
		const newState = !isMutedRef.current;
		setIsMuted(newState);
		isMutedRef.current = newState;
		toggleMediaMute(newState);
	}, [toggleMediaMute]);

	const sendCode = useCallback(
		(code: string) => {
			if (codeSyncTimerRef.current) clearTimeout(codeSyncTimerRef.current);
			codeSyncTimerRef.current = setTimeout(() => {
				send({ type: 'code_update', payload: code });
			}, 1500);
		},
		[send],
	);

	const connect = useCallback(() => {
		setFeedback([]);
		setCurrentState('IDLE');
		setScreenLost(false);
		setIsSpeaking(false);
		isSpeakingRef.current = false;
		setMediaSpeaking(false);
		setIsUserSpeaking(false);
		screenShareLostPendingRef.current = false;
		setViolationReason(null);
		setTabSwitchWarning(null);
		setScreenViolation(null);
		setWebcamViolation(null);
		setIsTerminated(false);
		setQuestionData(null);
		setScorecardData(null);
		setGreetingDone(false);
		setIsMuted(false);
		isMutedRef.current = false;
		setResetKey((k) => k + 1);

		const host = window.location.hostname;
		const ws = new WebSocket(`ws://${host}:8000/ws/live/${sessionId}`);
		socketRef.current = ws;

		ws.onopen = () => {
			setIsConnected(true);
			reconnectAttemptRef.current = 0;
			sendEvent('candidate_connect');
			startMonitoring();
		};

		ws.onmessage = (ev) => {
			const data = JSON.parse(ev.data);
			console.log('[WS] Message:', data.type, data.payload || '');

			if (data.type === 'session_blocked') {
				console.log('[WS] Session blocked:', data.payload, data.reason);
				sessionBlockedRef.current = true;
				setSessionBlocked({
					type: data.payload === 'terminated' ? 'terminated' : 'completed',
					reason: data.reason || 'This session has ended.',
				});
				return;
			}

			if (data.type === 'text') {
				setFeedback((prev) => [...prev, data.payload]);
			} else if (data.type === 'state_update') {
				if (data.payload !== currentStateRef.current) {
					stopPlayback();
					currentStateRef.current = data.payload;
				}
				setCurrentState(data.payload);
				if (typeof data.screenRequired === 'boolean') {
					setScreenActive(data.screenRequired);
				}
				if (data.metadata?.cheat_reason)
					setViolationReason(data.metadata.cheat_reason);
				if (
					(data.payload === 'COMPLETED' || data.payload === 'TERMINATED') &&
					(data.metadata?.terminated_for_cheating ||
						data.metadata?.terminated_screen_loss)
				) {
					setIsTerminated(true);
					isTerminatedRef.current = true;
				}
				if (data.payload === 'SCREEN_NOT_VISIBLE') setScreenLost(true);
				if (data.metadata?.question) setQuestionData(data.metadata.question);
				if (data.violation !== undefined) {
					const violationData = data.violation
						? {
								box_2d: data.violation.box_2d,
								probability: data.violation.probability,
								reason: data.violation.reason,
						  }
						: null;

					if (data.is_webcam) {
						setWebcamViolation(violationData);
					} else {
						setScreenViolation(violationData);
					}
				}
			} else if (data.type === 'scorecard') {
				setScorecardData(data.payload);
			} else if (data.type === 'restore_code') {
				setRestoredCode(data.payload);
			} else if (data.type === 'turn_complete') {
				setIsSpeaking(false);
				isSpeakingRef.current = false;
				setMediaSpeaking(false);
				if (currentStateRef.current === 'GREETING') setGreetingDone(true);
				if (screenShareLostPendingRef.current) {
					screenShareLostPendingRef.current = false;
					send({ type: 'event', payload: 'screen_share_ended' });
				}
			} else if (data.type === 'audio') {
				setIsSpeaking(true);
				isSpeakingRef.current = true;
				setMediaSpeaking(true);
				if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
				speakingTimerRef.current = setTimeout(() => {
					setIsSpeaking(false);
					isSpeakingRef.current = false;
					setMediaSpeaking(false);
				}, 3000);
				playAudio(data.payload);
			}
		};

		ws.onclose = () => {
			setIsConnected(false);
			stopMonitoring();
			if (
				!sessionBlockedRef.current &&
				!isTerminatedRef.current &&
				reconnectAttemptRef.current < 5
			) {
				reconnectAttemptRef.current += 1;
				const delay = Math.min(2000 * reconnectAttemptRef.current, 10000);
				setTimeout(() => connect(), delay);
			}
		};
	}, [
		sessionId,
		send,
		sendEvent,
		startMonitoring,
		stopMonitoring,
		setScreenActive,
		setMediaSpeaking,
		stopPlayback,
		playAudio,
	]);

	const disconnect = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.close();
		}
		stopMedia();
		stopMonitoring();
		setIsConnected(false);
		if (currentState !== 'COMPLETED' && currentState !== 'TERMINATED') {
			stopMedia();
			stopMonitoring();
		}
	}, [currentState, stopMedia, stopMonitoring]);

	const acquireAndStartMedia = useCallback(async () => {
		const streams = await acquireMediaStreams();
		if (streams) {
			setupAudioProcessing(streams.audio);
			setupScreenProcessing(streams.screen);
			sendEvent('screen_share_active');
		}
		return streams;
	}, [acquireMediaStreams, setupAudioProcessing, setupScreenProcessing, sendEvent]);

	return {
		isConnected,
		feedback,
		currentState,
		resetKey,
		greetingDone,
		screenLost,
		isSpeaking,
		isUserSpeaking,
		violationReason,
		tabSwitchWarning,
		isTerminated,
		questionData,
		scorecardData,
		isMuted,
		screenViolation,
		webcamViolation,
		sessionBlocked,
		restoredCode,
		isListening: isConnected && !isSpeaking,
		connect,
		disconnect,
		sendEvent,
		sendCode,
		toggleMute,
		reshareScreen,
		stopScreenShare,
		acquireAndStartMedia,
		setLastCopied: (text: string) => {
			lastCopiedTextRef.current = text;
		},
		getLastCopied: () => lastCopiedTextRef.current,
		webcamStream,
		faceVideoRef,
	};
}
