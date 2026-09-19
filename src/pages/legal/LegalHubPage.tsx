import React, { useState } from 'react';
import LegalLayout from './LegalLayout';
import { BookOpen, ShieldCheck, RefreshCcw, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LegalHubPage() {
  const policies = [
    {
      title: 'Terms of Use & Educator Rules',
      description: 'Platform rules, educator content ownership & licensing, 70%/50%/20% revenue attribution matrix, and copyright warranties.',
      path: '/terms',
      icon: BookOpen,
      badge: 'Mandatory',
      badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
    },
    {
      title: 'Privacy Policy & Data Protection',
      description: 'Indian IT Act compliance, personal data collection, mock test telemetry, third-party service disclosure (Razorpay), and security safeguards.',
      path: '/privacy',
      icon: ShieldCheck,
      badge: 'Privacy Standard',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
    },
    {
      title: 'Cancellation & Refund Policy',
      description: 'Digital mock tests non-refundable terms, failed transactions auto-refund timeline (5-7 business days), and educator charge policies.',
      path: '/refund-policy',
      icon: RefreshCcw,
      badge: 'Razorpay Verified',
      badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
    },
    {
      title: 'Contact Us & Office Address',
      description: 'Registered office physical location in Bengaluru, official support email (support@examsimula.com), and ticket inquiry desk.',
      path: '/contact',
      icon: MapPin,
      badge: 'Help Desk',
      badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
    }
  ];

  return (
    <LegalLayout
      title="Legal & Compliance Hub"
      subtitle="Comprehensive legal policies, user agreements, data protection disclosures, and customer support standards for ExamSimula."
      activeTab="hub"
      lastUpdated="September 2026"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((p, idx) => {
          const Icon = p.icon;
          return (
            <Link
              key={idx}
              to={p.path}
              className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#1e2330] hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/20 transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/80 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                <span>Read Full Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* Compliance summary card */}
      <div className="p-5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Payment Gateway & Regulatory Compliance
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            ExamSimula adheres strictly to Reserve Bank of India (RBI) payment guidelines, Information Technology Act, 2000, and Razorpay Merchant Security standards.
          </div>
        </div>
        <Link
          to="/contact"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 shadow-sm transition-colors"
        >
          Contact Legal Team
        </Link>
      </div>
    </LegalLayout>
  );
}
