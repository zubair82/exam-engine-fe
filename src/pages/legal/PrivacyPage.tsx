import React from 'react';
import MarkdownLegalDoc from './MarkdownLegalDoc';
import privacyMarkdown from '../../content/privacy.md?raw';

export default function PrivacyPage() {
  return (
    <MarkdownLegalDoc
      rawMarkdown={privacyMarkdown}
      activeTab="privacy"
      defaultTitle="Privacy Policy & Data Protection"
      defaultSubtitle="How ExamSimula collects, utilizes, retains, and protects personal information for students and educators."
    />
  );
}
