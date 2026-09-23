import React from 'react';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import ExamSimulaLogo from './Logo';

export default function LoginScreen() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const redirectParam = searchParams.get('redirect_uri') || searchParams.get('redirect_url');
  const redirectOrigin = redirectParam || (window.location.origin + '/dashboard');

  const loginUrl = `${import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5001'}/api/v1/auth/google/login?role=STUDENT&redirect_url=${encodeURIComponent(redirectOrigin)}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1e29] flex flex-col justify-between items-center selection:bg-blue-100 dark:selection:bg-blue-950 selection:text-blue-900 dark:selection:text-blue-200 relative transition-colors duration-200">
      <div className="absolute top-6 right-6">
        <ThemeToggle size="md" />
      </div>

      <div className="w-full flex-grow flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md bg-white dark:bg-[#252b3b] rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-700/70 overflow-hidden"
        >
          <div className="p-8 text-center border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-[#222736]">
            <div className="flex justify-center mb-4">
              <ExamSimulaLogo size={52} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Welcome to ExamSimula</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Please select your login type to continue</p>
          </div>

          <div className="p-8 space-y-4">
            <a
              href={loginUrl}
              className="w-full flex items-center justify-between p-4 border-2 border-slate-100 dark:border-slate-700 rounded-xl hover:border-blue-200 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-[#1e2330] transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <User className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900 dark:text-slate-100">Student Portal</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Access mock tests & analytics</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 dark:text-slate-500 group-hover:text-blue-500 transition-colors">chevron_right</span>
            </a>
          </div>

          <div className="bg-slate-50 dark:bg-[#222736] p-4 text-center border-t border-slate-100 dark:border-slate-700/60">
            <button
              onClick={() => navigate('/home')}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              &larr; Back to Home
            </button>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer compact />
    </div>
  );
}
