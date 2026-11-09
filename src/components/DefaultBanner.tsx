import React from 'react';
import ExamSimulaLogo from './Logo';

export interface DefaultBannerProps {
  activeCategory?: string;
  categoryName?: string;
  className?: string;
}

/**
 * DefaultBanner Component:
 * Renders ExamSimula's default promotional and marketplace branding.
 * Used when browsing all papers or general ExamSimula marketplace tests.
 * Enforces a 5:1 aspect ratio matching the 240px desktop height at 1200px width.
 */
export default function DefaultBanner({
  activeCategory = 'JEE',
  categoryName,
  className = ''
}: DefaultBannerProps) {
  return (
    <div
      className={`w-full aspect-[5/1] max-h-[240px] min-h-[90px] sm:min-h-[140px] md:h-[240px] rounded-2xl md:rounded-3xl overflow-hidden relative shadow-md bg-gradient-to-r from-[#070f23] via-[#0e214d] to-[#162f70] border border-blue-500/25 dark:border-blue-400/20 transition-all duration-300 select-none flex items-center justify-between px-6 sm:px-10 md:px-14 ${className}`}
      role="region"
      aria-label="ExamSimula Marketplace Banner"
    >
      {/* Background Ambient Lighting & Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/15 via-transparent to-transparent pointer-events-none" />
      <div className="absolute -left-16 -top-16 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-0 bottom-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Left Content Column */}
      <div className="relative z-10 flex flex-col justify-center max-w-2xl py-2">
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm">
            <span className="material-symbols-outlined text-[13px] text-cyan-400">verified</span>
            <span>Official ExamSimula Marketplace</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
            NTA Pattern Series
          </span>
        </div>

        <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight truncate">
          {categoryName ? `${categoryName} Mock Tests` : `All-India ${activeCategory} Mock Tests`}
        </h2>

        <p className="text-[11px] sm:text-xs md:text-sm text-slate-300 font-medium leading-snug line-clamp-1 sm:line-clamp-2 mt-0.5 sm:mt-1 max-w-xl">
          Authentic full mocks and chapter-wise question papers curated by premier educators. Experience the real NTA test interface with instant AI analytics.
        </p>
      </div>

      {/* Right Graphic / Emblem Showcase */}
      <div className="relative z-10 hidden sm:flex items-center gap-3 shrink-0">
        <div className="relative flex items-center justify-center p-3 md:p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-blue-400/30 shadow-2xl">
          <ExamSimulaLogo size={36} className="drop-shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
          <div className="ml-2.5 text-left hidden md:block">
            <p className="text-xs font-extrabold uppercase tracking-widest text-white leading-tight">ExamSimula</p>
            <p className="text-[10px] text-cyan-300 font-semibold leading-tight">National Mocks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

