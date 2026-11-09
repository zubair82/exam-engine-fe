import React, { useState, useEffect } from 'react';

export interface PromoBannerProps {
  bannerUrl?: string | null;
  tutorName?: string;
  className?: string;
}

/**
 * PromoBanner Component:
 * Promotional banner for verified educators on ExamSimula.
 * - Attempts to load and display the educator's custom uploaded banner from GET /api/v1/exam/banner/{teacher_id}.
 * - If the image is loading, not uploaded yet, or returns 404, renders the high-impact educator series banner with their name.
 * - Strictly enforces 5:1 aspect ratio (desktop height 240px) with object-fit: cover.
 */
export default function PromoBanner({ bannerUrl, tutorName, className = '' }: PromoBannerProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [bannerUrl]);

  return (
    <div
      className={`w-full aspect-[5/1] max-h-[240px] min-h-[90px] sm:min-h-[140px] md:h-[240px] rounded-2xl md:rounded-3xl overflow-hidden relative shadow-md bg-slate-900 border border-slate-200/40 dark:border-slate-700/60 transition-all duration-300 ${className}`}
      role="region"
      aria-label={tutorName ? `${tutorName} Promotional Banner` : 'Tutor Promotional Banner'}
    >
      {bannerUrl && !imageError ? (
        <img
          src={bannerUrl}
          alt={tutorName ? `${tutorName} Promotional Banner` : 'Tutor Promotional Banner'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center select-none"
          loading="eager"
        />
      ) : (
        /* Verified Educator Series Showcase Banner */
        <div className="w-full h-full relative flex items-center justify-between px-6 sm:px-10 md:px-14 bg-gradient-to-r from-[#070e20] via-[#0e1d44] to-[#2d1c04] overflow-hidden select-none">
          {/* Ambient Lighting & Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Left Visual Details */}
          <div className="relative z-10 flex flex-col justify-center max-w-2xl py-2">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500/25 to-yellow-500/15 text-amber-300 border border-amber-400/40 shadow-sm backdrop-blur-sm">
                <span className="material-symbols-outlined text-[13px] text-amber-400">verified</span>
                <span>Verified Educator Series</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 truncate">
              <span>{tutorName ? `${tutorName}'s Test Series` : 'Educator Mock Test Series'}</span>
              <span className="material-symbols-outlined text-amber-400 text-xl md:text-2xl" title="Verified Tutor">
                verified
              </span>
            </h2>

            <p className="text-[11px] sm:text-xs md:text-sm text-slate-300 font-medium leading-snug line-clamp-1 mt-0.5 sm:mt-1">
              Specially curated mock examinations and sectional practice papers aligned with the latest exam pattern.
            </p>
          </div>

          {/* Right Visual Accents */}
          <div className="relative z-10 hidden sm:flex items-center gap-3 shrink-0">
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-400/30 backdrop-blur-md flex items-center justify-center shadow-lg">
              <span className="material-symbols-outlined text-amber-300 text-3xl md:text-4xl">school</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
