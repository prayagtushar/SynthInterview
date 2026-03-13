import React from 'react';
import { Code2, ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../../lib/constants';

interface LanguageSelectorProps {
	currentLang: (typeof LANGUAGES)[number];
	showLangMenu: boolean;
	setShowLangMenu: (show: boolean) => void;
	switchLanguage: (langId: string) => void;
	language: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
	currentLang,
	showLangMenu,
	setShowLangMenu,
	switchLanguage,
	language,
}) => {
	return (
		<div className='relative'>
			<button
				onClick={() => setShowLangMenu(!showLangMenu)}
				className='flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all text-[10px] font-bold tracking-wider uppercase text-gray-300 hover:text-white'>
				<Code2 size={11} className='text-purple-400' />
				{currentLang.label}
				<ChevronDown size={10} className='text-gray-500' />
			</button>
			{showLangMenu && (
				<div className='absolute top-full left-0 mt-1 w-40 bg-[#0f0f12] border border-white/10 rounded-lg shadow-2xl z-30 overflow-hidden'>
					{LANGUAGES.map((lang) => (
						<button
							key={lang.id}
							onClick={() => switchLanguage(lang.id)}
							className={`w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-medium transition-colors ${
								lang.id === language
									? 'bg-purple-500/20 text-purple-300'
									: 'text-gray-400 hover:bg-white/5 hover:text-white'
							}`}>
							<span className='w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[8px] font-black tracking-tighter'>
								{lang.icon}
							</span>
							{lang.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};
