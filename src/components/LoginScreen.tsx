import React from 'react';
import { motion } from 'motion/react';
import { Shield, User, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LoginScreen() {
  const navigate = useNavigate();
  console.log("ENV:", import.meta.env);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 selection:bg-blue-100 selection:text-blue-900">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden"
      >
        <div className="p-8 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 mb-5 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome to ExamSimula</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">Please select your login type to continue</p>
        </div>
        
        <div className="p-8 space-y-4">
          <a 
            href="http://localhost:5001/api/v1/auth/google/login?role=STUDENT"
            className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <User className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900">Student Portal</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">Access mock tests & analytics</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500 transition-colors">chevron_right</span>
          </a>

          <a 
            href="http://localhost:5001/api/v1/auth/google/login?role=ADMIN"
            className="w-full flex items-center justify-between p-4 border-2 border-slate-100 rounded-xl hover:border-primary-container hover:bg-primary-container/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-container/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                <Shield className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-900">Admin Portal</div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">Manage students & reports</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
          </a>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
          <button 
            onClick={() => navigate('/home')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            &larr; Back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
