import React from 'react';
import MarkdownLegalDoc from './MarkdownLegalDoc';
import termsMarkdown from '../../content/terms.md?raw';

export default function TermsPage() {
  return (
    <MarkdownLegalDoc
      rawMarkdown={termsMarkdown}
      activeTab="terms"
      defaultTitle="Terms of Use & Educator Rules"
      defaultSubtitle="Terms and conditions governing student examination access, multi-creator marketplace rules, and educator content licensing on ExamSimula."
    />
  );
}
