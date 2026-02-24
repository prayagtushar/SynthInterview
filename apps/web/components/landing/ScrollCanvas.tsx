'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const TOTAL_FRAMES = 200;

function getFrameSrc(index: number): string {
	const padded = String(index).padStart(3, '0');
	return `/assets/ezgif-frame-${padded}.jpg`;
}

const PHASES = [
	{ start: 0, end: 0.08, label: '✦ The Night Sky', icon: '🌙' },
	{ start: 0.08, end: 0.25, label: '✦ The Book Awakens', icon: '📖' },
	{ start: 0.25, end: 0.5, label: '✦ The Lift & Reveal', icon: '🪄' },
	{ start: 0.5, end: 0.75, label: '✦ The Magic', icon: '🌀' },
	{ start: 0.75, end: 1.0, label: '✦ The Transformation', icon: '🎨' },
];

export default function ScrollCanvas() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const imagesRef = useRef<HTMLImageElement[]>([]);
	const currentFrameRef = useRef(0);
	const rafRef = useRef<number>(0);

	const [loadProgress, setLoadProgress] = useState(0);
	const [isLoaded, setIsLoaded] = useState(false);
	const [currentPhase, setCurrentPhase] = useState('');
	const [showPhase, setShowPhase] = useState(false);

	// Preload all frames
	useEffect(() => {
		let loaded = 0;
		const images: HTMLImageElement[] = [];

		for (let i = 1; i <= TOTAL_FRAMES; i++) {
			const img = new Image();
			img.src = getFrameSrc(i);
			img.onload = () => {
				loaded++;
				setLoadProgress(Math.round((loaded / TOTAL_FRAMES) * 100));
				if (loaded === TOTAL_FRAMES) {
					setIsLoaded(true);
					// Draw first frame
					drawFrame(0);
				}
			};
			img.onerror = () => {
				loaded++;
				setLoadProgress(Math.round((loaded / TOTAL_FRAMES) * 100));
				if (loaded === TOTAL_FRAMES) {
					setIsLoaded(true);
					drawFrame(0);
				}
			};
			images.push(img);
		}

		imagesRef.current = images;
	}, []);

	const drawFrame = useCallback((frameIndex: number) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const img = imagesRef.current[frameIndex];
		if (!img || !img.complete || !img.naturalWidth) return;

		// Set canvas size to match viewport for crisp rendering
		const dpr = window.devicePixelRatio || 1;
		const w = window.innerWidth;
		const h = window.innerHeight;

		if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
			canvas.width = w * dpr;
			canvas.height = h * dpr;
			canvas.style.width = `${w}px`;
			canvas.style.height = `${h}px`;
			ctx.scale(dpr, dpr);
		}

		// Draw image cover-style
		const imgRatio = img.naturalWidth / img.naturalHeight;
		const canvasRatio = w / h;
		let drawW: number, drawH: number, offsetX: number, offsetY: number;

		if (imgRatio > canvasRatio) {
			drawH = h;
			drawW = h * imgRatio;
			offsetX = -(drawW - w) / 2;
			offsetY = 0;
		} else {
			drawW = w;
			drawH = w / imgRatio;
			offsetX = 0;
			offsetY = -(drawH - h) / 2;
		}

		ctx.clearRect(0, 0, w, h);
		ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
	}, []);

	// Scroll handler
	useEffect(() => {
		if (!isLoaded) return;

		const handleScroll = () => {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = requestAnimationFrame(() => {
				const container = containerRef.current;
				if (!container) return;

				const rect = container.getBoundingClientRect();
				const scrollableHeight = container.offsetHeight - window.innerHeight;
				const scrolled = -rect.top;
				const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

				const frameIndex = Math.min(
					TOTAL_FRAMES - 1,
					Math.floor(progress * TOTAL_FRAMES),
				);

				if (frameIndex !== currentFrameRef.current) {
					currentFrameRef.current = frameIndex;
					drawFrame(frameIndex);
				}

				// Update phase label
				const phase = PHASES.find(
					(p) => progress >= p.start && progress < p.end,
				);
				if (phase) {
					setCurrentPhase(phase.label);
					setShowPhase(progress > 0.02);
				} else {
					setShowPhase(false);
				}
			});
		};

		window.addEventListener('scroll', handleScroll, { passive: true });
		window.addEventListener('resize', () => drawFrame(currentFrameRef.current));
		handleScroll();

		return () => {
			window.removeEventListener('scroll', handleScroll);
			cancelAnimationFrame(rafRef.current);
		};
	}, [isLoaded, drawFrame]);

	return (
		<>
			{/* Loading Screen */}
			<div className={`loading-screen ${isLoaded ? 'loaded' : ''}`}>
				<div className='loading-ring' />
				<div className='loading-text'>Loading cinematic experience</div>
				<div className='loading-bar-track'>
					<div
						className='loading-bar-fill'
						style={{ width: `${loadProgress}%` }}
					/>
				</div>
			</div>

			{/* Scroll container: 700vh gives plenty of room for scrubbing */}
			<div
				ref={containerRef}
				className='canvas-section'
				style={{ height: '700vh' }}>
				<div className='canvas-sticky'>
					<canvas ref={canvasRef} />
				</div>
			</div>

			{/* Phase label */}
			<div className={`phase-label ${showPhase ? 'visible' : ''}`}>
				{currentPhase}
			</div>
		</>
	);
}
