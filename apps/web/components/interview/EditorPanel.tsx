import React from 'react';
import dynamic from 'next/dynamic';
import { type OnMount } from '@monaco-editor/react';
import {
	Hash,
	Keyboard,
	Play,
	Loader2,
	Sparkles,
	Terminal as TerminalIcon,
} from 'lucide-react';
import { LANGUAGES } from '../../lib/constants';
import { RunResult } from '../../lib/types';
import { LanguageSelector } from './LanguageSelector';
import { Terminal } from './TerminalPanel';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface EditorPanelProps {
	language: string;
	code: string;
	setCode: (code: string) => void;
	sendCode: (code: string) => void;
	onTyping: () => void;
	handleEditorMount: OnMount;
	currentLang: (typeof LANGUAGES)[number];
	lineCount: number;
	charCount: number;
	cursorPosition: { line: number; col: number };
	isConnected: boolean;
	currentState: string;
	isRunning: boolean;
	runCode: () => void;
	showTerminal: boolean;
	setShowTerminal: React.Dispatch<React.SetStateAction<boolean>>;
	runResult: RunResult | null;
	structuredTests: any[];
	showLangMenu: boolean;
	setShowLangMenu: (show: boolean) => void;
	switchLanguage: (langId: string) => void;
	setRunResult: (res: RunResult | null) => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
	language,
	code,
	setCode,
	sendCode,
	onTyping,
	handleEditorMount,
	currentLang,
	lineCount,
	charCount,
	cursorPosition,
	isConnected,
	currentState,
	isRunning,
	runCode,
	showTerminal,
	setShowTerminal,
	runResult,
	structuredTests,
	showLangMenu,
	setShowLangMenu,
	switchLanguage,
	setRunResult,
}) => {
	return (
		<div className='flex-[3] min-w-0 border-r border-white/5 flex flex-col bg-black relative group'>
			<div className='h-12 flex items-center justify-between px-6 border-b border-white/5 bg-black shrink-0'>
				<div className='flex items-center gap-6'>
					<LanguageSelector
						currentLang={currentLang}
						showLangMenu={showLangMenu}
						setShowLangMenu={setShowLangMenu}
						switchLanguage={switchLanguage}
						language={language}
					/>

					<div className='h-4 w-[1px] bg-white/10' />

					<div className='flex items-center gap-2 group/badge'>
						<span className='text-[10px] text-white/40 font-black uppercase tracking-widest group-hover/badge:text-white transition-colors'>
							source.
							<span className='text-white group-hover/badge:text-white'>
								{currentLang.ext.replace('.', '')}
							</span>
						</span>
					</div>
				</div>

				<div className='flex items-center gap-8'>
					<div className='flex items-center gap-6 text-[10px] font-black uppercase tracking-widest'>
						<div className='text-white/20'>
							POS{' '}
							<span className='text-white/60 ml-1'>
								{cursorPosition.line}:{cursorPosition.col}
							</span>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						{runResult && (
							<button
								onClick={() => setShowTerminal((v) => !v)}
								title={showTerminal ? 'Hide terminal' : 'Show terminal'}
								className={`flex items-center gap-2 px-3 py-1.5 border transition-all duration-200 text-[10px] font-black uppercase tracking-[0.15em] ${
									showTerminal
										? 'border-white/20 bg-white/10 text-white'
										: runResult.passed === runResult.total &&
											  runResult.total > 0
											? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
											: 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
								}`}>
								<TerminalIcon size={11} />
								{runResult.total > 0
									? `${runResult.passed}/${runResult.total}`
									: 'Output'}
							</button>
						)}
						<button
							onClick={runCode}
							disabled={isRunning || !isConnected}
							className={`flex items-center gap-3 px-6 py-1.5 transition-all duration-300 outline-none text-[10px] font-black uppercase tracking-[0.2em]
                ${
									isRunning
										? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
										: 'bg-white text-black hover:bg-[#eee] active:scale-95 shadow-[0_10px_20px_-5px_rgba(255,255,255,0.1)]'
								}`}>
							{isRunning ? (
								<Loader2 size={12} className='animate-spin' />
							) : (
								<Play size={12} fill='currentColor' />
							)}
							{isRunning ? 'Executing' : 'Execute Solution'}
						</button>
					</div>
				</div>
			</div>

			<div className='flex-1 min-h-0 flex flex-col relative bg-[#030303]'>
				<div className='absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none z-10' />

				<div className={showTerminal ? 'flex-1 min-h-0' : 'h-full'}>
					<Editor
						height='100%'
						language={language}
						value={code}
						theme='synth-dark'
						onChange={(val) => {
							const newCode = val || '';
							setCode(newCode);
							sendCode(newCode);
							onTyping();
						}}
						onMount={(editor, monaco) => {
							handleEditorMount(editor, monaco);
							// Set custom theme colors if needed (monaco handles it via defineTheme usually)
						}}
						options={{
							fontSize: 15,
							minimap: { enabled: false },
							scrollBeyondLastLine: false,
							padding: { top: 20, bottom: 20 },
							fontFamily: '"JetBrains Mono", "Fira Code", monospace',
							fontLigatures: true,
							lineNumbers: 'on',
							renderLineHighlight: 'all',
							cursorBlinking: 'expand',
							cursorSmoothCaretAnimation: 'on',
							smoothScrolling: true,
							bracketPairColorization: { enabled: true },
							autoClosingBrackets: 'always',
							autoClosingQuotes: 'always',
							autoIndent: 'full',
							formatOnPaste: true,
							renderWhitespace: 'selection',
							folding: true,
							lineDecorationsWidth: 10,
							lineNumbersMinChars: 3,
							quickSuggestions: false,
							suggestOnTriggerCharacters: false,
							wordBasedSuggestions: 'off',
							parameterHints: { enabled: false },
							overviewRulerLanes: 0,
							hideCursorInOverviewRuler: true,
							scrollbar: {
								vertical: 'visible',
								horizontal: 'hidden',
								useShadows: false,
								verticalHasArrows: false,
								horizontalHasArrows: false,
								verticalScrollbarSize: 10,
							},
						}}
					/>
				</div>

				{showTerminal && (
					<Terminal
						runResult={runResult}
						execResult={
							runResult
								? {
										stdout: runResult.stdout || '',
										stderr: runResult.stderr || '',
										exitCode: runResult.error ? 1 : 0,
									}
								: null
						}
						isRunning={isRunning}
						onClose={() => setShowTerminal(false)}
						onClear={() => {
							setRunResult(null);
							setShowTerminal(false);
						}}
					/>
				)}
			</div>
		</div>
	);
};
