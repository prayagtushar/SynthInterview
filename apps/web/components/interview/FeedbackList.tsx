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
		<div ref={feedbackRef} className='flex-1 overflow-y-auto p-4 space-y-3'>
			{feedback.length === 0 ? (
				<div className='border border-dashed border-white/10 rounded p-4 mt-4'>
					<p className='text-[10px] text-gray-600 text-center italic leading-relaxed'>
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
						className='bg-white/[0.03] border border-white/5 rounded p-3 space-y-1'>
						<p className='text-[11px] leading-relaxed text-gray-300'>{msg}</p>
						<span className='text-[9px] text-gray-600 uppercase tracking-widest'>
							{i === 0 ? 'just now' : `${i * 15}s ago`} · SYNTH
						</span>
					</div>
				))
			)}
		</div>
	);
};
