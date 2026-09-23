import { ExamTypeConfig } from '../types';

export const DEFAULT_EXAM_TYPES: ExamTypeConfig[] = [
  {
    exam_code: 'JEE',
    name: 'JEE Main & Advanced',
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    duration_seconds: 10800,
    total_questions: 75,
    total_marks: 300,
    is_active: true
  },
  {
    exam_code: 'NEET',
    name: 'NEET UG',
    subjects: ['Physics', 'Chemistry', 'Biology'],
    duration_seconds: 12000,
    total_questions: 180,
    total_marks: 720,
    is_active: true
  },
  {
    exam_code: 'CAT',
    name: 'Common Admission Test',
    subjects: ['Quantitative Aptitude', 'DILR', 'VARC'],
    duration_seconds: 7200,
    total_questions: 66,
    total_marks: 198,
    is_active: true
  },
  {
    exam_code: 'GMAT',
    name: 'GMAT Focus Edition',
    subjects: ['Quantitative', 'Verbal', 'Data Insights'],
    duration_seconds: 8100,
    total_questions: 64,
    total_marks: 805,
    is_active: true
  },
  {
    exam_code: 'CSAT',
    name: 'UPSC Civil Services Aptitude Test',
    subjects: ['General Studies', 'Analytical Reasoning', 'Reading Comprehension'],
    duration_seconds: 7200,
    total_questions: 80,
    total_marks: 200,
    is_active: true
  }
];

let cachedExamTypes: ExamTypeConfig[] | null = null;

export async function fetchExamTypes(token?: string | null): Promise<ExamTypeConfig[]> {
  const apiUrl = import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080';
  
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${apiUrl}/api/v1/exam-types`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cachedExamTypes = data.map((item: any) => ({
          exam_code: String(item.exam_code || item.code || item.id || '').toUpperCase(),
          name: item.name || item.title || item.exam_code,
          subjects: Array.isArray(item.subjects) 
            ? item.subjects 
            : typeof item.subjects === 'string'
            ? JSON.parse(item.subjects)
            : ['Section 1', 'Section 2', 'Section 3'],
          duration_seconds: item.duration_seconds || item.durationSeconds || 10800,
          total_questions: item.total_questions || item.totalQuestions || 75,
          total_marks: item.total_marks || item.totalMarks || 300,
          is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
        })).filter(item => item.is_active !== false);

        return cachedExamTypes;
      }
    }
  } catch (error) {
    console.warn('Could not fetch server-driven /api/v1/exam-types, falling back to discovered & default types:', error);
  }

  return cachedExamTypes || DEFAULT_EXAM_TYPES;
}

export function normalizeExamCategory(
  exam: { exam_code?: string; title?: string; category?: string },
  configuredTypes: ExamTypeConfig[] = DEFAULT_EXAM_TYPES
): string {
  const rawCat = (exam.category || '').trim();
  if (rawCat) return rawCat.toUpperCase();

  const code = (exam.exam_code || '').trim().toUpperCase();
  const title = (exam.title || '').trim().toUpperCase();

  for (const config of configuredTypes) {
    const c = config.exam_code.toUpperCase();
    if (
      code === c ||
      code.startsWith(c + '_') ||
      code.startsWith(c + '-') ||
      code.startsWith(c + ' ') ||
      code.includes(c) ||
      title.startsWith(c) ||
      title.includes(c)
    ) {
      return c;
    }
  }

  if (code.includes('_')) return code.split('_')[0];
  if (code.includes('-')) return code.split('-')[0];
  if (code) return code;

  return configuredTypes[0]?.exam_code || 'JEE';
}

export function matchesExamCategory(
  exam: { exam_code?: string; title?: string; category?: string },
  selectedCategory: string,
  configuredTypes: ExamTypeConfig[] = DEFAULT_EXAM_TYPES
): boolean {
  if (!selectedCategory || selectedCategory === 'All') return true;
  const target = selectedCategory.trim().toUpperCase();
  const detected = normalizeExamCategory(exam, configuredTypes).toUpperCase();

  if (detected === target) return true;

  const code = (exam.exam_code || '').trim().toUpperCase();
  const title = (exam.title || '').trim().toUpperCase();
  const cat = (exam.category || '').trim().toUpperCase();

  return cat.includes(target) || code.includes(target) || title.includes(target);
}
