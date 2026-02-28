import Navbar from '../components/landing/Navbar';
import HeroOverlay from '../components/landing/HeroOverlay';
import FeaturesSection from '../components/landing/FeaturesSection';

export default function HomePage() {
	return (
		<main>
			<Navbar />
			<HeroOverlay />
			<FeaturesSection />
		</main>
	);
}
