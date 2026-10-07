/**
 * Question evaluation utilities for Exam Engine
 * Handles single select, multiple select, and numerical question comparisons,
 * parsing comma-separated answer keys (e.g. "A,B,C,D", "A, C"), and score calculations.
 */

export const isMultipleSelectQuestion = (type?: string): boolean => {
  if (!type) return false;
  const lower = type.toLowerCase().replace(/[_\s-]+/g, ' ').trim();
  if (lower.includes('single')) return false;
  if (lower.includes('numerical') || lower.includes('integer')) return false;
  return (
    lower.includes('multiple select') ||
    lower.includes('multi select') ||
    lower.includes('multiple choice') ||
    lower.includes('multi choice') ||
    lower.includes('more than one') ||
    lower.includes('one or more') ||
    lower.includes('multiple')
  );
};

export const parseCorrectOptionIndices = (answerStr?: string | number | null): number[] => {
  if (answerStr === undefined || answerStr === null || answerStr === '') return [];
  if (typeof answerStr === 'number') return [answerStr];

  const clean = String(answerStr).trim().toUpperCase();
  const tokens = clean.split(/[,\s;/]+/).map(t => t.trim()).filter(Boolean);
  const result: number[] = [];

  tokens.forEach(tok => {
    if (tok.startsWith('A') || tok === '1') result.push(0);
    else if (tok.startsWith('B') || tok === '2') result.push(1);
    else if (tok.startsWith('C') || tok === '3') result.push(2);
    else if (tok.startsWith('D') || tok === '4') result.push(3);
    else if (!isNaN(parseInt(tok, 10))) {
      const n = parseInt(tok, 10);
      if (n >= 0 && n <= 3) result.push(n);
    }
  });

  return Array.from(new Set(result)).sort((a, b) => a - b);
};

export const parseStudentOptionIndices = (studentAnswer: any): number[] => {
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') return [];
  if (Array.isArray(studentAnswer)) {
    return studentAnswer.map(n => Number(n)).filter(n => !isNaN(n) && n >= 0).sort((a, b) => a - b);
  }
  if (typeof studentAnswer === 'number') {
    return [studentAnswer];
  }
  if (typeof studentAnswer === 'string') {
    try {
      const parsed = JSON.parse(studentAnswer);
      if (Array.isArray(parsed)) {
        return parsed.map(n => Number(n)).filter(n => !isNaN(n) && n >= 0).sort((a, b) => a - b);
      }
    } catch {
      // not json
    }
    const clean = studentAnswer.trim().toUpperCase();
    const tokens = clean.split(/[,\s;/]+/).map(t => t.trim()).filter(Boolean);
    const result: number[] = [];
    tokens.forEach(tok => {
      if (tok.startsWith('A') || tok === '0') result.push(0);
      else if (tok.startsWith('B') || tok === '1') result.push(1);
      else if (tok.startsWith('C') || tok === '2') result.push(2);
      else if (tok.startsWith('D') || tok === '3') result.push(3);
      else if (!isNaN(parseInt(tok, 10))) {
        result.push(parseInt(tok, 10));
      }
    });
    return Array.from(new Set(result)).sort((a, b) => a - b);
  }
  return [];
};

export const evaluateQuestionAnswer = (
  qType: string | undefined,
  studentAnswer: any,
  correctOption: number | undefined,
  correctAnswerText: string | undefined
): { isAttempted: boolean; isCorrect: boolean } => {
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === '') {
    return { isAttempted: false, isCorrect: false };
  }

  const isMulti = isMultipleSelectQuestion(qType);
  const isNumerical = qType?.toLowerCase().includes('numerical') || qType?.toLowerCase().includes('integer');

  if (isNumerical) {
    const extractedSelected = String(studentAnswer).match(/-?\d+(\.\d+)?/);
    const extractedCorrect = String(correctAnswerText || '').match(/-?\d+(\.\d+)?/);
    const valSelected = extractedSelected ? parseFloat(extractedSelected[0]) : NaN;
    const valCorrect = extractedCorrect ? parseFloat(extractedCorrect[0]) : NaN;
    const isCorrect = !isNaN(valSelected) && !isNaN(valCorrect) && valSelected === valCorrect;
    return { isAttempted: true, isCorrect };
  }

  if (isMulti) {
    const studentOpts = parseStudentOptionIndices(studentAnswer);
    if (studentOpts.length === 0) return { isAttempted: false, isCorrect: false };

    const correctOpts = parseCorrectOptionIndices(correctAnswerText ?? correctOption);
    if (correctOpts.length === 0) return { isAttempted: true, isCorrect: false };

    const isCorrect =
      studentOpts.length === correctOpts.length &&
      studentOpts.every((opt, idx) => opt === correctOpts[idx]);

    return { isAttempted: true, isCorrect };
  }

  // Single choice
  const studentOpts = parseStudentOptionIndices(studentAnswer);
  if (studentOpts.length === 0) return { isAttempted: false, isCorrect: false };

  const correctOpts = parseCorrectOptionIndices(correctAnswerText ?? correctOption);
  const targetOpt = correctOpts.length > 0 ? correctOpts[0] : (correctOption !== undefined ? correctOption : -1);
  const isCorrect = studentOpts.length === 1 && studentOpts[0] === targetOpt;

  return { isAttempted: true, isCorrect };
};
