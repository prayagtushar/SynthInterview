import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
	title: 'SynthInterview — Turn Stories into Interviews with AI',
	description:
		'Transform any story, script, or idea into stunning AI-generated interview experiences. Instant panels, smart dialogue bubbles, and one-click export.',
	keywords: [
		'AI interviews',
		'interview generator',
		'story to interview',
		'AI art',
		'interview creator',
	],
	openGraph: {
		title: 'SynthInterview — Turn Stories into Interviews with AI',
		description: 'Transform any story into stunning AI-generated interview panels.',
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
