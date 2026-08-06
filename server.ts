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
