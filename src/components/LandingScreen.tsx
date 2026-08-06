import React from 'react';
import { motion } from 'motion/react';
import { Flame, Star, ArrowRight, Monitor, Award, Users, BookOpen, CheckCircle } from 'lucide-react';

interface LandingScreenProps {
  onStartTest: () => void;
  onGoToDashboard: () => void;
  onGoToLogin: () => void;
  onGoToQuestionPapers: () => void;
}

export default function LandingScreen({ onStartTest, onGoToDashboard, onGoToLogin, onGoToQuestionPapers }: LandingScreenProps) {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 fixed w-full top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 max-w-7xl mx-auto py-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-blue-900 flex items-center gap-1.5">
              <Award className="w-6 h-6 text-blue-700" />
              ExamSimula
            </span>
          </div>

          {/* Trailing Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onGoToDashboard}
              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 p-2 rounded-full transition-colors flex items-center justify-center"
              title="12 Day Streak"
            >
              <Flame className="w-5 h-5 fill-amber-500 text-amber-500" />
            </button>
            
            <button 
              onClick={onGoToLogin}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-5 rounded-full transition-colors shadow-sm"
            >
              Log in
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-white mt-[73px] pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="absolute inset-0 z-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50/50"></div>
          </div>
          
          <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
            {/* Tagline Badge */}
            <motion.div 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-8"
            >
              <Star className="w-4 h-4 text-blue-700 fill-blue-600" />
              <span className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                The most realistic exam simulator
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-none"
            >
              Crack JEE With <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-600">
                AI-powered Mock Tests
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
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
                className="bg-blue-900 text-white font-semibold py-3.5 px-8 rounded-lg hover:bg-blue-800 active:bg-blue-950 transition-all shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 cursor-pointer group"
              >
                Start Free Test
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button 
                onClick={onGoToQuestionPapers}
                className="bg-white text-blue-900 border-2 border-slate-200 font-semibold py-3.5 px-8 rounded-lg hover:border-blue-900/30 hover:bg-slate-50 transition-all flex items-center justify-center cursor-pointer"
              >
                Browse Test Series
              </button>
            </motion.div>

            {/* Hero Mockup (Interactive Exam Simulator Preview) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-16 w-full max-w-4xl rounded-xl border border-slate-200 bg-slate-50 shadow-2xl overflow-hidden relative"
            >
              {/* Mock Browser Header */}
              <div className="h-10 bg-slate-100 border-b border-slate-200 flex items-center px-4 justify-between">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="text-[11px] font-medium text-slate-400 select-none bg-white px-8 py-0.5 rounded border border-slate-200">
                  examsimula.com/jee-advanced-mock-test-4
                </div>
                <div className="w-12"></div>
              </div>

              {/* Mock Exam Content */}
              <div className="aspect-video bg-white flex flex-col overflow-hidden text-left text-xs p-4 border-t border-slate-100 select-none">
                {/* Header */}
                <div className="h-8 border-b border-slate-200 flex justify-between items-center px-2 bg-slate-50 text-[10px] font-bold text-blue-900 rounded-t">
                  <span>JEE Advanced 2024</span>
                  <div className="flex gap-4 items-center">
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">⏱️ 02:45:12</span>
                    <span className="bg-blue-800 text-white px-2 py-0.5 rounded font-semibold text-[9px]">Submit</span>
                  </div>
                </div>

                {/* Subheader */}
                <div className="h-7 border-b border-slate-200 flex justify-between items-center px-2 text-[9px] font-semibold text-slate-500 bg-white">
                  <div className="flex gap-2">
                    <span className="text-blue-900 border-b-2 border-blue-900 px-2 pb-0.5">Physics</span>
                    <span className="px-2">Chemistry</span>
                    <span className="px-2">Mathematics</span>
                  </div>
                  <span>Question 4 (Single Choice)</span>
                </div>

                {/* Split Panes */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Question Pane */}
                  <div className="flex-1 p-3 flex flex-col justify-between border-r border-slate-200">
                    <div className="space-y-2">
                      <div className="font-semibold text-slate-800 text-[11px]">
                        A particle of mass $m$ is moving in a circular path of constant radius $r$ such that its centripetal acceleration $a_c$ is varying with time $t$ as $a_c = k^2rt^2$. The power delivered to the particle is:
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2 border border-blue-100 bg-blue-50/40 rounded flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-blue-700 bg-blue-100 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-900"></div></div>
                          <span className="text-slate-700 text-[9px] font-semibold">(B) $mk^2r^2t$</span>
                        </div>
                        <div className="p-2 border border-slate-200 rounded flex items-center gap-2">
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>
                          <span className="text-slate-600 text-[9px]">(D) $0$</span>
                        </div>
                      </div>
                    </div>
                    {/* Mock Action Panel */}
                    <div className="h-8 border-t border-slate-100 flex justify-between items-center pt-2">
                      <span className="text-[8px] text-blue-900 border border-blue-900 px-2 py-0.5 rounded font-medium">Clear Response</span>
                      <span className="text-[8px] bg-blue-900 text-white px-3 py-1 rounded font-bold">Save & Next</span>
                    </div>
                  </div>

                  {/* Right Palette Pane */}
                  <div className="w-44 bg-slate-50 p-2 flex flex-col justify-between text-[8px]">
                    <div className="space-y-2">
                      <div className="border-b border-slate-200 pb-2">
                        <div className="font-bold text-slate-700">Rahul Sharma</div>
                        <div className="text-[7px] text-slate-400">Roll No: 24JEE4589</div>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold">1</div>
                        <div className="w-6 h-6 rounded bg-red-500 text-white flex items-center justify-center font-bold">2</div>
                        <div className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center font-bold">3</div>
                        <div className="w-6 h-6 rounded border border-blue-800 bg-white text-slate-800 flex items-center justify-center font-bold ring-1 ring-blue-800">4</div>
                        <div className="w-6 h-6 rounded border border-slate-300 bg-white text-slate-700 flex items-center justify-center font-medium">5</div>
                        <div className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center font-bold relative">
                          6 <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-600 rounded-full border border-white"></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center font-semibold text-slate-400 border-t border-slate-200 pt-2 text-[7px]">
                      Physics Palette • 20 Questions
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>


        {/* Statistics Banner - Temporarily hidden
        <section className="py-12 bg-slate-100 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-slate-200">
              <div className="text-center px-4">
                <Users className="w-6 h-6 mx-auto mb-2 text-blue-900" />
                <h3 className="text-3xl font-bold text-blue-900 mb-1">500K+</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Students Registered</p>
              </div>
              <div className="text-center px-4">
                <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                <h3 className="text-3xl font-bold text-blue-900 mb-1">2M+</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Tests Attempted</p>
              </div>
              <div className="text-center px-4">
                <BookOpen className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                <h3 className="text-3xl font-bold text-blue-900 mb-1">10,000+</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Mock Papers</p>
              </div>
              <div className="text-center px-4">
                <Monitor className="w-6 h-6 mx-auto mb-2 text-blue-800" />
                <h3 className="text-3xl font-bold text-blue-900 mb-1">98%</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Success Rate Match</p>
              </div>
            </div>
          </div>
        </section>
        */}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-base font-bold text-white flex items-center gap-1">
            <Award className="w-5 h-5 text-blue-400" />
            ExamSimula
          </div>
          <ul className="flex flex-wrap justify-center gap-6 text-xs font-semibold">
            <li>
              <button onClick={onGoToDashboard} className="hover:text-white transition-colors">
                Terms of Service
              </button>
            </li>
            <li>
              <button onClick={onGoToDashboard} className="hover:text-white transition-colors">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={onGoToDashboard} className="hover:text-white transition-colors">
                Contact Support
              </button>
            </li>
            <li>
              <button onClick={onGoToDashboard} className="hover:text-white transition-colors">
                Technical Requirements
              </button>
            </li>
          </ul>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} ExamSimula Technologies Pvt Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
