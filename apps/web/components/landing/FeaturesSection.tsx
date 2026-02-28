'use client';

import { useEffect, useRef } from 'react';

const FEATURES = [
	{
		icon: '✨',
		iconClass: 'feature-icon-cyan',
		title: 'AI Story Engine',
		desc: 'Paste any story, script, or even a rough idea — our AI breaks it into perfectly paced scenes and generates rich panel descriptions automatically.',
	},
	{
		icon: '🎨',
		iconClass: 'feature-icon-gold',
		title: 'Instant Interview Panels',
		desc: 'Every scene becomes a vibrant, hand-crafted interview panel rendered by state-of-the-art image generation. No drawing skills needed.',
	},
	{
		icon: '💬',
		iconClass: 'feature-icon-pink',
		title: 'Smart Dialogue Bubbles',
		desc: 'Dialogue, narration, and sound effects are intelligently placed into speech bubbles and captions that feel authentic and readable.',
	},
	{
		icon: '🚀',
		iconClass: 'feature-icon-purple',
		title: 'One-Click Export',
		desc: 'Download your interview as high-resolution images, a scrollable web experience, or a print-ready PDF — all in a single click.',
	},
];

export default function FeaturesSection() {
	const sectionRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.15 },
		);

		const revealElements = sectionRef.current?.querySelectorAll('.reveal');
		revealElements?.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	}, []);

	return (
		<section className='features-section' ref={sectionRef}>
			<div className='features-inner'>
				{/* Header */}
				<div className='features-header reveal'>
					<p className='features-eyebrow'>How it works</p>
					<h2 className='features-title'>
						From words to worlds,
						<br />
						in seconds.
					</h2>
					<p className='features-subtitle'>
						SynthInterview uses cutting-edge AI to transform your text into
						professional-quality interview panels — with intelligent paneling,
						vibrant artwork, and cinematic storytelling.
					</p>
				</div>

				{/* Feature cards */}
				<div className='features-grid'>
					{FEATURES.map((f, i) => (
						<div
							key={i}
							className='feature-card reveal'
							style={{ transitionDelay: `${i * 0.1}s` }}>
							<div className={`feature-icon ${f.iconClass}`}>{f.icon}</div>
							<h3 className='feature-card-title'>{f.title}</h3>
							<p className='feature-card-desc'>{f.desc}</p>
						</div>
					))}
				</div>

				{/* CTA Banner */}
				<div className='cta-banner reveal' style={{ transitionDelay: '0.2s' }}>
					<h3 className='cta-banner-title'>
						Ready to turn your story into art?
					</h3>
					<p className='cta-banner-desc'>
						Join thousands of creators who are turning their ideas, fan fiction,
						and scripts into beautiful interviews — no artistic talent required.
					</p>
					<button className='hero-cta hero-cta-primary'>
						Get Started Free
						<svg
							width='16'
							height='16'
							viewBox='0 0 16 16'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'>
							<path
								d='M3 8h10M9 4l4 4-4 4'
								stroke='currentColor'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							/>
						</svg>
					</button>
				</div>
			</div>

			{/* Footer */}
			<footer className='footer'>
				<p>
					Made with ✦ by{' '}
					<a
						href='https://github.com/prayagtushar'
						target='_blank'
						rel='noopener noreferrer'>
						SynthInterview
					</a>
				</p>
			</footer>
		</section>
	);
}
