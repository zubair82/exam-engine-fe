import React from 'react';
import MarkdownLegalDoc from './MarkdownLegalDoc';
import refundMarkdown from '../../content/refund.md?raw';

export default function RefundPolicyPage() {
  return (
    <MarkdownLegalDoc
      rawMarkdown={refundMarkdown}
      activeTab="refund"
      defaultTitle="Cancellation & Refund Policy"
      defaultSubtitle="Guidelines on order cancellations, payment refunds for digital mock tests, and failed transaction resolution on ExamSimula."
    />
  );
}
