"use client"

import ScrollCanvas from '../components/landing/ScrollCanvas';
import HeroOverlay from '../components/landing/HeroOverlay';
import FeaturesSection from '../components/landing/FeaturesSection';

export default function HomePage() {
	return (
		<main>
			{/* Scroll-driven cinematic animation + hero overlay */}
			<ScrollCanvas />
			<HeroOverlay />

			{/* Features & CTA below the animation */}
			<FeaturesSection />
		</main>
	);
}
