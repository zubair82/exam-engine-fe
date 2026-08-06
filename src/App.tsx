import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import LandingScreen from './components/LandingScreen';
import DashboardScreen from './components/DashboardScreen';
import ExamsListScreen from './components/ExamsListScreen';
import ExamScreen from './components/ExamScreen';
import ReportScreen from './components/ReportScreen';
import AdminDashboardScreen from './components/AdminDashboardScreen';
import LoginScreen from './components/LoginScreen';
import InstructionsScreen from './components/InstructionsScreen';
import { Exam, ExamSession, AISuggestion, Subject, Question } from './types';
import { useAuth } from './contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role.toLowerCase())) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeExam, setActiveExam] = useState<Exam | null>(() => {
    try {
      const saved = sessionStorage.getItem('activeExam');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [session, setSession] = useState<ExamSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(() => {
    const saved = localStorage.getItem('current_ai_suggestion');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (activeExam) sessionStorage.setItem('activeExam', JSON.stringify(activeExam));
    else sessionStorage.removeItem('activeExam');
  }, [activeExam]);

  useEffect(() => {
    if (session) sessionStorage.setItem('session', JSON.stringify(session));
    else sessionStorage.removeItem('session');
  }, [session]);

  useEffect(() => {
    if (aiSuggestion) sessionStorage.setItem('aiSuggestion', JSON.stringify(aiSuggestion));
    else sessionStorage.removeItem('aiSuggestion');
  }, [aiSuggestion]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const streakDays = 12;

  // Check if server-side Gemini API is configured
  useEffect(() => {
    fetch('http://localhost:8080/api/v1/ai/status')
      .then((res) => res.json())
      .then((data) => {
        setGeminiConfigured(!!data.configured);
      })
      .catch((err) => {
        console.warn('Could not contact backend API status:', err.message);
        setGeminiConfigured(false);
      });
  }, []);

  // Poll for analytics when in processing state
  useEffect(() => {
    let intervalId: any;
    
    if (aiSuggestion?.status === 'processing' && session?.paperId) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:8080/api/v1/report/${session.paperId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          });
          
          if (res.ok) {
            const report = await res.json();
            if (report.analytics && report.analytics.summary) {
              setAiSuggestion(report.analytics);
              localStorage.setItem('current_ai_suggestion', JSON.stringify(report.analytics));
              clearInterval(intervalId);
            }
          }
        } catch (err) {
          console.error("Failed to poll for analytics", err);
        }
      }, 3000); // Check every 3 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [aiSuggestion?.status, session?.paperId]);

  // Set up or resume exam session from backend
  const handleStartExam = async (paperId: number) => {
    try {
      // 0. Fetch exams list to get total questions
      const examsRes = await fetch('http://localhost:8080/api/v1/exams', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!examsRes.ok) throw new Error('Failed to fetch exams list');
      const examsData = await examsRes.json();
      const currentExamMeta = examsData.find((e: any) => Number(e.paper_id) === Number(paperId));
      const totalQuestions = currentExamMeta && currentExamMeta.total_questions ? currentExamMeta.total_questions : 75;

      // Fetch FIRST question dynamically to load UI instantly
      const firstQRes = await fetch(`http://localhost:8080/api/v1/exams/${paperId}/questions/1`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const firstQ = firstQRes.ok ? await firstQRes.json() : null;
      
      if (!firstQ) {
        alert("Failed to load the first question from the server.");
        return;
      }

      // Helper to safely parse options into an array
      const parseOptions = (opts: string | null | undefined): string[] => {
        if (!opts) return [];
        try {
          const parsed = JSON.parse(opts);
          if (Array.isArray(parsed)) return parsed;
          if (typeof parsed === 'object' && parsed !== null) {
            // Assuming options like {"A": "ans1", "B": "ans2"}
            return Object.values(parsed);
          }
        } catch (e) {
          console.error("Failed to parse options:", e);
        }
        return [];
      };

      const normalizeSubject = (subj?: string | null, fallbackIndex: number = 0, total: number = 75): Subject => {
        if (subj) {
          const lower = subj.toLowerCase().trim();
          if (lower.includes('math')) return 'Mathematics';
          if (lower.includes('chem')) return 'Chemistry';
          if (lower.includes('phy')) return 'Physics';
        }
        const sectionSize = Math.floor(total / 3);
        if (fallbackIndex < sectionSize) return 'Physics';
        if (fallbackIndex < sectionSize * 2) return 'Chemistry';
        return 'Mathematics';
      };

      // Initialize all questions with stubs, filling the first one with real data
      const initialQuestions: Question[] = Array(totalQuestions).fill(null).map((_, i) => {
        if (i === 0) {
          return {
            id: firstQ.question_no,
            subject: normalizeSubject(firstQ.subject, i, totalQuestions),
            text: firstQ.question_latex || '',
            options: parseOptions(firstQ.options),
            correctOption: -1,
            solution: 'Solution available after submission.',
            type: firstQ.question_type || 'Single Choice Type',
            diagrams: firstQ.diagrams,
            topic: firstQ.tag,
            estimatedTimeSeconds: firstQ.estimated_time_seconds ?? firstQ.estimatedTimeSeconds
          };
        }
        return {
          id: i + 1,
          subject: normalizeSubject(null, i, totalQuestions), // Fallback subject by section index until loaded
          text: 'Loading question content...',
          options: [],
          correctOption: -1,
          solution: '',
          type: 'Single Choice Type',
          _isLoading: true
        };
      });

      const examDuration = currentExamMeta && currentExamMeta.duration_seconds ? currentExamMeta.duration_seconds : 10800;

      const exam: Exam = {
        id: String(paperId),
        name: currentExamMeta && currentExamMeta.title ? currentExamMeta.title : `Mock Test ${paperId}`,
        description: 'Mock Test loaded from server',
        duration: examDuration,
        questions: initialQuestions
      };

      // Kick off background fetch for the rest of the questions
      setTimeout(() => {
        const fetchRest = async () => {
          const promises = [];
          for (let i = 2; i <= totalQuestions; i++) {
            promises.push(
              fetch(`http://localhost:8080/api/v1/exams/${paperId}/questions/${i}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
              }).then(r => r.ok ? r.json() : null).catch(() => null)
            );
          }
          const restData = await Promise.all(promises);
          
          setActiveExam(prev => {
            if (!prev) return prev;
            const updatedQs = [...prev.questions];
            restData.forEach((q, idx) => {
              if (q) {
                updatedQs[idx + 1] = {
                  id: q.question_no,
                  subject: normalizeSubject(q.subject, idx + 1, totalQuestions),
                  text: q.question_latex || '',
                  options: parseOptions(q.options),
                  correctOption: -1,
                  solution: 'Solution available after submission.',
                  type: q.question_type || 'Single Choice Type',
                  diagrams: q.diagrams,
                  topic: q.tag,
                  estimatedTimeSeconds: q.estimated_time_seconds ?? q.estimatedTimeSeconds
                };
              }
            });
            return { ...prev, questions: updatedQs };
          });
        };
        fetchRest();
      }, 100);

      setActiveExam(exam);

      // 1. Initialize session on the backend
      const res = await fetch(`http://localhost:8080/api/v1/exam/${paperId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        credentials: 'include'
      });

      if (!res.ok && res.status !== 409) {
        throw new Error('Failed to start exam');
      }

      // 2. Resume session state from backend
      const resumeRes = await fetch(`http://localhost:8080/api/v1/exam/session/resume?paper_id=${paperId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        credentials: 'include'
      });

      if (!resumeRes.ok) {
        throw new Error('Failed to resume exam');
      }

      const sessionData = await resumeRes.json();
      
      const parsedAnswers = typeof sessionData.answers === 'string' ? JSON.parse(sessionData.answers) : sessionData.answers || {};
      const parsedStatuses = typeof sessionData.palette_state === 'string' ? JSON.parse(sessionData.palette_state) : sessionData.palette_state || {};
      const parsedTimeSpent = typeof sessionData.time_spent === 'string' ? JSON.parse(sessionData.time_spent) : sessionData.time_spent || {};

      const timeSpent: Record<string, number> = {};
      exam.questions.forEach((q) => {
        if (!parsedStatuses[q.id]) {
          parsedStatuses[q.id] = 'unvisited';
        }
        timeSpent[q.id] = parsedTimeSpent[q.id] || 0;
      });

      setSession({
        paperId: paperId,
        answers: parsedAnswers,
        statuses: parsedStatuses,
        timeSpent: timeSpent,
        secondsRemaining: sessionData.remaining_seconds,
        isCompleted: false,
        cheatingWarnings: sessionData.violations || 0
      });

      navigate('/exam', { replace: true });
    } catch (error) {
      console.error('Error starting/resuming exam:', error);
      alert('Error starting exam: ' + (error as Error).message);
    }
  };
  // View Report for a submitted exam
  const handleViewReport = async (paperId: number) => {
    try {
      // 0. Fetch exams list to get total questions
      const examsRes = await fetch('http://localhost:8080/api/v1/exams', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!examsRes.ok) throw new Error('Failed to fetch exams list');
      const examsData = await examsRes.json();
      const currentExamMeta = examsData.find((e: any) => Number(e.paper_id) === Number(paperId));
      const totalQuestions = currentExamMeta && currentExamMeta.total_questions ? currentExamMeta.total_questions : 75;
      const examDuration = currentExamMeta && currentExamMeta.duration_seconds ? currentExamMeta.duration_seconds : 10800;

      // 1. Fetch Report Data
      const res = await fetch(`http://localhost:8080/api/v1/report/${paperId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!res.ok) throw new Error('Failed to fetch report data');
      const report = await res.json();

      // Fetch Answer Key
      let answersMap: Record<string, string> = {};
      try {
        const ansRes = await fetch(`http://localhost:8080/api/v1/exam/${paperId}/answer`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (ansRes.ok) {
          answersMap = await ansRes.json();
        }
      } catch (err) {
        console.error("Failed to fetch answer key", err);
      }

      // Generate dummy questions
      let dummyQuestions: Question[] = Array(totalQuestions).fill(null).map((_, i) => {
        let subj = 'Physics';
        if (totalQuestions === 75 || totalQuestions === 90) {
           const third = totalQuestions / 3;
           if (i < third) subj = 'Physics';
           else if (i < 2 * third) subj = 'Chemistry';
           else subj = 'Mathematics';
        }

        // Determine type based on standard JEE MAIN structure (last 5 of every 25 are numerical)
        let isNumerical = false;
        if (totalQuestions === 75) {
            const numInSubj = (i) % 25;
            if (numInSubj >= 20) isNumerical = true;
        }
        const type = isNumerical ? 'numerical' : 'Single Choice Type';

        return {
          id: i + 1,
          subject: subj as Subject,
          text: `Question ${i + 1}`,
          options: [],
          correctOption: -1,
          solution: 'Solution not fetched.',
          type: type
        };
      });

      // Map dummy questions with correct options exactly like handleSubmitExam
      dummyQuestions = dummyQuestions.map(q => {
        let correctOpt = -1;
        const ansStr = answersMap[q.id];
        if (ansStr) {
           const cleanStr = String(ansStr).trim().toUpperCase();
           if (cleanStr.startsWith('A.') || cleanStr.startsWith('A ') || cleanStr === 'A' || cleanStr === '1') correctOpt = 0;
           else if (cleanStr.startsWith('B.') || cleanStr.startsWith('B ') || cleanStr === 'B' || cleanStr === '2') correctOpt = 1;
           else if (cleanStr.startsWith('C.') || cleanStr.startsWith('C ') || cleanStr === 'C' || cleanStr === '3') correctOpt = 2;
           else if (cleanStr.startsWith('D.') || cleanStr.startsWith('D ') || cleanStr === 'D' || cleanStr === '4') correctOpt = 3;
        }
        return { ...q, correctOption: correctOpt, correctAnswerText: ansStr };
      });

      const exam: Exam = {
        id: String(paperId),
        name: currentExamMeta && currentExamMeta.title ? currentExamMeta.title : `Mock Test ${paperId}`,
        description: 'Mock Test loaded from server',
        duration: examDuration,
        questions: dummyQuestions
      };

      setActiveExam(exam);

      // Parse attempt state directly from report payload
      const parsedAnswers = report.answer_sheet || {};
      
      // Convert string indices like "0" back to integers for Single Choice
      Object.keys(parsedAnswers).forEach(key => {
         const val = parsedAnswers[key];
         const dummyQ = dummyQuestions.find(q => q.id.toString() === key);
         if (dummyQ && dummyQ.type !== 'numerical') {
            if (typeof val === 'string' && !isNaN(parseInt(val))) {
               parsedAnswers[key] = parseInt(val);
            }
         }
      });
      
      const parsedStatuses = report.palette_state || {};
      let parsedTimeSpent: Record<string, number> = {};
      if (report.session_metadata) {
        if (report.session_metadata.time_spent) {
          parsedTimeSpent = typeof report.session_metadata.time_spent === 'string' 
            ? JSON.parse(report.session_metadata.time_spent) 
            : report.session_metadata.time_spent;
        }
      }

      const timeSpent: Record<string, number> = {};
      exam.questions.forEach((q) => {
        timeSpent[q.id] = parsedTimeSpent[q.id] || 0;
        if (!parsedStatuses[q.id]) {
          parsedStatuses[q.id] = 'unvisited';
        }
      });

      // Calculate score exactly like handleSubmitExam
      let calculatedScore = 0;
      dummyQuestions.forEach((q) => {
         const selected = parsedAnswers[q.id];
         if (selected !== undefined) {
           if (q.type === 'numerical') {
             const extractedSelected = String(selected).match(/-?\d+(\.\d+)?/);
             const extractedCorrect = String(q.correctAnswerText).match(/-?\d+(\.\d+)?/);
             const valSelected = extractedSelected ? parseFloat(extractedSelected[0]) : NaN;
             const valCorrect = extractedCorrect ? parseFloat(extractedCorrect[0]) : NaN;

             if (!isNaN(valSelected) && !isNaN(valCorrect) && valSelected === valCorrect) {
               calculatedScore += 4;
             } else {
               calculatedScore -= 1;
             }
           } else {
             if (selected === q.correctOption) calculatedScore += 4;
             else calculatedScore -= 1;
           }
         }
      });

      let reportStats = undefined;
      if (report.session_metadata && report.session_metadata.correct_count !== undefined) {
        reportStats = {
          correctCount: report.session_metadata.correct_count,
          incorrectCount: report.session_metadata.incorrect_count,
          unattemptedCount: report.session_metadata.unattempted_count,
          totalTimeSpent: report.session_metadata.total_time_spent
        };
      }

      setSession({
        paperId: paperId,
        answers: parsedAnswers,
        statuses: parsedStatuses,
        timeSpent: timeSpent,
        secondsRemaining: 0,
        isCompleted: true,
        cheatingWarnings: 0,
        score: report.obtained_marks !== undefined ? report.obtained_marks : calculatedScore,
        reportStats: reportStats
      });

      if (report.analytics) {
         setAiSuggestion(report.analytics);
         localStorage.setItem('current_ai_suggestion', JSON.stringify(report.analytics));
      } else {
        setAiSuggestion(null);
        localStorage.removeItem('current_ai_suggestion');
      }

      navigate('/report');
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error fetching report: ' + (error as Error).message);
    }
  };


  // Launch customized AI focus test by calling backend
  const handleStartAIFocusTest = async (topic: string, subject: string) => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/ai/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, subject }),
      });
      if (!res.ok) {
        throw new Error('Server returned an error generating focus test');
      }
      
      const customQuestions = await res.json();
      
      const aiExam: Exam = {
        id: `ai-focus-${Date.now()}`,
        name: `AI Focus: ${topic}`,
        description: `Custom generated diagnostic quiz • ${subject}`,
        duration: 900, // 15 mins for 5 questions
        questions: customQuestions,
      };

      const aiSession: ExamSession = {
        paperId: 0, // AI exams not fully supported by int paperId yet
        answers: {},
        statuses: {},
        timeSpent: {},
        secondsRemaining: aiExam.duration,
        isCompleted: false,
        cheatingWarnings: 0,
      };

      aiExam.questions.forEach((q) => {
        aiSession.statuses[q.id] = 'unvisited';
        aiSession.timeSpent[q.id] = 0;
      });

      setActiveExam(aiExam);
      setSession(aiSession);
      navigate('/exam');
    } catch (err: any) {
      console.error('Error launching AI quiz:', err.message);
    }
  };

  // Update session state
  const handleUpdateSession = (updatedSession: ExamSession) => {
    setSession((prevSession) => {
      // Only hit the API instantly if answers or statuses have actually changed!
      // This prevents the 1-second timer tick from spamming the backend.
      if (
        prevSession && 
        (JSON.stringify(prevSession.answers) !== JSON.stringify(updatedSession.answers) ||
         JSON.stringify(prevSession.statuses) !== JSON.stringify(updatedSession.statuses))
      ) {
        fetch('http://localhost:8080/api/v1/exam/session/autosave', {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          credentials: 'include',
          body: JSON.stringify({
            paper_id: updatedSession.paperId,
            updates: {
              answers: JSON.stringify(updatedSession.answers),
              palette_state: JSON.stringify(updatedSession.statuses),
              time_spent: JSON.stringify(updatedSession.timeSpent)
            }
          })
        }).catch(err => console.error("Autosave failed:", err));
      }
      return updatedSession;
    });
  };

  // Autosave every 5 seconds
  useEffect(() => {
    if (!session || session.isCompleted || location.pathname !== '/exam') return;

    const intervalId = setInterval(() => {
      fetch('http://localhost:8080/api/v1/exam/session/autosave', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        credentials: 'include',
        body: JSON.stringify({
          paper_id: session.paperId,
          updates: {
            answers: JSON.stringify(session.answers),
            palette_state: JSON.stringify(session.statuses),
            time_spent: JSON.stringify(session.timeSpent)
          }
        })
      }).catch(err => console.error("Periodic autosave failed:", err));
    }, 5000);

    return () => clearInterval(intervalId);
  }, [session, location.pathname]);

  // Request server-side AI evaluation of weak topics on submit
  const triggerAIEvaluation = async (completedSession: ExamSession, attemptId: string, questions: Question[]) => {
    setLoadingAI(true);
    try {
      let correctCount = 0;
      let incorrectCount = 0;
      let guessedAnswers = 0;
      const questionLevelData: any[] = [];
      
      questions.forEach(q => {
         const chosen = completedSession.answers[q.id];
         let isCorrect = false;
         
         if (chosen !== undefined) {
             if (q.type === 'numerical') {
                  const extractedSelected = String(chosen).match(/-?\d+(\.\d+)?/);
                  const extractedCorrect = String(q.correctAnswerText).match(/-?\d+(\.\d+)?/);
                  const valSelected = extractedSelected ? parseFloat(extractedSelected[0]) : NaN;
                  const valCorrect = extractedCorrect ? parseFloat(extractedCorrect[0]) : NaN;
                  isCorrect = (!isNaN(valSelected) && !isNaN(valCorrect) && valSelected === valCorrect);
             } else {
                 isCorrect = (chosen === q.correctOption);
             }
             if (isCorrect) correctCount++;
             else incorrectCount++;
             
             const timeSpent = completedSession.timeSpent[q.id] || 0;
             if (!isCorrect && timeSpent < 15) {
                guessedAnswers++;
             }
         }
         
         questionLevelData.push({
            q_id: q.id.toString(),
            subject: q.subject,
            topic: q.topic || 'General',
            difficulty: 'Medium',
            student_answer: chosen !== undefined ? String(chosen) : "",
            correct_answer: q.correctAnswerText || String(q.correctOption),
            is_correct: isCorrect,
            time_spent_seconds: completedSession.timeSpent[q.id] || 0,
            global_average_time_seconds: 90
         });
      });
      
      const totalScore = completedSession.score || 0;
      const maxScore = questions.length * 4;
      const totalTimeTaken = Object.values(completedSession.timeSpent).reduce((a, b) => a + b, 0);
      const accuracy = (correctCount + incorrectCount) > 0 ? (correctCount / (correctCount + incorrectCount)) * 100 : 0;
      
      const payload = {
         student_id: "current-user",
         exam_name: activeExam!.name,
         total_score: totalScore,
         max_score: maxScore,
         behavior_summary: {
           total_time_taken_seconds: totalTimeTaken,
           accuracy_percentage: accuracy,
           guessed_answers_detected: guessedAnswers
         },
         question_level_data: questionLevelData
      };
      
      const res = await fetch(`http://localhost:8080/api/v1/exam/attempts/${attemptId}/analytics`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Server returned an error for AI assessment');
      }

      const reportData = await res.json();
      if (reportData.status === 'processing') {
        const suggestion = { status: 'processing' } as AISuggestion;
        setAiSuggestion(suggestion);
        localStorage.setItem('current_ai_suggestion', JSON.stringify(suggestion));
      } else {
        setAiSuggestion(reportData);
        localStorage.setItem('current_ai_suggestion', JSON.stringify(reportData));
      }
    } catch (err: any) {
      console.error('Failed to parse AI evaluation report:', err.message);
      // Fail gracefully: UI has fallback suggestions in types/report component
    } finally {
      setLoadingAI(false);
    }
  };

  // Finish exam and view dashboard report
  const handleSubmitExam = async () => {
    if (session) {
      let newSession = { ...session, isCompleted: true };
      const attemptId = `${session.paperId}-${Date.now()}`;
      let finalQuestions = activeExam ? [...activeExam.questions] : [];
      try {
        const res = await fetch('http://localhost:8080/api/v1/exam/session/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          credentials: 'include',
          body: JSON.stringify({
            attempt_id: attemptId,
            paper_id: session.paperId,
            examName: activeExam ? activeExam.name : session.paperId,
          })
        });

        if (!res.ok) {
          console.error("Failed to submit exam to backend. Response status:", res.status);
        }

        // Fetch all answers for the paper
        const ansRes = await fetch(`http://localhost:8080/api/v1/exam/${session.paperId}/answer`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        if (ansRes.ok && activeExam) {
          const answersMap = await ansRes.json();
          
          finalQuestions = activeExam.questions.map(q => {
            let correctOpt = -1;
            const ansStr = answersMap[q.id];
            if (ansStr) {
               const cleanStr = String(ansStr).trim().toUpperCase();
               if (cleanStr.startsWith('A.') || cleanStr.startsWith('A ') || cleanStr === 'A' || cleanStr === '1') correctOpt = 0;
               else if (cleanStr.startsWith('B.') || cleanStr.startsWith('B ') || cleanStr === 'B' || cleanStr === '2') correctOpt = 1;
               else if (cleanStr.startsWith('C.') || cleanStr.startsWith('C ') || cleanStr === 'C' || cleanStr === '3') correctOpt = 2;
               else if (cleanStr.startsWith('D.') || cleanStr.startsWith('D ') || cleanStr === 'D' || cleanStr === '4') correctOpt = 3;
            }
            return { ...q, correctOption: correctOpt, correctAnswerText: ansStr };
          });

          setActiveExam({ ...activeExam, questions: finalQuestions });
          
          let score = 0;
          finalQuestions.forEach((q) => {
             const selected = session.answers[q.id];
             if (selected !== undefined) {
               if (q.type === 'numerical') {
                 const extractedSelected = String(selected).match(/-?\d+(\.\d+)?/);
                 const extractedCorrect = String(q.correctAnswerText).match(/-?\d+(\.\d+)?/);
                 const valSelected = extractedSelected ? parseFloat(extractedSelected[0]) : NaN;
                 const valCorrect = extractedCorrect ? parseFloat(extractedCorrect[0]) : NaN;

                 if (!isNaN(valSelected) && !isNaN(valCorrect) && valSelected === valCorrect) {
                   score += 4;
                 } else {
                   score -= 1; // Assuming JEE Advanced rules: -1 for incorrect numerical too? Or 0?
                 }
               } else {
                 if (selected === q.correctOption) score += 4;
                 else score -= 1;
               }
             }
          });
          newSession.score = score;
        }

      } catch (err) {
        console.error("Error submitting exam to backend:", err);
      }

      setSession(newSession);
      navigate('/report', { replace: true });
      triggerAIEvaluation(newSession, attemptId, finalQuestions);
    }
  };

  // Restart active exam from scratch
  const handleRetryExam = () => {
    if (activeExam) {
      const freshSession: ExamSession = {
        paperId: activeExam.id,
        answers: {},
        statuses: {},
        timeSpent: {},
        secondsRemaining: activeExam.duration,
        isCompleted: false,
        cheatingWarnings: 0,
      };

      activeExam.questions.forEach((q) => {
        freshSession.statuses[q.id] = 'unvisited';
        freshSession.timeSpent[q.id] = 0;
      });

      setSession(freshSession);
      navigate('/exam');
    }
  };

  // Go directly to candidate dashboard
  const handleGoToDashboard = () => {
    // Reset states
    setActiveExam(null);
    setSession(null);
    setAiSuggestion(null);
    navigate('/dashboard');
  };

  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Check if we should redirect from landing/login pages to dashboard based on role
    if (!isLoading && user) {
      if (location.pathname === '/home' || location.pathname === '/login' || location.pathname === '/') {
        const postLoginAction = localStorage.getItem('postLoginAction');
        if (postLoginAction === 'startFirstMockTest') {
          localStorage.removeItem('postLoginAction');
          
          // Fetch the first exam and navigate to its instructions
          fetch('http://localhost:8080/api/v1/exams', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          })
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              navigate('/instructions/' + data[0].paper_id, { replace: true });
            } else {
              navigate('/question-papers', { replace: true });
            }
          })
          .catch(err => {
            console.error("Failed to fetch exams for post-login action:", err);
            navigate('/dashboard', { replace: true });
          });
          
        } else if (user.role.toLowerCase() === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [user, isLoading, location.pathname, navigate]);

  return (
    <div className="w-full h-full min-h-screen bg-slate-50 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {/* @ts-ignore: key is required by AnimatePresence but not in RoutesProps in this version */}
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            isLoading ? <div className="min-h-screen flex items-center justify-center">Loading...</div> :
            user ? <Navigate to={user.role.toLowerCase() === 'admin' ? '/admin' : '/dashboard'} replace /> : 
            <Navigate to="/home" replace />
          } />
          <Route path="/home" element={
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="w-full h-full"
            >
              <LandingScreen
                onStartTest={() => {
                  if (!user) {
                    localStorage.setItem('postLoginAction', 'startFirstMockTest');
                    navigate('/login');
                  } else {
                    fetch('http://localhost:8080/api/v1/exams', {
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                    })
                    .then(res => res.json())
                    .then(data => {
                      if (data && data.length > 0) {
                        navigate('/instructions/' + data[0].paper_id);
                      } else {
                        navigate('/question-papers');
                      }
                    })
                    .catch(err => console.error(err));
                  }
                }}
                onGoToDashboard={handleGoToDashboard}
                onGoToLogin={() => navigate('/login')}
                onGoToQuestionPapers={() => navigate('/question-papers')}
              />
            </motion.div>
          } />

          <Route path="/login" element={
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <LoginScreen />
            </motion.div>
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['student', 'teacher']}>
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="w-full h-full"
              >
                <DashboardScreen
                  onStartExam={(paperId) => navigate(`/instructions/${paperId}`)}
                  onStartAIFocusTest={handleStartAIFocusTest}
                  geminiConfigured={geminiConfigured}
                  streakDays={streakDays}
                />
              </motion.div>
            </ProtectedRoute>
          } />

          <Route path="/question-papers" element={
            <ProtectedRoute allowedRoles={['student', 'teacher']}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <ExamsListScreen
                  onStartExam={(paperId) => navigate(`/instructions/${paperId}`)}
                  onViewReport={handleViewReport}
                />
              </motion.div>
            </ProtectedRoute>
          } />

          <Route path="/instructions/:paperId" element={
            <ProtectedRoute allowedRoles={['student', 'teacher']}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                {activeExam && session && !session.isCompleted ? (
                  <Navigate to="/exam" replace />
                ) : (
                  <InstructionsScreen
                    onProceed={(paperId) => handleStartExam(Number(paperId))}
                  />
                )}
              </motion.div>
            </ProtectedRoute>
          } />

          <Route path="/exam" element={
            <ProtectedRoute allowedRoles={['student', 'teacher']}>
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                {activeExam && session && !session.isCompleted ? (
                  <ExamScreen
                    exam={activeExam}
                    session={session!}
                    onUpdateSession={handleUpdateSession}
                    onSubmitExam={handleSubmitExam}
                  />
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </motion.div>
            </ProtectedRoute>
          } />

          <Route path="/report" element={
            <ProtectedRoute allowedRoles={['student', 'teacher']}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="w-full h-full"
              >
                {activeExam && session ? (
                  <ReportScreen
                    exam={activeExam}
                    session={session}
                    aiSuggestion={aiSuggestion}
                    loadingAI={loadingAI}
                    onRetry={handleRetryExam}
                    onReturnToDashboard={handleGoToDashboard}
                    onStartAIFocusTest={handleStartAIFocusTest}
                  />
                ) : (
                  <Navigate to="/home" replace />
                )}
              </motion.div>
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full h-full"
              >
                <AdminDashboardScreen />
              </motion.div>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}
