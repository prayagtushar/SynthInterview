import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'Comic It — Turn Stories into Comics with AI',
	description:
		'Transform any story, script, or idea into stunning AI-generated comic strips. Instant panels, smart dialogue bubbles, and one-click export.',
	keywords: [
		'AI comics',
		'comic generator',
		'story to comic',
		'AI art',
		'comic creator',
	],
	openGraph: {
		title: 'Comic It — Turn Stories into Comics with AI',
		description: 'Transform any story into stunning AI-generated comic strips.',
		type: 'website',
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang='en'>
			<body>{children}</body>
		</html>
	);
}
