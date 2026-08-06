export interface ExamMetadata {
  duration: string;
  questions: string;
  marks: string;
  difficulty: string;
  negativeMarking: string;
}

export const EXAM_METADATA: Record<string, ExamMetadata> = {
  "jee_main": {
    duration: "3 Hours",
    questions: "75 Qs",
    marks: "300 Marks",
    difficulty: "Hard",
    negativeMarking: "Yes (-1 per wrong)"
  },
  "default": {
    duration: "1 Hour",
    questions: "30 Qs",
    marks: "120 Marks",
    difficulty: "Medium",
    negativeMarking: "No"
  }
};

export const getExamMetadata = (title: string): ExamMetadata => {
  const normalizedTitle = title.toLowerCase();
  for (const [key, meta] of Object.entries(EXAM_METADATA)) {
    if (key !== 'default' && normalizedTitle.includes(key)) {
      return meta;
    }
  }
  return EXAM_METADATA['default'];
};
