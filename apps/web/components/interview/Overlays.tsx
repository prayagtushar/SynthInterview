import React from 'react';
import { Monitor, XCircle } from 'lucide-react';

interface OverlaysProps {
	currentState: string;
	isConnected: boolean;
	greetingDone: boolean;
	acquireAndStartMedia: () => void;
	isTerminated: boolean;
}

export const Overlays: React.FC<OverlaysProps> = ({
	currentState,
	isConnected,
	greetingDone,
	acquireAndStartMedia,
	isTerminated,
}) => {
	if (isTerminated) {
		return (
			<div className='flex h-screen bg-[#0d0d0d] items-center justify-center font-mono'>
				<div className='text-center space-y-5 max-w-sm px-6'>
					<XCircle size={52} className='text-red-500 mx-auto' />
					<p className='text-white font-bold text-2xl tracking-tight'>
						Interview Terminated
					</p>
					<p className='text-neutral-400 text-sm leading-relaxed'>
						This interview session was ended due to a policy violation. The
						recruiter has been notified of the result.
					</p>
					<button
						onClick={() => (window.location.href = '/')}
						className='px-5 py-2 bg-white text-black text-xs font-bold rounded hover:bg-gray-200 transition-colors'>
						Return to Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<>
			{currentState === 'GREETING' && isConnected && (
				<div className='absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/85 z-20 gap-5'>
					<div className='flex flex-col items-center text-center space-y-4 max-w-sm bg-[#080808] border border-white/10 p-8 rounded-lg shadow-2xl'>
						<Monitor size={48} className='text-blue-500 mb-2 opacity-80' />
						<h3 className='text-white font-bold text-lg tracking-wide uppercase'>
							Share Screen & Mic
						</h3>
						<p className='text-neutral-400 text-xs leading-relaxed mb-4'>
							{greetingDone
								? 'The interviewer is ready. Share your entire screen and allow microphone access to begin.'
								: 'Please wait — Synth is introducing itself…'}
						</p>
						<button
							onClick={acquireAndStartMedia}
							disabled={!greetingDone}
							className={`w-full px-5 py-2.5 text-xs font-bold uppercase tracking-widest rounded transition-colors flex items-center justify-center gap-2 ${
								greetingDone
									? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
									: 'bg-gray-800 text-gray-600 cursor-not-allowed'
							}`}>
							<Monitor size={14} />
							{greetingDone ? 'Share Screen & Mic' : 'Waiting for Synth…'}
						</button>
					</div>
				</div>
			)}
		</>
	);
};
