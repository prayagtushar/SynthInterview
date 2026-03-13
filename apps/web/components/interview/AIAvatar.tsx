import React from 'react';

interface AIAvatarProps {
	isSpeaking: boolean;
	isUserSpeaking: boolean;
	isConnected: boolean;
}

export const AIAvatar: React.FC<AIAvatarProps> = ({
	isSpeaking,
	isUserSpeaking,
	isConnected,
}) => {
	return (
		<div className='px-4 py-4 border-b border-white/5 shrink-0'>
			<div className='flex items-center gap-3'>
				<div className='relative'>
					<div
						className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center border transition-all duration-300 ${
							isSpeaking
								? 'border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
								: 'border-white/10'
						}`}>
						<span className='text-sm font-black text-white/90'>S</span>
					</div>
					{isSpeaking && (
						<>
							<div className='absolute inset-0 rounded-full border-2 border-purple-400/40 animate-ping' />
							<div className='absolute inset-[-4px] rounded-full border border-purple-400/20 animate-pulse' />
						</>
					)}
				</div>
				<div className='flex-1 min-w-0'>
					<p className='text-xs font-bold text-white tracking-wide'>Synth</p>
					<p className='text-[10px] font-medium'>
						{isSpeaking ? (
							<span className='text-purple-400'>Speaking…</span>
						) : isUserSpeaking ? (
							<span className='text-green-400'>Listening to you…</span>
						) : isConnected ? (
							<span className='text-gray-500'>Your turn to speak</span>
						) : (
							<span className='text-gray-600'>Offline</span>
						)}
					</p>
				</div>
				<div className='flex items-end gap-[2px] h-5'>
					{[10, 16, 8, 18, 12].map((h, i) => (
						<div
							key={i}
							className={`w-[3px] rounded-full transition-all duration-300 ${
								isSpeaking
									? 'bg-purple-400/80 animate-pulse'
									: isUserSpeaking
										? 'bg-green-400/70 animate-pulse'
										: 'bg-white/10'
							}`}
							style={{
								height: isSpeaking || isUserSpeaking ? `${h}px` : '4px',
								animationDelay: `${i * 80}ms`,
							}}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
