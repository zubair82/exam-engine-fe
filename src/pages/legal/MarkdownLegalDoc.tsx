import React, { useMemo } from 'react';
import LegalLayout from './LegalLayout';
import { marked } from 'marked';
import { Link } from 'react-router-dom';

interface MarkdownLegalDocProps {
  rawMarkdown: string;
  activeTab: 'terms' | 'privacy' | 'refund';
  defaultTitle: string;
  defaultSubtitle?: string;
  defaultLastUpdated?: string;
}

export function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { meta: {}, content: raw };
  }
  const metaLines = match[1].split(/\r?\n/);
  const meta: Record<string, string> = {};
  for (const line of metaLines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      meta[key] = val;
    }
  }
  return { meta, content: match[2] };
}

export default function MarkdownLegalDoc({
  rawMarkdown,
  activeTab,
  defaultTitle,
  defaultSubtitle,
  defaultLastUpdated = 'September 2026'
}: MarkdownLegalDocProps) {
  const { meta, content } = useMemo(() => parseFrontmatter(rawMarkdown), [rawMarkdown]);

  const title = meta.title || defaultTitle;
  const subtitle = meta.subtitle || defaultSubtitle;
  const lastUpdated = meta.lastUpdated || defaultLastUpdated;

  const htmlContent = useMemo(() => {
    // Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: false,
    });
    return marked.parse(content) as string;
  }, [content]);

  return (
    <LegalLayout
      title={title}
      subtitle={subtitle}
      activeTab={activeTab}
      lastUpdated={lastUpdated}
    >
      <div 
        className="legal-prose space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />

      {/* Persistent Cross-Navigation Footer */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link to="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
          Terms of Use &rarr;
        </Link>
        <span>•</span>
        <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
          Privacy Policy &rarr;
        </Link>
        <span>•</span>
        <Link to="/refund-policy" className="text-blue-600 dark:text-blue-400 hover:underline">
          Cancellation & Refund Policy &rarr;
        </Link>
        <span>•</span>
        <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">
          Support Office Details &rarr;
        </Link>
      </div>
    </LegalLayout>
  );
}
