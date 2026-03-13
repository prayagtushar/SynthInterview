import React from 'react';

interface FeedbackListProps {
	feedback: string[];
	feedbackRef: React.RefObject<HTMLDivElement | null>;
	isConnected: boolean;
	isSpeaking: boolean;
}

export const FeedbackList: React.FC<FeedbackListProps> = ({
	feedback,
	feedbackRef,
	isConnected,
	isSpeaking,
}) => {
	return (
		<div ref={feedbackRef} className='flex-1 overflow-y-auto p-4 space-y-4'>
			{feedback.length === 0 ? (
				<div className='border border-dashed border-indigo-500/10 rounded-lg p-6 mt-4 bg-indigo-500/5'>
					<p className='text-[10px] text-slate-500 text-center italic leading-relaxed'>
						{isConnected
							? isSpeaking
								? 'Synth is speaking…'
								: 'Synth is listening…'
							: 'Start the interview to begin.'}
					</p>
				</div>
			) : (
				[...feedback].reverse().map((msg, i) => (
					<div
						key={i}
						className='group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/30 rounded-lg p-4 space-y-2 transition-all duration-300'>
						<p className='text-[11px] leading-relaxed text-slate-300 group-hover:text-slate-200 transition-colors'>
							{msg}
						</p>
						<div className='flex items-center gap-2'>
							<div className='h-px flex-1 bg-slate-800 group-hover:bg-indigo-500/20 transition-colors' />
							<span className='text-[8px] text-slate-600 uppercase tracking-widest font-bold'>
								{i === 0 ? 'just now' : `${i * 15}s ago`} · SYNTH
							</span>
						</div>
					</div>
				))
			)}
		</div>
	);
};
