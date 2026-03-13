import React from 'react';
import { ScorecardData } from '../../lib/types';

interface ScorecardViewProps {
	scorecard: ScorecardData | null;
	currentState: string;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
	scorecard,
	currentState,
}) => {
	return (
		<div className='flex-1 overflow-y-auto p-4 space-y-4'>
			{scorecard ? (
				<>
					{/* Overall score */}
					<div className='flex items-center gap-3 p-3 bg-white/[0.03] border border-white/5 rounded'>
						<div className='w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center shrink-0'>
							<span className='text-sm font-black text-white'>
								{scorecard.overall_score}
							</span>
						</div>
						<div>
							<p className='text-xs font-bold text-white'>{scorecard.rating}</p>
							<p className='text-[10px] text-gray-500'>Overall Score</p>
						</div>
					</div>

					{/* Dimension scores */}
					{[
						{ label: 'Problem Understanding', key: 'problem_understanding' },
						{ label: 'Approach & Algorithm', key: 'approach' },
						{ label: 'Code Quality', key: 'code_quality' },
						{ label: 'Communication', key: 'communication' },
						{ label: 'Correctness', key: 'correctness' },
						{ label: 'Time Management', key: 'time_management' },
					].map(({ label, key }) => {
						const score = (scorecard.scores as any)?.[key] ?? 0;
						const pct = Math.min(100, Math.max(0, score));
						const color =
							pct >= 70
								? 'bg-green-500'
								: pct >= 40
									? 'bg-yellow-500'
									: 'bg-red-500';
						return (
							<div key={key} className='space-y-1'>
								<div className='flex justify-between text-[10px] font-medium'>
									<span className='text-gray-400'>{label}</span>
									<span className='text-white font-bold'>{score}</span>
								</div>
								<div className='h-1 bg-white/5 rounded-full overflow-hidden'>
									<div
										className={`h-full ${color} rounded-full transition-all duration-1000`}
										style={{ width: `${pct}%` }}
									/>
								</div>
								{scorecard.dimension_feedback?.[key] && (
									<p className='text-[9px] text-gray-600 leading-relaxed'>
										{scorecard.dimension_feedback[key]}
									</p>
								)}
							</div>
						);
					})}

					{/* Feedback */}
					{scorecard.feedback && (
						<div className='border border-white/5 rounded p-3 bg-white/[0.02]'>
							<p className='text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5'>
								Feedback
							</p>
							<p className='text-[11px] text-gray-400 leading-relaxed'>
								{scorecard.feedback}
							</p>
						</div>
					)}

					{/* Strengths & Improvements */}
					{scorecard.strengths?.length > 0 && (
						<div>
							<p className='text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5'>
								Strengths
							</p>
							<ul className='space-y-1'>
								{scorecard.strengths.map((s, i) => (
									<li
										key={i}
										className='text-[10px] text-green-400/80 flex items-start gap-1.5'>
										<span className='mt-0.5 shrink-0'>✓</span>
										{s}
									</li>
								))}
							</ul>
						</div>
					)}
					{scorecard.improvement_areas?.length > 0 && (
						<div>
							<p className='text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-1.5'>
								Areas to Improve
							</p>
							<ul className='space-y-1'>
								{scorecard.improvement_areas.map((a, i) => (
									<li
										key={i}
										className='text-[10px] text-yellow-400/80 flex items-start gap-1.5'>
										<span className='mt-0.5 shrink-0'>→</span>
										{a}
									</li>
								))}
							</ul>
						</div>
					)}

					<p className='text-[9px] text-gray-700 text-center'>
						Scorecard emailed to candidate.
					</p>
				</>
			) : (
				<>
					{[
						{ label: 'Problem Understanding', key: 'problem_understanding' },
						{ label: 'Approach & Algorithm', key: 'approach' },
						{ label: 'Code Quality', key: 'code_quality' },
						{ label: 'Communication', key: 'communication' },
						{ label: 'Correctness', key: 'correctness' },
						{ label: 'Time Management', key: 'time_management' },
					].map(({ label }) => (
						<div key={label} className='space-y-1.5'>
							<div className='flex justify-between text-[10px] font-medium'>
								<span className='text-gray-500'>{label}</span>
								<span className='text-gray-700'>—</span>
							</div>
							<div className='h-0.5 bg-white/5 rounded-full' />
						</div>
					))}
					<div className='border border-dashed border-white/10 rounded p-3'>
						<p className='text-[10px] text-gray-600 text-center leading-relaxed'>
							{currentState === 'COMPLETED'
								? 'Generating scorecard…'
								: 'Scorecard generated after interview ends.'}
						</p>
					</div>
				</>
			)}
		</div>
	);
};
