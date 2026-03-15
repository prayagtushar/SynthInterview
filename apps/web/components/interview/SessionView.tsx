'use client';

import React, {
	useState,
	useMemo,
	useRef,
	useEffect,
	useCallback,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { type OnMount } from '@monaco-editor/react';
import { useInterview } from '../../lib/useInterview';
import {
	LANGUAGES,
	DEFAULT_CODE,
	STATE_COLORS,
	STATE_ICONS,
	MANUAL_TRANSITIONS,
} from '../../lib/constants';
import { ScorecardData, RunResult } from '../../lib/types';
import { generateProblemComments } from '../../lib/interviewUtils';

// Sub-components
import { Sidebar } from './Sidebar';
import { Header, Banners } from './Header';
import { EditorPanel } from './EditorPanel';
import { RightPanel } from './RightPanel';
import { Overlays } from './Overlays';

export default function SessionView() {
	const searchParams = useSearchParams();
	const sessionId = useMemo(
		() => searchParams.get('id') || 'default-session',
		[searchParams],
	);

	const {
		isConnected,
		feedback,
		currentState,
		screenLost,
		isSpeaking,
		isUserSpeaking,
		violationReason,
		tabSwitchWarning,
		isTerminated,
		questionData,
		scorecardData,
		isMuted,
		resetKey,
		greetingDone,
		screenViolation,
		webcamViolation,
		sessionBlocked,
		restoredCode,
		testCases,
		structuredTests,
		questionPattern,
		connect,
		disconnect,
		sendEvent,
		sendCode,
		toggleMute,
		setLastCopied,
		getLastCopied,
		reshareScreen,
		stopScreenShare,
		acquireAndStartMedia,
		webcamStream,
		faceVideoRef,
	} = useInterview(sessionId);

	// Additional Cheat Detections: Disable Context Menu and Track Mouse Leaves
	useEffect(() => {
		const handleContextMenu = (e: MouseEvent) => {
			if (currentState === 'CODING' || currentState === 'PROBLEM_DELIVERY') {
				e.preventDefault();
				sendEvent('cheating_attempt', {
					reason: 'Right-click context menu blocked',
				});
			}
		};

		const handleMouseLeave = (e: MouseEvent) => {
			if (
				e.clientY <= 0 ||
				e.clientX <= 0 ||
				e.clientX >= window.innerWidth ||
				e.clientY >= window.innerHeight
			) {
				if (currentState === 'CODING' || currentState === 'THINK_TIME') {
					sendEvent('cheating_attempt', {
						reason: 'Mouse left the interview window',
					});
				}
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (!document.hasFocus() && e.key.length === 1) {
				if (currentState === 'CODING' || currentState === 'THINK_TIME') {
					sendEvent('cheating_attempt', {
						reason: 'Typing detected outside of interview window bounds',
					});
				}
			}
		};

		document.addEventListener('contextmenu', handleContextMenu);
		document.addEventListener('mouseleave', handleMouseLeave);
		document.addEventListener('keydown', handleKeyDown);

		return () => {
			document.removeEventListener('contextmenu', handleContextMenu);
			document.removeEventListener('mouseleave', handleMouseLeave);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [currentState, sendEvent]);

	// Sync scorecard from WebSocket into local state
	useEffect(() => {
		if (scorecardData) {
			setScorecard(scorecardData);
			setActiveTab('scorecard');
		}
	}, [scorecardData]);

	// Reset all local editor/session state when a new session begins
	useEffect(() => {
		if (resetKey === 0) return; // skip initial mount
		setCode(DEFAULT_CODE['javascript']);
		setLanguage('javascript');
		setRunResult(null);
		setShowTerminal(false);
		setScorecard(null);
		setActiveTab('feedback');
		lastInjectedQuestionId.current = null;
		problemHeaderLines.current = 0;
	}, [resetKey]); // eslint-disable-line react-hooks/exhaustive-deps

	// Restore code from server on reconnection
	useEffect(() => {
		if (restoredCode) {
			console.log(
				'[Editor] Restoring code from server:',
				restoredCode.length,
				'chars',
			);
			setCode(restoredCode);
		}
	}, [restoredCode]);

	const [activeTab, setActiveTab] = useState<'feedback' | 'scorecard'>(
		'feedback',
	);
	const [language, setLanguage] = useState('javascript');
	const [showLangMenu, setShowLangMenu] = useState(false);
	const [code, setCode] = useState(DEFAULT_CODE['javascript']);
	const [cursorPosition, setCursorPosition] = useState({ line: 1, col: 1 });
	const feedbackRef = useRef<HTMLDivElement>(null);
	const modelsLoadedRef = useRef(false);

	// Track current state in a ref for Monaco paste handler closure
	const currentStateForPaste = useRef(currentState);
	const editorRef = useRef<any>(null);
	const problemHeaderLines = useRef(0); // number of read-only problem comment lines
	const lastInjectedQuestionId = useRef<string | null>(null); // track which question was injected
	const typingSignalTimer = useRef<NodeJS.Timeout | null>(null); // debounce typing signals
	const isInjecting = useRef(false); // true while programmatic code injection is in flight

	// Code execution state
	const [isRunning, setIsRunning] = useState(false);
	const [runResult, setRunResult] = useState<RunResult | null>(null);
	const [showTerminal, setShowTerminal] = useState(false);
	const [scorecard, setScorecard] = useState<ScorecardData | null>(null);

	// Keep paste-handler ref in sync with currentState
	useEffect(() => {
		currentStateForPaste.current = currentState;
	}, [currentState]);

	// Auto-scroll feedback to top (newest first)
	useEffect(() => {
		if (feedbackRef.current) {
			feedbackRef.current.scrollTop = 0;
		}
	}, [feedback]);

	const { stateColor, stateIcon, transitions, currentLang, lineCount, charCount } =
		useMemo(
			() => ({
				stateColor: STATE_COLORS[currentState] || 'bg-gray-800 text-gray-400',
				stateIcon: STATE_ICONS[currentState] || STATE_ICONS.IDLE,
				transitions: MANUAL_TRANSITIONS[currentState] || [],
				currentLang: LANGUAGES.find((l) => l.id === language) || LANGUAGES[0],
				lineCount: code.split('\n').length,
				charCount: code.length,
			}),
			[currentState, language, code],
		);

	// Debounced typing signal — resets silence timer in agent (no agent speech)
	const handleTyping = useCallback(() => {
		if (!isConnected) return;
		if (typingSignalTimer.current) return; // already debounced
		typingSignalTimer.current = setTimeout(() => {
			sendEvent('candidate_signal', { signal: 'typing' });
			typingSignalTimer.current = null;
		}, 2000); // send once per 2s of typing activity
	}, [isConnected, sendEvent]);

	// Language switching handler
	const switchLanguage = useCallback(
		(langId: string) => {
			setLanguage(langId);
			// Re-generate code with problem header if question was already injected
			if (lastInjectedQuestionId.current && questionData) {
				const header = generateProblemComments(questionData, langId);
				const starterCode =
					(questionData as any).starterCode?.[langId] ||
					DEFAULT_CODE[langId] ||
					'';
				isInjecting.current = true;
				setCode(header + starterCode);
				problemHeaderLines.current = header.split('\n').length;
				setTimeout(() => {
					isInjecting.current = false;
				}, 200);
			} else {
				setCode(DEFAULT_CODE[langId] || '');
			}
			setShowLangMenu(false);
		},
		[questionData],
	);

	// ---------- Backend test-case execution ----------
	const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

	const runCode = useCallback(async () => {
		setIsRunning(true);
		setShowTerminal(true);
		setRunResult(null);
		const t0 = Date.now();

		try {
			const res = await fetch(`${API_BASE}/sessions/${sessionId}/run-code`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code, language }),
			});
			if (!res.ok) throw new Error(`API error ${res.status}`);
			const data: RunResult = await res.json();
			data.execTime = Date.now() - t0;
			setRunResult(data);

			// Feed results to SYNTH
			if (isConnected) {
				const summary = data.error
					? `Candidate ran code — error: ${data.error.slice(0, 200)}`
					: `Candidate ran tests: ${data.passed}/${data.total} passed.${
							data.results.some((r) => !r.passed)
								? ' Failing: ' +
									data.results
										.filter((r) => !r.passed)
										.map(
											(r) =>
												`${r.label} (got ${r.actual}, expected ${r.expected})`,
										)
										.slice(0, 2)
										.join('; ')
								: ' All tests passed!'
						}`;
				sendEvent('candidate_signal', { signal: summary });
			}
		} catch (err) {
			setRunResult({
				passed: 0,
				total: 0,
				results: [],
				error: err instanceof Error ? err.message : 'Unknown execution error',
				execTime: Date.now() - t0,
			});
		} finally {
			setIsRunning(false);
		}
	}, [code, language, sessionId, isConnected, sendEvent, API_BASE]);

	// Inject problem into editor when PROBLEM_DELIVERY state is reached (or new question)
	useEffect(() => {
		if (currentState !== 'PROBLEM_DELIVERY' || !questionData) return;
		// Use question ID to detect transitions between questions
		const qid = (questionData as any).id || questionData.title;
		if (lastInjectedQuestionId.current === qid) return; // already injected this question
		lastInjectedQuestionId.current = qid;

		const header = generateProblemComments(questionData, language);
		const starterCode =
			(questionData as any).starterCode?.[language] ||
			DEFAULT_CODE[language] ||
			'';
		const fullCode = header + starterCode;
		// Mark injection in progress so onDidChangeModelContent doesn't undo it
		isInjecting.current = true;
		setCode(fullCode);
		problemHeaderLines.current = header.split('\n').length;
		setRunResult(null);

		// Reset injection flag and position cursor after Monaco processes the change
		setTimeout(() => {
			isInjecting.current = false;
			const editor = editorRef.current;
			if (!editor) return;
			const editableStartLine = problemHeaderLines.current + 1;
			editor.setPosition({ lineNumber: editableStartLine, column: 1 });
			editor.revealLineInCenter(editableStartLine);
		}, 200);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentState, questionData, language]);

	// Monaco custom theme + editor setup
	const handleEditorMount: OnMount = useCallback(
		(editor, monaco) => {
			editorRef.current = editor;

			// Custom dark theme
			monaco.editor.defineTheme('synth-dark', {
				base: 'vs-dark',
				inherit: true,
				rules: [
					{ token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
					{ token: 'keyword', foreground: '60a5fa' },
					{ token: 'string', foreground: '86efac' },
					{ token: 'number', foreground: 'fbbf24' },
					{ token: 'type', foreground: '67e8f9' },
					{ token: 'function', foreground: '93c5fd' },
					{ token: 'variable', foreground: 'e2e8f0' },
				],
				colors: {
					'editor.background': '#09090b',
					'editor.foreground': '#e2e8f0',
					'editor.lineHighlightBackground': '#ffffff08',
					'editor.selectionBackground': '#3b82f640',
					'editor.inactiveSelectionBackground': '#3b82f620',
					'editorCursor.foreground': '#38bdf8',
					'editorLineNumber.foreground': '#334155',
					'editorLineNumber.activeForeground': '#94a3b8',
					'editorIndentGuide.background': '#1e293b40',
					'editorIndentGuide.activeBackground': '#334155',
					'editorWidget.background': '#0f172a',
					'editorWidget.border': '#1e293b',
					'editorSuggestWidget.background': '#0f172a',
					'editorSuggestWidget.border': '#1e293b',
					'editorSuggestWidget.selectedBackground': '#1e293b',
				},
			});
			monaco.editor.setTheme('synth-dark');

			// Track cursor position
			editor.onDidChangeCursorPosition((e: any) => {
				setCursorPosition({
					line: e.position.lineNumber,
					col: e.position.column,
				});
			});

			// Protected signature: undo edits in the header region
			// isInjecting.current is set when code is injected programmatically — skip the guard then
			editor.onDidChangeModelContent((e: any) => {
				if (isInjecting.current) return; // programmatic injection — never undo
				if (problemHeaderLines.current === 0) return;
				for (const change of e.changes) {
					if (change.range.startLineNumber <= problemHeaderLines.current) {
						editor.trigger('keyboard', 'undo', null);
						console.warn('[Editor] Function signature is read-only.');
						break;
					}
				}
			});

			// Track large pastes as silent cheat events (no agent prompt)
			editor.onDidPaste((e: any) => {
				const pastedText = editor.getModel()?.getValueInRange(e.range) ?? '';
				if (pastedText.length > 100) {
					const lastCopied = getLastCopied();
					if (lastCopied && pastedText === lastCopied) return; // own copy, not external
					sendEvent('candidate_signal', {
						signal: 'paste',
						charCount: pastedText.length,
					});
				}
			});

			// Track copy actions
			editor.addAction({
				id: 'track-copy',
				label: 'Track Copy',
				keybindings: [],
				contextMenuGroupId: '9_cutcopypaste',
				run: (ed: any) => {
					const selection = ed.getSelection();
					if (selection) {
						const selectedText =
							ed.getModel()?.getValueInRange(selection) ?? '';
						if (selectedText) setLastCopied(selectedText);
					}
				},
			});

			const editorDom = editor.getDomNode();
			if (editorDom) {
				editorDom.addEventListener('copy', () => {
					const selection = editor.getSelection();
					if (selection) {
						const text = editor.getModel()?.getValueInRange(selection) ?? '';
						if (text) setLastCopied(text);
					}
				});
				editorDom.addEventListener('cut', () => {
					const selection = editor.getSelection();
					if (selection) {
						const text = editor.getModel()?.getValueInRange(selection) ?? '';
						if (text) setLastCopied(text);
					}
				});
			}
		},
		[setLastCopied],
	);

	return (
		<div
			className={`min-h-[100dvh] bg-[#020202] text-slate-100 flex font-sans selection:bg-blue-500/30 selection:text-white ${
				isConnected ? 'cursor-default' : 'cursor-wait'
			}`}
		>
			<div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.05),transparent_50%)] pointer-events-none" />

			<Overlays
				currentState={currentState}
				isConnected={isConnected}
				greetingDone={greetingDone}
				acquireAndStartMedia={acquireAndStartMedia}
				isTerminated={isTerminated}
				screenViolation={screenViolation}
				webcamViolation={webcamViolation}
				sessionBlocked={sessionBlocked}
			/>

			<Sidebar
				isMuted={isMuted}
				toggleMute={toggleMute}
				screenLost={screenLost}
				isConnected={isConnected}
				reshareScreen={reshareScreen}
				stopScreenShare={stopScreenShare}
			/>

			<div className="flex-1 flex flex-col min-w-0">
				<Header
					currentState={currentState}
					stateIcon={stateIcon}
					stateColor={stateColor}
					isSpeaking={isSpeaking}
					isUserSpeaking={isUserSpeaking}
					isConnected={isConnected}
					connect={connect}
					disconnect={disconnect}
				/>

				<Banners
					isSpeaking={isSpeaking}
					isUserSpeaking={isUserSpeaking}
					screenLost={screenLost}
					tabSwitchWarning={tabSwitchWarning}
					currentState={currentState}
					violationReason={violationReason}
					reshareScreen={reshareScreen}
					sendEvent={sendEvent}
				/>

				<div className="flex-1 flex min-h-0 relative">
					<EditorPanel
						language={language}
						code={code}
						setCode={setCode}
						sendCode={sendCode}
						onTyping={handleTyping}
						handleEditorMount={handleEditorMount}
						currentLang={currentLang}
						lineCount={lineCount}
						charCount={charCount}
						cursorPosition={cursorPosition}
						isConnected={isConnected}
						currentState={currentState}
						isRunning={isRunning}
						runCode={runCode}
						showTerminal={showTerminal}
						setShowTerminal={setShowTerminal}
						runResult={runResult}
						structuredTests={structuredTests}
						showLangMenu={showLangMenu}
						setShowLangMenu={setShowLangMenu}
						switchLanguage={switchLanguage}
					/>

					<RightPanel
						isSpeaking={isSpeaking}
						isUserSpeaking={isUserSpeaking}
						isConnected={isConnected}
						activeTab={activeTab}
						setActiveTab={setActiveTab}
						transitions={transitions}
						acquireAndStartMedia={acquireAndStartMedia}
						sendEvent={sendEvent}
						feedback={feedback}
						feedbackRef={feedbackRef}
						scorecard={scorecard}
						currentState={currentState}
						sessionId={sessionId}
					/>
				</div>
			</div>

			{webcamStream && (
				<div className="absolute bottom-8 right-8 z-[60] overflow-hidden rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(59,130,246,0.1)] w-56 h-40 bg-slate-900 group/webcam transition-all duration-300 hover:scale-105 hover:border-blue-500/50">
					<div className="absolute top-3 left-3 z-[61] px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[8px] font-bold text-white tracking-widest opacity-0 group-hover/webcam:opacity-100 transition-opacity uppercase">
						Active Proctor feed
					</div>
					<video
						className="w-full h-full object-cover transform scale-x-[-1]"
						ref={(node) => {
							if (node) {
								// @ts-ignore - binding to ref from useMedia
								faceVideoRef.current = node;
								if (node.srcObject !== webcamStream) {
									node.srcObject = webcamStream;
								}
							}
						}}
						autoPlay
						playsInline
						muted
					/>
				</div>
			)}
		</div>
	);
}
