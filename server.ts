import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 9000;

  // Middleware
  app.use(express.json());

  // Server-driven Exam Types Configuration Endpoint
  app.get('/api/v1/exam-types', (_req, res) => {
    res.json([
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
    ]);
  });

  // Serve Frontend
  if (process.env.NODE_ENV !== 'production') {
    // Integrate Vite in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind and listen exclusively on port PORT and host 0.0.0.0 (required by cloud runner environment)
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ExamSimula Server] running on http://localhost:${PORT} under NODE_ENV=${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((error) => {
  console.error('Fatal server startup error:', error);
});

