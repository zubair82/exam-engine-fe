import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Cloud, Timer, ShieldAlert, Calculator, BookOpen, ChevronLeft, ChevronRight, AlertTriangle, RotateCcw, Bookmark, CheckCircle, HelpCircle, X, Trash2, AlertCircle } from 'lucide-react';
import { MathText } from './MathText';
import { Question, Exam, ExamSession, QuestionStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface ExamScreenProps {
  exam: Exam;
  session: ExamSession;
  onUpdateSession: (updated: ExamSession) => void;
  onSubmitExam: () => void;
}

export default function ExamScreen({
  exam,
  session,
  onUpdateSession,
  onSubmitExam,
}: ExamScreenProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSubject, setActiveSubject] = useState<string>('Mathematics');
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCheatingWarning, setShowCheatingWarning] = useState(false);

  // Prevent going back to instructions page
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      navigate('/dashboard', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [calcInput, setCalcInput] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [showFullscreenPopup, setShowFullscreenPopup] = useState(!document.fullscreenElement);

  const activeQuestion = exam.questions[currentQuestionIndex];

  // Ref to prevent multiple interval registers
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Time Tracker second-by-second
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (session.secondsRemaining <= 0) {
        clearInterval(timerRef.current!);
        handleSubmit();
      } else {
        // Increment timeSpent on active question
        const updatedTimeSpent = { ...session.timeSpent };
        const qId = activeQuestion.id;
        updatedTimeSpent[qId] = (updatedTimeSpent[qId] || 0) + 1;

        onUpdateSession({
          ...session,
          secondsRemaining: session.secondsRemaining - 1,
          timeSpent: updatedTimeSpent,
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session, activeQuestion]);

  // Anti-cheating proctoring event listener
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        setShowCheatingWarning(true);
        try {
          const res = await fetch(`${import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080'}/api/v1/exam/session/violation`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            credentials: 'include',
            body: JSON.stringify({ paper_id: session.paperId })
          });

          if (res.status === 403) {
            alert("Exam Terminated for Malpractice: You have exceeded the maximum number of warnings.");
            onUpdateSession({
              ...session,
              isCompleted: true,
              cheatingWarnings: 3
            });
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(err => console.error("Error attempting to exit fullscreen:", err));
            }
          } else if (res.ok) {
            const data = await res.json();
            onUpdateSession({
              ...session,
              cheatingWarnings: data.violations || session.cheatingWarnings + 1,
            });
          }
        } catch (err) {
          console.error("Failed to record violation", err);
          onUpdateSession({
            ...session,
            cheatingWarnings: session.cheatingWarnings + 1,
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, onUpdateSession]);

  // Listen for fullscreen change to show return to fullscreen popup
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setShowFullscreenPopup(true);
      } else {
        setShowFullscreenPopup(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    }
  };

  // Sync subject tabs with active question
  useEffect(() => {
    if (activeQuestion) {
      setActiveSubject(activeQuestion.subject);

      // If question is unvisited or undefined, change status to 'not_answered' since they've now opened it
      const currentStatus = session.statuses[activeQuestion.id];
      if (!currentStatus || currentStatus === 'unvisited') {
        const updatedStatuses = { ...session.statuses };
        updatedStatuses[activeQuestion.id] = 'not_answered';
        onUpdateSession({
          ...session,
          statuses: updatedStatuses,
        });
      }
    }
  }, [currentQuestionIndex]);

  // Format countdown timer (HH:MM:SS)
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0'),
    ].join(':');
  };

  // Answer choice
  const handleSelectOption = (optionIndex: number | string) => {
    const updatedAnswers = { ...session.answers };
    updatedAnswers[activeQuestion.id] = optionIndex;

    const updatedStatuses = { ...session.statuses };
    // If it was marked, keep it marked but answered. Otherwise mark it answered.
    const currentStatus = session.statuses[activeQuestion.id];
    if (currentStatus === 'marked' || currentStatus === 'answered_marked') {
      updatedStatuses[activeQuestion.id] = 'answered_marked';
    } else {
      updatedStatuses[activeQuestion.id] = 'answered';
    }

    onUpdateSession({
      ...session,
      answers: updatedAnswers,
      statuses: updatedStatuses,
    });
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleClearResponse = () => {
    const updatedAnswers = { ...session.answers };
    delete updatedAnswers[activeQuestion.id];

    const updatedStatuses = { ...session.statuses };
    updatedStatuses[activeQuestion.id] = 'not_answered';

    onUpdateSession({
      ...session,
      answers: updatedAnswers,
      statuses: updatedStatuses,
    });
  };

  const handleMarkForReviewAndNext = () => {
    const updatedStatuses = { ...session.statuses };
    const hasAnswer = session.answers[activeQuestion.id] !== undefined;

    updatedStatuses[activeQuestion.id] = hasAnswer ? 'answered_marked' : 'marked';

    onUpdateSession({
      ...session,
      statuses: updatedStatuses,
    });

    handleNext();
  };

  const handleSaveAndMarkForReview = () => {
    const updatedStatuses = { ...session.statuses };
    const hasAnswer = session.answers[activeQuestion.id] !== undefined;
    
    updatedStatuses[activeQuestion.id] = hasAnswer ? 'answered_marked' : 'marked';

    onUpdateSession({
      ...session,
      statuses: updatedStatuses,
    });

    handleNext();
  };

  const handleSaveAndNext = () => {
    const updatedStatuses = { ...session.statuses };
    const hasAnswer = session.answers[activeQuestion.id] !== undefined;

    if (hasAnswer) {
      // It was answered, make sure status is 'answered' (re-saving clears marked state)
      updatedStatuses[activeQuestion.id] = 'answered';
    } else {
      updatedStatuses[activeQuestion.id] = 'not_answered';
    }

    onUpdateSession({
      ...session,
      statuses: updatedStatuses,
    });

    handleNext();
  };

  // Jump directly to a question
  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Switch subject tabs: jumps to the first question of that subject
  const handleSwitchSubject = (subject: string) => {
    const firstQuestionIndex = exam.questions.findIndex((q) => q.subject.toLowerCase() === subject.toLowerCase());
    if (firstQuestionIndex !== -1) {
      setCurrentQuestionIndex(firstQuestionIndex);
    }
  };

  // Calculator helper operations
  const handleCalcPress = (val: string) => {
    if (val === 'C') {
      setCalcInput('');
      setCalcResult('');
    } else if (val === '=') {
      try {
        // Safe evaluation for basic math expression
        const cleanExpr = calcInput.replace(/[^-()\d/*+.]/g, '');
        const res = Function(`"use strict"; return (${cleanExpr})`)();
        setCalcResult(res.toString());
      } catch (e) {
        setCalcResult('Error');
      }
    } else {
      setCalcInput((prev) => prev + val);
    }
  };

  // Calculate session summary stats
  const getSessionStats = () => {
    let answeredCount = 0;
    let markedCount = 0;
    let answeredMarkedCount = 0;
    let notAnsweredCount = 0;
    let unvisitedCount = 0;

    exam.questions.forEach((q) => {
      const status = session.statuses[q.id];
      if (status === 'answered') answeredCount++;
      else if (status === 'marked') markedCount++;
      else if (status === 'answered_marked') answeredMarkedCount++;
      else if (status === 'not_answered') notAnsweredCount++;
      else unvisitedCount++;
    });

    return { answeredCount, markedCount, answeredMarkedCount, notAnsweredCount, unvisitedCount };
  };

  // Submits test and calculates marks
  const handleSubmit = () => {
    // Calculate final score
    let score = 0;
    exam.questions.forEach((q) => {
      const selected = session.answers[q.id];
      // JEE Advanced scoring: say +4 for correct, -1 for incorrect
      if (selected !== undefined) {
        if (selected === q.correctOption) {
          score += 4;
        } else {
          score -= 1;
        }
      }
    });

    const totalMarks = exam.questions.length * 4;

    onUpdateSession({
      ...session,
      isCompleted: true,
      score,
      totalMarks,
      completedAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    });

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error("Error attempting to exit fullscreen:", err));
    }

    onSubmitExam();
  };

  const { answeredCount, markedCount, answeredMarkedCount, notAnsweredCount, unvisitedCount } = getSessionStats();

  return (
    <div className="bg-slate-50 fixed inset-0 flex flex-col overflow-hidden select-none font-sans text-slate-800">

      {/* Anti-Cheating Fullscreen Proctoring Warning Overlay */}
      <AnimatePresence>
        {showCheatingWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 z-[999] flex flex-col items-center justify-center p-6 text-white text-center"
          >
            <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold mb-2 text-red-400">Warning: Window Navigation Detected</h2>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed mb-8">
              You are taking a proctored assessment. Leaving the test interface, opening new tabs, or switching applications is strictly monitored. Continuing to exit full-screen will lead to automatic submission.
            </p>
            <button onClick={() => setShowCheatingWarning(false)}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-6 py-2.5 rounded-lg transition-all text-sm shadow-md"
            >
              Return to Exam
            </button>
            <span className="text-[10px] text-slate-500 mt-4">
              Warnings triggered: {session.cheatingWarnings}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Return to Fullscreen Overlay */}
      <AnimatePresence>
        {showFullscreenPopup && !showCheatingWarning && !showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/95 z-[998] flex flex-col items-center justify-center p-6 text-white text-center"
          >
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold mb-2 text-white">Full Screen Required</h2>
            <p className="text-sm text-slate-300 max-w-md leading-relaxed mb-8">
              The exam must be taken in full-screen mode to ensure a secure environment. Please return to full-screen to continue.
            </p>
            <button onClick={requestFullscreen}
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-lg transition-all text-sm shadow-md"
            >
              Return to Full Screen
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Virtual Calculator Overlay */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="fixed right-88 top-20 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 w-64 z-[40] text-white"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                Virtual Calculator
              </span>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calc Display */}
            <div className="bg-slate-950 rounded p-2 text-right font-mono text-sm h-14 flex flex-col justify-between overflow-hidden mb-3 border border-slate-800">
              <span className="text-[10px] text-slate-500 overflow-x-auto whitespace-nowrap block">{calcInput || '0'}</span>
              <span className="text-blue-400 font-bold text-base block">{calcResult || ' '}</span>
            </div>

            {/* Calc Keys */}
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
              {['(', ')', '/', 'C', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map((key) => (
                <button
                  key={key}
                  onClick={() => handleCalcPress(key)}
                  className={`py-2 rounded transition-colors text-center ${key === '='
                    ? 'col-span-2 bg-blue-600 text-white hover:bg-blue-500'
                    : key === 'C'
                      ? 'bg-red-900/40 text-red-300 border border-red-900/30 hover:bg-red-900/60'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thin White Header Strip */}
      <header className="w-full bg-white border-b border-slate-200 shrink-0 relative z-20 h-4 shadow-sm"></header>

      {/* Candidate Profile Strip */}
      <div className="w-full bg-[#f0f4f7] border-b border-slate-200 flex px-8 py-2.5 items-center shrink-0 z-10 text-xs shadow-sm">
        <div className="flex items-center gap-6 flex-1">
          <div className="w-20 h-20 bg-white border-2 border-slate-300 rounded shadow-sm flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-5xl text-slate-400">person</span>
          </div>
          <div className="flex flex-col leading-tight gap-1.5">
            <div className="flex"><span className="w-32 text-slate-600 font-semibold text-sm">Candidate Name :</span> <span className="font-bold text-orange-500 text-sm">{user?.name || "Student"}</span></div>
            <div className="flex"><span className="w-32 text-slate-600 font-semibold text-sm">Exam Name :</span> <span className="font-bold text-orange-500 text-sm">{exam.name}</span></div>
            <div className="flex"><span className="w-32 text-slate-600 font-semibold text-sm">Subject Name :</span> <span className="font-bold text-orange-500 text-sm">{activeSubject}</span></div>
            <div className="flex items-center mt-1">
              <span className="w-32 text-slate-600 font-semibold text-sm">Remaining Time :</span>
              <span className="bg-[#2a84c8] text-white font-mono font-bold px-3 py-0.5 rounded-full text-sm shadow-sm">
                {formatTime(session.secondsRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative z-10">

        {/* Left Pane (Question Stem + Answer Selection, takes 75%) */}
        <section className="flex-1 flex flex-col bg-white overflow-hidden min-h-0 min-w-0 relative">



          {/* Question Metadata Bar */}
          <div className="flex justify-between items-center px-6 py-2.5 bg-white border-b border-slate-200 shrink-0 font-semibold">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-900">Question {activeQuestion.id}</span>
              <span className="text-sm font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded border border-blue-200">
                {activeQuestion.type}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* 
              <button className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Report Issue</span>
              </button>
              */}

              {/* 
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className="flex items-center gap-1 text-blue-900 hover:bg-blue-50 border border-blue-100 px-2.5 py-1 rounded transition-colors"
              >
                <Calculator className="w-3.5 h-3.5 text-blue-700" />
                <span>Virtual Calculator</span>
              </button> 
              */}
            </div>
          </div>

          {/* Active Question Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {/* Question Stem Text */}
            <div className="text-slate-900 leading-relaxed font-normal text-base w-full max-w-full overflow-x-auto">
              <div className="whitespace-pre-wrap break-words"><MathText text={activeQuestion.text} diagramsText={activeQuestion.diagrams} /></div>
            </div>

            <hr className="border-slate-150" />

            {/* Answer Options or Numerical Input */}
            <div className="flex flex-col gap-3 max-w-3xl">
              {activeQuestion.type?.toLowerCase().includes('numerical') ? (
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Enter your numerical answer (integer only):
                  </label>
                  <textarea
                    rows={2}
                    value={session.answers[activeQuestion.id] ?? ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9-]/g, '');
                      // Only call handleSelectOption if it's a valid integer or minus sign
                      if (val === '' || val === '-' || !isNaN(parseInt(val, 10))) {
                        handleSelectOption(val);
                      }
                    }}
                    placeholder="Type your answer here..."
                    className="w-full p-3 border border-slate-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-base text-slate-800 resize-none"
                  />
                </div>
              ) : (
                activeQuestion.options.map((optionStr, index) => {
                  const isSelected = session.answers[activeQuestion.id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectOption(index)}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer text-left transition-all group ${isSelected
                        ? 'border-blue-900 bg-blue-50/20'
                        : 'border-slate-200 hover:bg-slate-50/50'
                        }`}
                    >
                      {/* Custom Styled Radio circular bullet */}
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-4 transition-all ${isSelected
                        ? 'border-blue-900 bg-blue-500'
                        : 'border-slate-300 group-hover:border-blue-900'
                        }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>

                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                        <MathText text={optionStr} diagramsText={activeQuestion.diagrams} />
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-3 border-t border-slate-300 bg-white shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <button
                onClick={handleSaveAndNext}
                className="px-5 py-2.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
              >
                Save & Next
              </button>

              <button
                onClick={handleClearResponse}
                className="px-5 py-2.5 bg-white border border-[#ccc] hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
              >
                Clear
              </button>

              <button
                onClick={handleSaveAndMarkForReview}
                className="px-5 py-2.5 bg-[#f0ad4e] hover:bg-[#eea236] text-white text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
              >
                Save & Mark For Review
              </button>

              <button
                onClick={handleMarkForReviewAndNext}
                className="px-5 py-2.5 bg-[#337ab7] hover:bg-[#286090] text-white text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
              >
                Mark For Review & Next
              </button>
            </div>
          </div>

          {/* Secondary Bottom Bar */}
          <div className="px-6 py-2.5 border-t border-slate-300 bg-[#f0f4f7] shrink-0 flex justify-between items-center shadow-inner">
            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-1.5 border border-[#ccc] bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm rounded-sm flex items-center gap-1"
              >
                &lt;&lt; BACK
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === exam.questions.length - 1}
                className="px-5 py-1.5 border border-[#ccc] bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm rounded-sm flex items-center gap-1"
              >
                NEXT &gt;&gt;
              </button>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-8 py-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] text-white text-xs font-bold uppercase transition-all shadow-sm rounded-sm"
            >
              Submit
            </button>
          </div>
        </section>

        {/* Right Pane */}
        <aside className="w-[340px] flex flex-col bg-white border-l border-slate-300 shrink-0 z-30 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.03)] overflow-hidden">

          {/* NTA Color State Legends */}
          <div className="p-4 border-b border-slate-300 bg-white grid grid-cols-2 gap-x-2 gap-y-4 text-xs leading-tight text-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-7 bg-[#f0f0f0] border border-slate-300 rounded flex items-center justify-center font-bold text-slate-700 shadow-sm">{unvisitedCount}</div>
              <span className="flex-1">Not Visited</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-7 bg-[#d9534f] text-white flex items-center justify-center font-bold shadow-sm" style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)" }}>{notAnsweredCount}</div>
              <span className="flex-1">Not Answered</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-7 bg-[#5cb85c] text-white flex items-center justify-center font-bold shadow-sm" style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)" }}>{answeredCount}</div>
              <span className="flex-1">Answered</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#603598] rounded-full text-white flex items-center justify-center font-bold shadow-sm">{markedCount}</div>
              <span className="flex-1">Marked for Review</span>
            </div>

            <div className="flex items-start gap-2 col-span-2 mt-2">
              <div className="w-8 h-8 bg-[#603598] rounded-full text-white flex items-center justify-center font-bold shrink-0 relative shadow-sm">
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#5cb85c] rounded-full border border-white"></div>
                {answeredMarkedCount}
              </div>
              <span className="text-slate-600 mt-1">Answered & Marked for Review (will be considered for evaluation)</span>
            </div>
          </div>

          <div className="flex bg-slate-50 border-b border-slate-200 shrink-0">
            {(['Mathematics', 'Physics', 'Chemistry'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => handleSwitchSubject(sub)}
                className={`flex-1 py-3 font-bold text-xs tracking-wide transition-all uppercase text-center ${activeSubject.toLowerCase() === sub.toLowerCase()
                  ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50/50'
                  : 'text-slate-600 hover:bg-slate-100/50'
                  }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Active Palette Header and Stats */}
          <div className="p-4 bg-blue-50 text-blue-900 text-xs font-bold flex justify-between items-center border-b border-slate-200">
            <span className="tracking-wide uppercase">{activeSubject}</span>
            <span className="bg-white text-blue-900 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-bold">
              {exam.questions.filter((q) => q.subject.toLowerCase() === activeSubject.toLowerCase()).length} Questions
            </span>
          </div>

          {/* Grid Question Palette Buttons */}
          <div className="flex-1 p-4 bg-blue-50/30 overflow-y-auto">
            <div className="grid grid-cols-5 gap-3">
              {exam.questions.map((q, idx) => {
                if (q.subject.toLowerCase() !== activeSubject.toLowerCase()) return null;

                const status = session.statuses[q.id];
                const isActive = currentQuestionIndex === idx;

                let btnClass = 'bg-[#f0f0f0] border border-slate-300 text-slate-700 rounded'; // unvisited default
                let style = {};

                if (status === 'not_answered') {
                  btnClass = 'bg-[#d9534f] text-white';
                  style = { clipPath: "polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)" };
                } else if (status === 'answered') {
                  btnClass = 'bg-[#5cb85c] text-white';
                  style = { clipPath: "polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)" };
                } else if (status === 'marked') {
                  btnClass = 'bg-[#603598] text-white rounded-full';
                } else if (status === 'answered_marked') {
                  btnClass = 'bg-[#603598] text-white rounded-full relative';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => handleJumpToQuestion(idx)}
                    style={style}
                    className={`w-11 h-10 text-sm font-bold flex items-center justify-center relative hover:opacity-85 transition-all cursor-pointer shadow-sm ${btnClass} ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 z-10' : ''
                      }`}
                  >
                    {idx + 1}
                    {status === 'answered_marked' && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#5cb85c] rounded-full border border-white"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </main>

      {/* Dark Blue NTA Footer */}
      <footer className="w-full bg-[#0f3057] text-white text-xs font-medium py-3 text-center shrink-0 z-20 shadow-inner">
        © All Rights Reserved - ExamSimula
      </footer>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 z-[999] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200"
            >
              <div className="flex items-center gap-3 text-blue-900 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-bold">Confirm Exam Submission</h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Are you sure you want to submit your paper? You will not be able to review or modify your answers once submitted. Here is your current progress overview:
              </p>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-xs bg-slate-50 border border-slate-150 p-4 rounded-lg">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Answered:</span>
                  <strong className="text-slate-800 font-bold">{answeredCount + answeredMarkedCount}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Marked for Review:</span>
                  <strong className="text-slate-800 font-bold">{markedCount}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Not Answered:</span>
                  <strong className="text-slate-800 font-bold">{notAnsweredCount}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Unvisited:</span>
                  <strong className="text-slate-800 font-bold">{unvisitedCount}</strong>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 bg-white border border-slate-300 text-slate-600 font-semibold py-2 rounded-lg text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    handleSubmit();
                  }}
                  className="flex-1 bg-blue-900 text-white font-bold py-2 rounded-lg text-xs hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Yes, Submit Paper
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
