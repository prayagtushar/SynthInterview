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
	const [isTerminated, setIsTerminated] = useState(false);
	const [resetKey, setResetKey] = useState(0);
	const [greetingDone, setGreetingDone] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [questionData, setQuestionData] = useState<QuestionData | null>(null);
	const [scorecardData, setScorecardData] = useState<ScorecardData | null>(
		null,
	);

	const socketRef = useRef<WebSocket | null>(null);
	const isSpeakingRef = useRef(false);
	const isMutedRef = useRef(false);
	const screenShareLostPendingRef = useRef(false);
	const codeSyncTimerRef = useRef<NodeJS.Timeout | null>(null);
	const lastCopiedTextRef = useRef<string>('');
	const beforeUnloadRef = useRef<(() => void) | null>(null);
	const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
	const vadSilenceTimerRef = useRef<NodeJS.Timeout | null>(null);

	const { playAudio, stopPlayback } = useAudioPlayback();

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
		onFrameData: (b64) => send({ type: 'frame', payload: b64 }),
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
			setTabSwitchWarning({ count, max: 2 });
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
		setIsTerminated(false);
		setQuestionData(null);
		setScorecardData(null);
		setGreetingDone(false);
		setIsMuted(false);
		isMutedRef.current = false;
		setResetKey((k) => k + 1);

		const ws = new WebSocket(`ws://localhost:8000/ws/live/${sessionId}`);
		socketRef.current = ws;

		ws.onopen = () => {
			setIsConnected(true);
			sendEvent('candidate_connect');
			startMonitoring();
		};

		ws.onmessage = (ev) => {
			const data = JSON.parse(ev.data);

			if (data.type === 'text') {
				setFeedback((prev) => [...prev, data.payload]);
			} else if (data.type === 'state_update') {
				setCurrentState(data.payload);
				if (typeof data.screenRequired === 'boolean') {
					setScreenActive(data.screenRequired);
				}
				if (data.metadata?.cheat_reason)
					setViolationReason(data.metadata.cheat_reason);
				if (
					data.payload === 'COMPLETED' &&
					(data.metadata?.terminated_for_cheating ||
						data.metadata?.terminated_screen_loss)
				) {
					setIsTerminated(true);
				}
				if (data.payload === 'SCREEN_NOT_VISIBLE') setScreenLost(true);
				if (data.metadata?.question) setQuestionData(data.metadata.question);
				stopPlayback();
			} else if (data.type === 'scorecard') {
				setScorecardData(data.payload);
			} else if (data.type === 'turn_complete') {
				setIsSpeaking(false);
				isSpeakingRef.current = false;
				setMediaSpeaking(false);
				if (currentState === 'GREETING') setGreetingDone(true);
				if (screenShareLostPendingRef.current) {
					screenShareLostPendingRef.current = false;
					send({ type: 'event', payload: 'screen_share_ended' });
				}
			} else if (data.type === 'audio') {
				setIsSpeaking(true);
				isSpeakingRef.current = true;
				setMediaSpeaking(true);
				if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
				speakingTimerRef.current = setTimeout(() => setIsSpeaking(false), 3000);
				playAudio(data.payload);
			}
		};

		ws.onclose = () => {
			setIsConnected(false);
			stopMonitoring();
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
		currentState,
	]);

	const disconnect = useCallback(() => {
		if (
			socketRef.current?.readyState === WebSocket.OPEN &&
			ACTIVE_STATES.has(currentState)
		) {
			socketRef.current.send(
				JSON.stringify({ type: 'event', payload: 'end_interview' }),
			);
		}
		socketRef.current?.close();
		stopMedia();
		stopMonitoring();
		setIsConnected(false);
	}, [currentState, stopMedia, stopMonitoring]);

	const acquireAndStartMedia = useCallback(async () => {
		const ok = await acquireMediaStreams();
		if (!ok) return;

		if (mediaStream && screenStream) {
			await setupAudioProcessing(mediaStream);
			setupScreenProcessing(screenStream);
			sendEvent('screen_share_active');
		}
	}, [
		acquireMediaStreams,
		setupAudioProcessing,
		setupScreenProcessing,
		sendEvent,
		mediaStream,
		screenStream,
	]);

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
	};
}
