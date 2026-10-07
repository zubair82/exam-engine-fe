import React from "react";
import "katex/dist/katex.min.css";
import { renderPreviewHtml } from "../utils/mathFormatters";

interface MathTextProps {
  text: string;
  diagramsText?: string;
}

export const MathText = ({ text, diagramsText, className = '' }: MathTextProps & { className?: string }) => {
  if (!text) return null;
  
  const html = renderPreviewHtml(text, diagramsText);
  
  return (
    <span className={`inline leading-relaxed break-words ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
};
