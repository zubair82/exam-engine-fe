import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const btnSizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-[#252b3b] border border-transparent dark:border-slate-700/60 ${btnSizes[size]} ${className}`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Eye-Comfort Dark Mode'}
      aria-label="Toggle Dark Mode"
    >
      {theme === 'dark' ? (
        <Sun className={`${iconSizes[size]} text-amber-400 fill-amber-400/20 transition-transform duration-300 rotate-0 hover:rotate-45`} />
      ) : (
        <Moon className={`${iconSizes[size]} text-slate-600 hover:text-slate-900 transition-transform duration-300 rotate-0 hover:-rotate-12`} />
      )}
    </button>
  );
}
