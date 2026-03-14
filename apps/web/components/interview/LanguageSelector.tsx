import React, { useRef, useEffect } from "react";
import { Code2, ChevronDown, Check } from "lucide-react";
import { LANGUAGES } from "../../lib/constants";

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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    if (showLangMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLangMenu, setShowLangMenu]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowLangMenu(!showLangMenu)}
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all duration-200 text-[10px] font-black uppercase tracking-widest ${
          showLangMenu
            ? "bg-indigo-500/10 border-indigo-500/30 text-white"
            : "bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:border-white/10"
        }`}
      >
        <div className="p-0.5 rounded bg-indigo-500/20">
          <Code2 size={10} className="text-indigo-400" />
        </div>
        {currentLang.label}
        <ChevronDown
          size={10}
          className={`text-slate-600 transition-transform duration-300 ${showLangMenu ? "rotate-180" : ""}`}
        />
      </button>

      {showLangMenu && (
        <div
          ref={menuRef}
          className="absolute top-full left-0 mt-2 w-48 bg-[#0a0a0f]/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="px-3 py-2 border-b border-white/5">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em]">
              Select Language
            </span>
          </div>
          <div className="p-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  switchLanguage(lang.id);
                  setShowLangMenu(false);
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-[10px] font-bold transition-all ${
                  lang.id === language
                    ? "bg-indigo-500/10 text-indigo-300"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] grayscale group-hover:grayscale-0">
                    {lang.icon}
                  </span>
                  {lang.label}
                </div>
                {lang.id === language && (
                  <Check size={12} className="text-indigo-400" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
