export interface ExamMetadata {
  duration: string;
  questions: string;
  marks: string;
  difficulty: string;
  negativeMarking: string;
}

export const EXAM_METADATA: Record<string, ExamMetadata> = {
  "jee": {
    duration: "3 Hours",
    questions: "75 Qs",
    marks: "300 Marks",
    difficulty: "Hard",
    negativeMarking: "Yes (-1 per wrong)"
  },
  "jee_main": {
    duration: "3 Hours",
    questions: "75 Qs",
    marks: "300 Marks",
    difficulty: "Hard",
    negativeMarking: "Yes (-1 per wrong)"
  },
  "jee_advanced": {
    duration: "3 Hours",
    questions: "54 Qs",
    marks: "180 Marks",
    difficulty: "Very Hard",
    negativeMarking: "Yes (-1 per wrong)"
  },
  "neet": {
    duration: "3 Hours 20 Mins",
    questions: "180 Qs",
    marks: "720 Marks",
    difficulty: "Hard",
    negativeMarking: "Yes (-1 per wrong)"
  },
  "cat": {
    duration: "2 Hours",
    questions: "66 Qs",
    marks: "198 Marks",
    difficulty: "Very Hard",
    negativeMarking: "Yes (-1 per wrong)"
  },
  "gmat": {
    duration: "2 Hours 15 Mins",
    questions: "64 Qs",
    marks: "805 Marks",
    difficulty: "Hard",
    negativeMarking: "Adaptive"
  },
  "csat": {
    duration: "2 Hours",
    questions: "80 Qs",
    marks: "200 Marks",
    difficulty: "Medium-Hard",
    negativeMarking: "Yes (-0.66 per wrong)"
  },
  "default": {
    duration: "3 Hours",
    questions: "75 Qs",
    marks: "300 Marks",
    difficulty: "Medium",
    negativeMarking: "Yes"
  }
};

export const getExamMetadata = (title: string, examCode?: string): ExamMetadata => {
  const normalized = `${title} ${examCode || ''}`.toLowerCase();
  for (const [key, meta] of Object.entries(EXAM_METADATA)) {
    if (key !== 'default' && (normalized.includes(key.replace('_', ' ')) || normalized.includes(key))) {
      return meta;
    }
  }
  return EXAM_METADATA['default'];
};
