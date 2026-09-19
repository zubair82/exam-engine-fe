import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../../components/ThemeToggle';
import Footer from '../../components/Footer';
import ExamSimulaLogo from '../../components/Logo';

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  activeTab: 'terms' | 'privacy' | 'refund' | 'contact' | 'hub';
  children: React.ReactNode;
}

export default function LegalLayout({
  title,
  subtitle,
  lastUpdated = 'September 2026',
  activeTab,
  children
}: LegalLayoutProps) {
  const location = useLocation();

  const navItems = [
    { key: 'terms', label: 'Terms of Use', path: '/terms' },
    { key: 'privacy', label: 'Privacy Policy', path: '/privacy' },
    { key: 'refund', label: 'Cancellation & Refund', path: '/refund-policy' },
    { key: 'contact', label: 'Contact Us', path: '/contact' },
    { key: 'hub', label: 'All Policies Hub', path: '/legal' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1e29] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#222736]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/home" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
            <Link to="/home" className="flex items-center gap-2">
              <ExamSimulaLogo size={28} />
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
                ExamSimula
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Policy Navigation Tabs */}
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#1e2330]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none flex items-center gap-1 sm:gap-2 py-1.5">
            {navItems.map(item => {
              const isActive = activeTab === item.key || location.pathname === item.path;
              return (
                <Link
                  key={item.key}
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Hero Header Banner */}
      <section className="bg-gradient-to-b from-blue-50/60 via-white to-slate-50 dark:from-[#222736] dark:via-[#1e2330] dark:to-[#1a1e29] border-b border-slate-200 dark:border-slate-800 py-10 sm:py-12 px-4 sm:px-6 transition-colors">
        <div className="max-w-4xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/50 text-[11px] font-bold text-blue-800 dark:text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Official Policy & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>Effective Date: <strong>{lastUpdated}</strong></span>
            <span>•</span>
            <span>Governing Law: <strong>India</strong></span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white dark:bg-[#222736] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-6 sm:p-10 shadow-sm transition-colors space-y-8">
          {children}
        </div>
      </main>

      {/* Persistent Footer */}
      <Footer />
    </div>
  );
}
