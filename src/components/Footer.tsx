import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin, ExternalLink } from 'lucide-react';
import ExamSimulaLogo from './Logo';

interface FooterProps {
  compact?: boolean;
}

export default function Footer({ compact = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (compact) {
    return (
      <footer className="w-full bg-white dark:bg-[#1f2430] border-t border-slate-200 dark:border-slate-800 py-6 px-6 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ExamSimulaLogo size={20} />
            <span className="font-semibold text-slate-700 dark:text-slate-300">ExamSimula</span>
            <span>&copy; {currentYear} All rights reserved.</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium">
            <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Use</Link>
            <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link to="/refund-policy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Cancellation & Refund Policy</Link>
            <Link to="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full bg-slate-900 dark:bg-[#151821] text-slate-400 border-t border-slate-800 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand & Description (2 cols on large screens) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5 text-white text-xl font-bold tracking-tight">
              <ExamSimulaLogo size={32} />
              <span>ExamSimula</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              India's premier AI-powered exam simulation platform and multi-creator academic marketplace for JEE, NEET, and competitive exams.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Razorpay Secured & SSL Encrypted</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link to="/home" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/question-papers" className="hover:text-white transition-colors">Mock Test Papers</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">Student Dashboard</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">Student Portal Login</Link>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance (Razorpay Mandate) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Policies & Legal</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <Link to="/terms" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Terms of Use</span>
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors flex items-center gap-1">
                  <span>Cancellation & Refund</span>
                </Link>
              </li>
              <li>
                <Link to="/legal" className="hover:text-white transition-colors text-xs text-blue-400 flex items-center gap-1 mt-1">
                  <span>All Policies & Disclaimers</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Support & Office</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span className="text-xs leading-tight">
                  Bengaluru, Karnataka, India - 560102
                </span>
              </li>
              <li className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:support@examsimula.com" className="text-xs hover:text-white transition-colors">
                  support@examsimula.com
                </a>
              </li>
              <li className="pt-2">
                <Link 
                  to="/contact" 
                  className="inline-flex items-center justify-center w-full px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
                >
                  Contact Support Team
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            &copy; {currentYear} ExamSimula. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link to="/refund-policy" className="hover:text-slate-400 transition-colors">Refund Policy</Link>
            <Link to="/contact" className="hover:text-slate-400 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
