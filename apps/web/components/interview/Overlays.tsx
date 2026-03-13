import React from 'react';
import { Monitor, XCircle, ShieldBan } from 'lucide-react';

interface OverlaysProps {
	currentState: string;
	isConnected: boolean;
	greetingDone: boolean;
	acquireAndStartMedia: () => void;
	isTerminated: boolean;
	visionViolation: {
		box_2d: [number, number, number, number];
		probability: number;
		reason: string;
	} | null;
	sessionBlocked: {
		type: 'terminated' | 'completed';
		reason: string;
	} | null;
}

export const Overlays: React.FC<OverlaysProps> = ({
	currentState,
	isConnected,
	greetingDone,
	acquireAndStartMedia,
	isTerminated,
	visionViolation,
	sessionBlocked,
}) => {
	// Blocked session screen (terminated or completed)
	if (sessionBlocked) {
		return (
			<div className='flex h-screen bg-slate-950 items-center justify-center font-mono'>
				<div className='text-center space-y-6 max-w-md px-8 py-10 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl relative overflow-hidden'>
					<div
						className={`absolute top-0 left-0 w-full h-1 ${sessionBlocked.type === 'terminated' ? 'bg-rose-500' : 'bg-slate-500'}`}
					/>
					{sessionBlocked.type === 'terminated' ? (
						<ShieldBan size={52} className='text-rose-500 mx-auto' />
					) : (
						<XCircle size={52} className='text-slate-400 mx-auto' />
					)}
					<p className='text-slate-100 font-bold text-2xl tracking-tight'>
						{sessionBlocked.type === 'terminated'
							? 'Session Permanently Blocked'
							: 'Interview Completed'}
					</p>
					<p className='text-slate-400 text-sm leading-relaxed'>
						{sessionBlocked.reason}
					</p>
					<p className='text-[10px] text-slate-600 uppercase tracking-widest font-bold'>
						This link can no longer be used
					</p>
					<button
						onClick={() => (window.location.href = '/')}
						className='w-full py-3 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all'>
						Return to Home
					</button>
				</div>
			</div>
		);
	}

	if (isTerminated) {
		return (
			<div className='flex h-screen bg-slate-950 items-center justify-center font-mono'>
				<div className='text-center space-y-6 max-w-sm px-8 py-10 bg-slate-900 border border-rose-500/20 rounded-2xl shadow-2xl relative overflow-hidden'>
					<div className='absolute top-0 left-0 w-full h-1 bg-rose-500' />
					<XCircle size={52} className='text-rose-500 mx-auto' />
					<p className='text-slate-100 font-bold text-2xl tracking-tight'>
						Interview Terminated
					</p>
					<p className='text-slate-400 text-sm leading-relaxed'>
						This interview session was ended due to a policy violation. The
						recruiter has been notified of the result.
					</p>
					<button
						onClick={() => (window.location.href = '/')}
						className='w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all'>
						Return to Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<>
			{currentState === 'GREETING' && isConnected && (
				<div className='absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 gap-5 backdrop-blur-sm'>
					<div className='flex flex-col items-center text-center space-y-4 max-w-sm bg-slate-900 border border-indigo-500/20 p-10 rounded-2xl shadow-2xl relative overflow-hidden'>
						<div
							className={`absolute top-0 left-0 w-full h-1 transition-all duration-1000 ${greetingDone ? 'bg-indigo-500' : 'bg-slate-700 animate-pulse'}`}
						/>
						<Monitor size={48} className='text-indigo-500 mb-2 opacity-80' />
						<h3 className='text-slate-100 font-bold text-lg tracking-wide uppercase'>
							Share Screen & Mic
						</h3>
						<p className='text-slate-400 text-xs leading-relaxed mb-4'>
							{greetingDone
								? 'The AI is ready. Share your entire screen and allow microphone access to begin.'
								: 'Please wait — Synth is introducing itself…'}
						</p>
						<button
							onClick={acquireAndStartMedia}
							disabled={!greetingDone}
							className={`w-full px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${
								greetingDone
									? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-[0_0_15px_rgba(79,70,229,0.3)]'
									: 'bg-slate-800 text-slate-600 cursor-not-allowed'
							}`}>
							<Monitor size={14} />
							{greetingDone ? 'Share Screen & Mic' : 'Waiting for Synth…'}
						</button>
					</div>
				</div>
			)}
			{/* Vision Proctor Bounding Box Overlay */}
			{visionViolation && visionViolation.box_2d && !isTerminated && (
				<div className='absolute inset-0 pointer-events-none z-50'>
					{(() => {
						const [ymin, xmin, ymax, xmax] = visionViolation.box_2d;
						// Gemini normalized coordinates are 0-1000
						const top = `${ymin / 10}%`;
						const left = `${xmin / 10}%`;
						const width = `${(xmax - xmin) / 10}%`;
						const height = `${(ymax - ymin) / 10}%`;

						return (
							<div
								className='absolute border-2 border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-500 ease-out flex flex-col items-start'
								style={{ top, left, width, height }}>
								{/* Probability Meter */}
								<div className='absolute -top-10 left-0 bg-rose-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2 whitespace-nowrap shadow-xl'>
									<div className='w-1.5 h-1.5 bg-white rounded-full animate-ping' />
									AI Proctor: Violation Probability{' '}
									{(visionViolation.probability * 100).toFixed(0)}%
								</div>

								{/* Hover Reason */}
								<div className='mt-auto bg-rose-600/90 p-2 text-[9px] text-white font-medium leading-tight'>
									{visionViolation.reason}
								</div>
							</div>
						);
					})()}
				</div>
			)}
		</>
	);
};
