import React from 'react';
import { motion } from 'motion/react';
import { Flame, Star, ArrowRight } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import ExamSimulaLogo from './Logo';

interface LandingScreenProps {
  onStartTest: () => void;
  onGoToDashboard: () => void;
  onGoToLogin: () => void;
  onGoToQuestionPapers: () => void;
}

export default function LandingScreen({ onStartTest, onGoToDashboard, onGoToLogin, onGoToQuestionPapers }: LandingScreenProps) {
  return (
    <div className="bg-slate-50 dark:bg-[#1a1e29] min-h-screen flex flex-col text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-950 selection:text-blue-900 dark:selection:text-blue-200">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 fixed w-full top-0 z-50 transition-colors duration-200">
        <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto py-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={onGoToDashboard}>
            <ExamSimulaLogo size={32} />
            <span className="text-xl font-bold tracking-tight text-blue-900 dark:text-blue-400">
              ExamSimula
            </span>
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-3 md:gap-4">
            <ThemeToggle size="md" />

            <button 
              onClick={onGoToDashboard}
              className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/60 p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer"
              title="12 Day Streak"
            >
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400" />
            </button>
            
            <button 
              onClick={onGoToLogin}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-semibold py-2 px-5 rounded-full transition-colors shadow-sm cursor-pointer"
            >
              Log in
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white dark:bg-[#222736] mt-[73px] pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-slate-200 dark:border-slate-700/60 transition-colors duration-200">
          <div className="absolute inset-0 z-0 opacity-30 dark:opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50/50 dark:from-blue-900/20 dark:via-[#222736] dark:to-indigo-900/20"></div>
          </div>
          
          <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            {/* Tagline Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-500/30 mb-8"
            >
              <Star className="w-4 h-4 text-blue-700 dark:text-blue-400 fill-blue-600 dark:fill-blue-500" />
              <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wide">
                The most realistic exam simulator
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 tracking-tight leading-none"
            >
              Crack JEE With <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                AI-powered Mock Tests
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-slate-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Experience the exact real-time exam interface before the actual day. Get comprehensive, instantaneous AI-driven performance analysis to identify weak areas and improve your score.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm sm:max-w-none"
            >
              <button 
                onClick={onStartTest}
                className="bg-blue-900 hover:bg-blue-800 active:bg-blue-950 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3.5 px-8 rounded-lg transition-all shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 cursor-pointer group"
              >
                Start Free Test
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={onGoToQuestionPapers}
                className="bg-white dark:bg-[#252b3b] text-blue-900 dark:text-blue-300 border-2 border-slate-200 dark:border-slate-700/70 font-semibold py-3.5 px-8 rounded-lg hover:border-blue-900/30 dark:hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-[#1e2330] transition-all flex items-center justify-center cursor-pointer"
              >
                Browse Test Series
              </button>
            </motion.div>

            {/* Hero Mockup (Interactive Exam Simulator Preview) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-16 w-full max-w-4xl rounded-xl border border-slate-200 dark:border-slate-700/70 bg-slate-50 dark:bg-[#1a1e29] shadow-2xl overflow-hidden relative"
            >
              {/* Mock Browser Header */}
              <div className="h-10 bg-slate-100 dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-[11px] font-medium text-slate-400 dark:text-slate-400 select-none bg-white dark:bg-[#1a1e29] px-8 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                  examsimula.com/jee-advanced-mock-test-4
                </div>
                <div className="w-12"></div>
              </div>

              {/* Mock Exam Content */}
              <div className="aspect-video bg-white dark:bg-[#1a1e29] flex flex-col overflow-hidden text-left text-xs p-4 border-t border-slate-100 dark:border-slate-800 select-none">
                {/* Header */}
                <div className="h-8 border-b border-slate-200 dark:border-slate-700/60 flex justify-between items-center px-2 bg-slate-50 dark:bg-[#222736] text-[10px] font-bold text-blue-900 dark:text-blue-300 rounded-t">
                  <span>JEE Advanced 2024</span>
                  <div className="flex gap-4 items-center">
                    <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50 flex items-center gap-1">⏱️ 02:45:12</span>
                    <span className="bg-blue-800 dark:bg-blue-600 text-white px-2 py-0.5 rounded font-semibold text-[9px]">Submit</span>
                  </div>
                </div>

                {/* Subheader */}
                <div className="h-7 border-b border-slate-200 dark:border-slate-700/60 flex justify-between items-center px-2 text-[9px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1e2330]">
                  <div className="flex gap-2">
                    <span className="text-blue-900 dark:text-blue-400 border-b-2 border-blue-900 dark:border-blue-400 px-2 pb-0.5">Physics</span>
                    <span className="px-2">Chemistry</span>
                    <span className="px-2">Mathematics</span>
                  </div>
                  <span>Question 4 (Single Choice)</span>
                </div>

                {/* Split Panes */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Question Pane */}
                  <div className="flex-1 p-3 flex flex-col justify-between border-r border-slate-200 dark:border-slate-700/60">
                    <div className="space-y-2">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                        A particle of mass $m$ is moving in a circular path of constant radius $r$ such that its centripetal acceleration $a_c$ is varying with time $t$ as $a_c = k^2rt^2$. The power delivered to the particle is:
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2 border border-blue-100 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-950/40 rounded flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-blue-700 dark:border-blue-400 bg-blue-100 dark:bg-blue-900 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-900 dark:bg-blue-200"></div></div>
                          <span className="text-slate-700 dark:text-slate-200 text-[9px] font-semibold">(B) $mk^2r^2t$</span>
                        </div>
                        <div className="p-2 border border-slate-200 dark:border-slate-700 rounded flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600"></div>
                          <span className="text-slate-600 dark:text-slate-400 text-[9px]">(D) $0$</span>
                        </div>
                      </div>
                    </div>
                    {/* Mock Action Panel */}
                    <div className="h-8 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center pt-2">
                      <span className="text-[8px] text-blue-900 dark:text-blue-400 border border-blue-900 dark:border-blue-500/40 px-2 py-0.5 rounded font-medium">Clear Response</span>
                      <span className="text-[8px] bg-blue-900 dark:bg-blue-600 text-white px-3 py-1 rounded font-bold">Save & Next</span>
                    </div>
                  </div>

                  {/* Right Palette Pane */}
                  <div className="w-44 bg-slate-50 dark:bg-[#1e2330] p-2 flex flex-col justify-between text-[8px]">
                    <div className="space-y-2">
                      <div className="border-b border-slate-200 dark:border-slate-700/60 pb-2">
                        <div className="font-bold text-slate-700 dark:text-slate-200">Rahul Sharma</div>
                        <div className="text-[7px] text-slate-400 dark:text-slate-400">Roll No: 24JEE4589</div>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold">1</div>
                        <div className="w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center font-bold">2</div>
                        <div className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center font-bold">3</div>
                        <div className="w-6 h-6 rounded border border-blue-800 dark:border-blue-400 bg-white dark:bg-[#252b3b] text-slate-800 dark:text-slate-100 flex items-center justify-center font-bold ring-1 ring-blue-800 dark:ring-blue-400">4</div>
                        <div className="w-6 h-6 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#252b3b] text-slate-700 dark:text-slate-300 flex items-center justify-center font-medium">5</div>
                        <div className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center font-bold relative">
                          6 <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-600 rounded-full border border-white"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center font-semibold text-slate-400 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/60 pt-2 text-[7px]">
                      Physics Palette • 20 Questions
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Persistent Footer */}
      <Footer />
    </div>
  );
}
