'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from 'lucide-react';

export default function RecruiterDashboard() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [config, setConfig] = useState({
		candidateEmail: '',
		difficulty: 'Medium',
		topics: 'React, Node.js, Algorithms',
		timeLimit: '45',
	});
	const [sessionData, setSessionData] = useState<any>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const response = await fetch('http://localhost:8000/sessions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					candidateEmail: config.candidateEmail,
					difficulty: config.difficulty,
					topics: config.topics.split(',').map((t) => t.trim()),
					timeLimit: parseInt(config.timeLimit),
				}),
			});

			if (response.ok) {
				const data = await response.json();
				setSessionData(data);
			} else {
				alert('Failed to create session');
			}
		} catch (error) {
			console.error('Error creating session:', error);
			alert('Error connecting to API');
		} finally {
			setIsLoading(false);
		}
	};

	const copyLink = () => {
		const link = `${window.location.origin}/session?id=${sessionData.sessionId}`;
		navigator.clipboard.writeText(link);
		alert('Link copied to clipboard!');
	};

	return (
		<div className='min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='w-full max-w-md'>
				<header className='text-center mb-10'>
					<h1 className='text-4xl font-black tracking-tighter mb-2'>
						SYNTH<span className='text-gray-500'>INTERVIEW</span>
					</h1>
					<p className='text-gray-400 text-sm font-medium uppercase tracking-widest'>
						Recruiter Dashboard
					</p>
				</header>

				<div className='bg-[#0a0a0a] border border-[#222] rounded-xl overflow-hidden shadow-2xl'>
					{!sessionData ? (
						<div className='p-8'>
							<h2 className='text-xl font-bold mb-6 flex items-center gap-2'>
								<div className='w-2 h-2 rounded-full bg-white'></div>
								New Session Configuration
							</h2>

							<form onSubmit={handleSubmit} className='space-y-6'>
								<div className='space-y-2'>
									<label className='text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1'>
										Candidate Email
									</label>
									<input
										type='email'
										placeholder='candidate@example.com'
										value={config.candidateEmail}
										onChange={(e) =>
											setConfig({ ...config, candidateEmail: e.target.value })
										}
										className='w-full bg-[#111] border border-[#222] focus:border-white/30 rounded-lg px-4 py-3 text-sm transition-all outline-none'
										required
									/>
								</div>

								<div className='space-y-2'>
									<label className='text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1'>
										Difficulty
									</label>
									<select
										value={config.difficulty}
										onChange={(e) =>
											setConfig({ ...config, difficulty: e.target.value })
										}
										className='w-full bg-[#111] border border-[#222] focus:border-white/30 rounded-lg px-4 py-3 text-sm transition-all outline-none appearance-none'>
										<option value='Easy'>Easy</option>
										<option value='Medium'>Medium</option>
										<option value='Hard'>Hard</option>
									</select>
								</div>

								<div className='space-y-2'>
									<label className='text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1'>
										Topics
									</label>
									<input
										type='text'
										placeholder='Algorithms, System Design'
										value={config.topics}
										onChange={(e) =>
											setConfig({ ...config, topics: e.target.value })
										}
										className='w-full bg-[#111] border border-[#222] focus:border-white/30 rounded-lg px-4 py-3 text-sm transition-all outline-none'
									/>
								</div>

								<div className='space-y-2'>
									<label className='text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1'>
										Time Limit (min)
									</label>
									<input
										type='number'
										value={config.timeLimit}
										onChange={(e) =>
											setConfig({ ...config, timeLimit: e.target.value })
										}
										className='w-full bg-[#111] border border-[#222] focus:border-white/30 rounded-lg px-4 py-3 text-sm transition-all outline-none'
									/>
								</div>

								<button
									type='submit'
									disabled={isLoading}
									className='w-full bg-white text-black hover:bg-gray-200 py-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4'>
									{isLoading ? 'Processing...' : 'Generate Interview Link'}
								</button>
							</form>
						</div>
					) : (
						<div className='p-8 text-center animate-in fade-in zoom-in duration-300'>
							<div className='w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6'>
								<svg
									xmlns='http://www.w3.org/2000/svg'
									width='32'
									height='32'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='3'
									strokeLinecap='round'
									strokeLinejoin='round'>
									<polyline points='20 6 9 17 4 12'></polyline>
								</svg>
							</div>
							<h2 className='text-2xl font-bold mb-2'>Session Created!</h2>
							<p className='text-gray-400 text-sm mb-8'>
								Copy the magic link below and send it to the candidate.
							</p>

							<div className='bg-[#111] border border-[#222] rounded-lg p-4 mb-6 flex items-center justify-between gap-4'>
								<code className='text-[10px] text-gray-300 truncate'>
									{window.location.origin}/session?id={sessionData.sessionId}
								</code>
								<button
									onClick={copyLink}
									className='bg-white text-black px-3 py-1.5 rounded text-[10px] font-bold uppercase whitespace-nowrap'>
									Copy
								</button>
							</div>

							<div className='flex flex-col gap-3'>
								<button
									onClick={() => setSessionData(null)}
									className='text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors'>
									Create Another
								</button>
								<Link
									href={`/session?id=${sessionData.sessionId}`}
									className='text-xs font-bold text-white uppercase tracking-widest bg-[#222] py-3 rounded-lg hover:bg-[#333] transition-colors mt-4'>
									Enter Session
								</Link>
							</div>
						</div>
					)}

					<div className='bg-[#050505] p-4 border-t border-[#222] text-center'>
						<p className='text-[9px] text-gray-600 font-bold uppercase tracking-widest'>
							Session will be valid for 24 hours
						</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
}
