import React from "react";
import "katex/dist/katex.min.css";
import { renderPreviewHtml } from "../utils/mathFormatters";

interface MathTextProps {
  text: string;
  diagramsText?: string;
}

export const MathText = ({ text, diagramsText }: MathTextProps) => {
  if (!text) return null;
  
  const html = renderPreviewHtml(text, diagramsText);
  
  return (
    <div className="w-full max-w-full break-words overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
  );
};
