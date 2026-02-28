'use client';

import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
	Mic,
	MicOff,
	Video,
	VideoOff,
	Play,
	Save,
	ChevronRight,
	Terminal,
	User,
	FileJson,
} from 'lucide-react';

export default function SessionView() {
	const [isMuted, setIsMuted] = useState(false);
	const [isVideoOff, setIsVideoOff] = useState(false);
	const [code, setCode] = useState(`// Welcome to your SynthInterview session.
// The AI is watching and listening...

function solve(arr) {
  // Write your solution here
  return arr.sort((a, b) => a - b);
}

console.log(solve([3, 1, 4, 1, 5, 9]));
`);

	return (
		<div className='flex h-screen bg-black text-white overflow-hidden font-sans'>
			{/* Left Sidebar - Participants & Controls */}
			<div className='w-16 flex flex-col items-center py-6 border-r border-[#333] gap-8'>
				<div className='w-10 h-10 bg-white text-black flex items-center justify-center font-black rounded-sm cursor-pointer'>
					S
				</div>

				<div className='flex flex-col gap-6 mt-4'>
					<button
						onClick={() => setIsMuted(!isMuted)}
						className={`p-2 rounded-md transition-colors ${isMuted ? 'bg-red-900 text-red-100' : 'hover:bg-[#222]'}`}>
						{isMuted ? <MicOff size={20} /> : <Mic size={20} />}
					</button>
					<button
						onClick={() => setIsVideoOff(!isVideoOff)}
						className={`p-2 rounded-md transition-colors ${isVideoOff ? 'bg-red-900 text-red-100' : 'hover:bg-[#222]'}`}>
						{isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
					</button>
				</div>

				<div className='mt-auto mb-4 flex flex-col gap-6'>
					<button className='p-2 hover:bg-[#222] rounded-md text-gray-400 hover:text-white transition-colors'>
						<FileJson size={20} />
					</button>
					<div className='w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden border-2 border-[#333]'>
						<User size={24} />
					</div>
				</div>
			</div>

			{/* Main Content Area */}
			<div className='flex-1 flex flex-col min-w-0'>
				{/* Top Bar */}
				<header className='h-14 border-b border-[#333] flex items-center justify-between px-6 bg-[#0a0a0a]'>
					<div className='flex items-center gap-4'>
						<h2 className='text-sm font-semibold tracking-wide text-gray-300'>
							TWO SUM PROBLEM
						</h2>
						<span className='px-2 py-0.5 bg-[#222] text-[10px] font-bold text-gray-400 rounded'>
							EASY
						</span>
					</div>

					<div className='flex items-center gap-3'>
						<div className='flex items-center gap-2 mr-4'>
							<div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
							<span className='text-[10px] font-bold tracking-widest text-green-500 uppercase'>
								AI Synchronized
							</span>
						</div>
						<button className='flex items-center gap-2 bg-white text-black px-4 py-1.5 rounded-sm text-sm font-bold hover:bg-gray-200 transition-colors'>
							<Play size={14} />
							Run Code
						</button>
					</div>
				</header>

				{/* Editor & AI split */}
				<div className='flex-1 flex min-h-0'>
					{/* Editor */}
					<div className='flex-[2] min-w-0 border-r border-[#333]'>
						<Editor
							height='100%'
							defaultLanguage='javascript'
							defaultValue={code}
							theme='vs-dark'
							options={{
								fontSize: 14,
								minimap: { enabled: false },
								scrollBeyondLastLine: false,
								padding: { top: 20 },
								fontFamily:
									'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
							}}
						/>
					</div>

					{/* Right Sidebar - AI Log & Scorecard */}
					<div className='w-80 flex flex-col bg-[#050505]'>
						<div className='p-4 border-b border-[#333]'>
							<div className='flex items-center gap-2 mb-4'>
								<Terminal size={14} className='text-gray-400' />
								<span className='text-[10px] font-bold tracking-widest text-gray-400 uppercase'>
									AI Feedback
								</span>
							</div>
							<div className='space-y-4'>
								<div className='bg-[#111] p-3 rounded border border-[#222]'>
									<p className='text-xs leading-relaxed text-gray-300 italic'>
										"I noticed you're choosing a brute force approach. Have you
										considered using a Map to improve time complexity?"
									</p>
									<span className='text-[9px] text-gray-500 mt-2 block uppercase font-bold tracking-tighter'>
										Just now • Voice Prompt
									</span>
								</div>
							</div>
						</div>

						<div className='p-4 flex-1 overflow-y-auto'>
							<div className='flex items-center justify-between mb-4'>
								<span className='text-[10px] font-bold tracking-widest text-gray-400 uppercase'>
									Scorecard Preview
								</span>
								<ChevronRight size={14} className='text-gray-600' />
							</div>

							<div className='space-y-6'>
								<div className='space-y-2'>
									<div className='flex justify-between text-[11px] font-medium'>
										<span className='text-gray-400'>Problem Solving</span>
										<span className='text-white'>85%</span>
									</div>
									<div className='h-1 bg-[#222] rounded-full overflow-hidden'>
										<div className='h-full bg-white w-[85%]'></div>
									</div>
								</div>

								<div className='space-y-2'>
									<div className='flex justify-between text-[11px] font-medium'>
										<span className='text-gray-400'>Communication</span>
										<span className='text-white'>92%</span>
									</div>
									<div className='h-1 bg-[#222] rounded-full overflow-hidden'>
										<div className='h-full bg-white w-[92%]'></div>
									</div>
								</div>

								<div className='bg-[#0a0a0a] p-3 rounded border border-dashed border-[#333] mt-8'>
									<p className='text-[10px] text-gray-500 leading-relaxed text-center'>
										Full scorecard will be generated after the session ends.
									</p>
								</div>
							</div>
						</div>

						<footer className='p-4 bg-[#0a0a0a] border-t border-[#333]'>
							<button className='w-full border border-red-900 text-red-500 py-2 text-xs font-bold rounded-sm hover:bg-red-950/30 transition-colors uppercase tracking-widest'>
								End Interview
							</button>
						</footer>
					</div>
				</div>
			</div>
		</div>
	);
}
