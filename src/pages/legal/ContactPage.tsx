import React, { useState } from 'react';
import LegalLayout from './LegalLayout';
import { Mail, MapPin, Globe, Clock, Copy, Check, Building, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import contactData from '../../content/contact.json';

export default function ContactPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <LegalLayout
      title={contactData.title}
      subtitle={contactData.subtitle}
      activeTab="contact"
      lastUpdated={contactData.lastUpdated}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Intro Message */}
        <div className="text-center space-y-2 pb-2">
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            {contactData.intro}
          </p>
        </div>

        {/* Centered Structured Cards */}
        <div className="space-y-4">
          
          {/* Business Name */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#1e2330] flex items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Business Name</div>
                <div className="font-bold text-slate-900 dark:text-slate-100 text-base">{contactData.businessName}</div>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
              {contactData.badge}
            </span>
          </div>

          {/* Official Support Email */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#1e2330] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Official Support Email</div>
                <a 
                  href={`mailto:${contactData.email}`}
                  className="font-bold text-blue-600 dark:text-blue-400 text-base hover:underline flex items-center gap-1 mt-0.5"
                >
                  {contactData.email}
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
            <button
              onClick={() => handleCopy(contactData.email, "email")}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              {copiedField === 'email' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied Email</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Email</span>
                </>
              )}
            </button>
          </div>

          {/* Operating Hours */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#1e2330] flex items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Operating Hours</div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                  {contactData.operatingHours}
                </div>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">
              Response: {contactData.responseTime}
            </span>
          </div>

          {/* Operating Address */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#1e2330] flex flex-col sm:flex-row sm:items-start justify-between gap-4 transition-colors">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Operating Address</div>
                <div className="font-medium text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
                  {contactData.address.lines.map((line: string, i: number) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < contactData.address.lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleCopy(contactData.address.copyText, "address")}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 shadow-sm"
            >
              {copiedField === 'address' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>

          {/* Website Link Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#1e2330] flex items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Official Website</div>
                <a 
                  href={contactData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  {contactData.website}
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
            <a
              href={`mailto:${contactData.email}`}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
            >
              Email Support
            </a>
          </div>

        </div>

        {/* Policy Cross-links */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link to="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Terms of Use
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link to="/refund-policy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Cancellation & Refund Policy
          </Link>
        </div>

      </div>
    </LegalLayout>
  );
}
