'use client';

import { useEffect, useState } from 'react';

export default function HeroOverlay() {
	const [opacity, setOpacity] = useState(1);
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const handleScroll = () => {
			const scrollY = window.scrollY;
			const fadeEnd = window.innerHeight * 0.5;
			const newOpacity = Math.max(0, 1 - scrollY / fadeEnd);
			setOpacity(newOpacity);
			setVisible(newOpacity > 0.01);
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	if (!visible) return null;

	return (
		<div className='hero-overlay' style={{ opacity }}>
			<div className='hero-content'>
				<span className='hero-badge'>
					<span className='hero-badge-dot' />
					AI-Powered Interview Experience
				</span>

				<h1 className='hero-title'>SynthInterview</h1>

				<p className='hero-tagline'>
					Turn any story into a stunning interview — powered by AI magic that
					transforms text into vibrant, panel-by-panel artwork.
				</p>

				<div className='hero-cta-group'>
					<button className='hero-cta hero-cta-primary'>
						Start Creating
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
					<button className='hero-cta hero-cta-secondary'>
						See How It Works
					</button>
				</div>
			</div>

			{/* Scroll indicator */}
			<div className='scroll-indicator'>
				<span className='scroll-indicator-label'>Scroll to explore</span>
				<div className='scroll-indicator-mouse'>
					<div className='scroll-indicator-dot' />
				</div>
			</div>
		</div>
	);
}
