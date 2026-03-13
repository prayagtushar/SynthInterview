import React from 'react';
import { Terminal as TerminalIcon, Loader2, ChevronUp, X } from 'lucide-react';
import { RunResult, ExecResult } from '../../lib/types';

interface TerminalProps {
	runResult: RunResult | null;
	execResult: ExecResult | null;
	isRunning: boolean;
	onClose: () => void;
	onClear: () => void;
}

export const Terminal: React.FC<TerminalProps> = ({
	runResult,
	execResult,
	isRunning,
	onClose,
	onClear,
}) => {
	return (
		<div className='h-[200px] shrink-0 border-t border-white/5 bg-[#080810] flex flex-col'>
			<div className='flex items-center justify-between px-3 py-1.5 border-b border-white/5 shrink-0'>
				<div className='flex items-center gap-2'>
					<TerminalIcon size={10} className='text-gray-500' />
					<span className='text-[10px] font-medium text-gray-400'>
						Test Results
					</span>
					{runResult && (
						<span
							className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
								runResult.passed === runResult.total && runResult.total > 0
									? 'bg-green-500/10 text-green-400'
									: runResult.total === 0
										? 'bg-gray-500/10 text-gray-400'
										: 'bg-red-500/10 text-red-400'
							}`}>
							{runResult.total > 0
								? `${runResult.passed}/${runResult.total} passed`
								: 'no tests'}
							{runResult.execTime != null && ` · ${runResult.execTime}ms`}
						</span>
					)}
					{execResult && (
						<span className='text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400'>
							error
						</span>
					)}
					{isRunning && (
						<Loader2 size={10} className='animate-spin text-gray-500' />
					)}
				</div>
				<div className='flex items-center gap-1'>
					<button
						onClick={onClose}
						title='Collapse terminal'
						className='p-0.5 text-gray-600 hover:text-gray-300 rounded transition-colors'>
						<ChevronUp size={12} />
					</button>
					<button
						onClick={onClear}
						title='Close terminal'
						className='p-0.5 text-gray-600 hover:text-gray-300 rounded transition-colors'>
						<X size={12} />
					</button>
				</div>
			</div>

			<div className='flex-1 overflow-auto p-3 font-mono text-[11px] leading-relaxed space-y-1.5'>
				{isRunning && !runResult && !execResult && (
					<span className='text-gray-500 animate-pulse'>$ running tests…</span>
				)}

				{runResult && (
					<>
						{runResult.error && (
							<pre className='text-red-400 whitespace-pre-wrap text-[10px] mb-2'>
								{runResult.error}
							</pre>
						)}
						{runResult.results.length > 0
							? runResult.results.map((r, i) => (
									<div
										key={i}
										className={`flex items-start gap-2 px-2 py-1.5 rounded ${
											r.passed
												? 'bg-green-500/5 border border-green-500/15'
												: 'bg-red-500/5 border border-red-500/15'
										}`}>
										<span
											className={`shrink-0 mt-0.5 ${r.passed ? 'text-green-400' : 'text-red-400'}`}>
											{r.passed ? '✓' : '✗'}
										</span>
										<div className='min-w-0 flex-1'>
											<span
												className={`font-bold ${r.passed ? 'text-green-300' : 'text-red-300'}`}>
												{r.label}
											</span>
											{!r.passed && (
												<div className='mt-0.5 text-[10px] text-gray-500 space-y-0.5'>
													<div>
														<span className='text-gray-600'>got </span>
														<span className='text-red-300'>{r.actual}</span>
													</div>
													<div>
														<span className='text-gray-600'>exp </span>
														<span className='text-green-300/70'>
															{r.expected}
														</span>
													</div>
												</div>
											)}
										</div>
									</div>
								))
							: !runResult.error && (
									<span className='text-gray-600'>
										No auto-executable tests for this question. Run your code
										manually.
									</span>
								)}
					</>
				)}

				{execResult && (
					<>
						{execResult.stderr && (
							<pre className='text-red-400 whitespace-pre-wrap'>
								{execResult.stderr}
							</pre>
						)}
						{execResult.stdout && (
							<pre className='text-green-300 whitespace-pre-wrap'>
								{execResult.stdout}
							</pre>
						)}
						{!execResult.stdout && !execResult.stderr && (
							<span className='text-gray-600'>(no output)</span>
						)}
					</>
				)}
			</div>
		</div>
	);
};
