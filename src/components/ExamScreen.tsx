import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Calculator, AlertTriangle, X } from 'lucide-react';
import { MathText } from './MathText';
import { Exam, ExamSession } from '../types';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

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
  const [showMobileQuestionsPane, setShowMobileQuestionsPane] = useState(false);

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
  
  // Resizable split pane state
  const [questionHeight, setQuestionHeight] = useState(50); // percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

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

  // Split pane drag logic
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newHeight = ((e.clientY - containerRect.top) / containerRect.height) * 100;
      if (newHeight > 20 && newHeight < 80) {
        setQuestionHeight(newHeight);
      }
    };
    
    const handlePointerUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
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
    let score = 0;
    exam.questions.forEach((q) => {
      const selected = session.answers[q.id];
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
    <div className="bg-slate-50 dark:bg-[#1a1e29] fixed inset-0 flex flex-col overflow-hidden select-none font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">

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
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-6 py-2.5 rounded-lg transition-all text-sm shadow-md cursor-pointer"
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
              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-lg transition-all text-sm shadow-md cursor-pointer"
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
            className="fixed right-88 top-20 bg-slate-900 dark:bg-[#252b3b] border border-slate-700 dark:border-slate-700/70 rounded-xl shadow-2xl p-4 w-64 z-[40] text-white"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                Virtual Calculator
              </span>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calc Display */}
            <div className="bg-slate-950 dark:bg-[#1a1e29] rounded p-2 text-right font-mono text-sm h-14 flex flex-col justify-between overflow-hidden mb-3 border border-slate-800 dark:border-slate-700">
              <span className="text-[10px] text-slate-500 overflow-x-auto whitespace-nowrap block">{calcInput || '0'}</span>
              <span className="text-blue-400 font-bold text-base block">{calcResult || ' '}</span>
            </div>

            {/* Calc Keys */}
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
              {['(', ')', '/', 'C', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map((key) => (
                <button
                  key={key}
                  onClick={() => handleCalcPress(key)}
                  className={`py-2 rounded transition-colors text-center cursor-pointer ${key === '='
                    ? 'col-span-2 bg-blue-600 text-white hover:bg-blue-500'
                    : key === 'C'
                      ? 'bg-red-900/40 text-red-300 border border-red-900/30 hover:bg-red-900/60'
                      : 'bg-slate-800 dark:bg-[#1e2330] text-slate-200 hover:bg-slate-700 dark:hover:bg-[#1a1e29]'
                    }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Strip */}
      <header className="w-full bg-white dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 shrink-0 relative z-20 h-4 shadow-sm"></header>

      {/* Candidate Profile Strip */}
      <div className="w-full bg-[#f0f4f7] dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 flex px-4 md:px-8 py-2 md:py-2.5 items-center justify-between shrink-0 z-10 text-xs shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="hidden md:flex w-20 h-20 bg-white dark:bg-[#252b3b] border-2 border-slate-300 dark:border-slate-700 rounded shadow-sm items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-5xl text-slate-400 dark:text-slate-400">person</span>
          </div>
          <div className="flex flex-col leading-tight gap-1.5 w-full md:w-auto items-center md:items-start">
            <div className="hidden md:flex"><span className="w-32 text-slate-600 dark:text-slate-300 font-semibold text-sm">Candidate Name :</span> <span className="font-bold text-orange-500 dark:text-amber-400 text-sm">{user?.name || "Student"}</span></div>
            <div className="hidden md:flex"><span className="w-32 text-slate-600 dark:text-slate-300 font-semibold text-sm">Exam Name :</span> <span className="font-bold text-orange-500 dark:text-amber-400 text-sm">{exam.name}</span></div>
            <div className="hidden md:flex"><span className="w-32 text-slate-600 dark:text-slate-300 font-semibold text-sm">Subject Name :</span> <span className="font-bold text-orange-500 dark:text-amber-400 text-sm">{activeSubject}</span></div>
            <div className="flex items-center md:mt-1 justify-center md:justify-start w-full">
              <span className="md:w-32 text-slate-600 dark:text-slate-300 font-semibold text-sm mr-2 md:mr-0">Remaining Time :</span>
              <span className="bg-[#2a84c8] dark:bg-blue-600 text-white font-mono font-bold px-3 py-0.5 rounded-full text-sm shadow-sm">
                {formatTime(session.secondsRemaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Action icons / Theme toggle on right of strip */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#252b3b] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e2330] flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm transition-colors"
            title="Open Calculator"
          >
            <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Calculator</span>
          </button>
          <ThemeToggle size="sm" />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden min-h-0 relative z-10">

        {/* Left Pane (Question Stem + Answer Selection, takes 75%) */}
        <section className="flex-1 flex flex-col bg-white dark:bg-[#1a1e29] overflow-hidden min-h-0 min-w-0 relative transition-colors duration-200">

          {/* Question Metadata Bar */}
          <div className="flex justify-between items-center px-4 sm:px-6 py-2.5 bg-white dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 shrink-0 font-semibold transition-colors duration-200">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Question {activeQuestion.id}</span>
              <span className="text-xs sm:text-sm font-bold text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-2 sm:px-3 py-1 rounded border border-blue-200 dark:border-blue-500/30">
                {activeQuestion.type}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="md:hidden">
                <ThemeToggle size="sm" />
              </div>
              <button 
                onClick={() => setShowMobileQuestionsPane(true)}
                className="lg:hidden flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_list_bulleted</span>
                <span>Questions</span>
              </button>
            </div>
          </div>

          {/* Active Question Content */}
          <div ref={containerRef} className="flex-1 flex flex-col min-h-0 relative bg-white dark:bg-[#1a1e29] transition-colors duration-200">
            {/* Question Stem Text */}
            <div 
              style={{ height: `${questionHeight}%` }}
              className="overflow-y-auto p-4 sm:p-6"
            >
              <div className="text-slate-900 dark:text-slate-200 leading-relaxed font-normal text-base w-full max-w-full overflow-x-auto">
                <div className="whitespace-pre-wrap break-words"><MathText text={activeQuestion.text} diagramsText={activeQuestion.diagrams} /></div>
              </div>
            </div>

            {/* Resizer Divider */}
            <div 
              onPointerDown={handlePointerDown}
              className="h-3 sm:h-2 bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-blue-300 dark:active:bg-blue-700 cursor-row-resize shrink-0 flex justify-center items-center group transition-colors touch-none"
            >
              <div className="w-12 h-1 bg-slate-400/70 dark:bg-slate-500 rounded-full group-hover:bg-blue-600 dark:group-hover:bg-blue-400 transition-colors"></div>
            </div>

            {/* Answer Options or Numerical Input */}
            <div 
              style={{ height: `${100 - questionHeight}%` }}
              className="overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-[#1e2330]/50"
            >
              <div className="flex flex-col gap-3 max-w-3xl">
                {activeQuestion.type?.toLowerCase().includes('numerical') ? (
                  <div className="p-4 border border-slate-200 dark:border-slate-700/70 rounded-2xl bg-white dark:bg-[#252b3b]">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2">
                      Enter your numerical answer (integer only):
                    </label>
                    <textarea
                      rows={2}
                      value={session.answers[activeQuestion.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9-]/g, '');
                        if (val === '' || val === '-' || !isNaN(parseInt(val, 10))) {
                          handleSelectOption(val);
                        }
                      }}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1e29] border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none font-mono"
                    />
                  </div>
                ) : (
                  activeQuestion.options.map((optionStr, index) => {
                    const isSelected = session.answers[activeQuestion.id] === index;
                    return (
                      <button
                        key={index}
                        onClick={() => handleSelectOption(index)}
                        className={`flex items-center p-4 border rounded-xl cursor-pointer text-left transition-all group ${isSelected
                          ? 'border-blue-900 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/70'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2330] hover:bg-slate-50 dark:hover:border-blue-500'
                          }`}
                      >
                        {/* Custom Styled Radio circular bullet */}
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-4 transition-all shrink-0 ${isSelected
                          ? 'border-blue-900 dark:border-blue-500 bg-blue-500 dark:bg-blue-500'
                          : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-900 dark:group-hover:border-blue-400 bg-white dark:bg-[#1a1e29]'
                          }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                        </div>

                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-300 font-bold' : 'text-slate-700 dark:text-slate-200'}`}>
                          <MathText text={optionStr} diagramsText={activeQuestion.diagrams} />
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-3 border-t border-slate-300 dark:border-slate-700/60 bg-white dark:bg-[#222736] shrink-0 transition-colors duration-200">
            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
              <button
                onClick={handleSaveAndNext}
                className="px-5 py-2.5 bg-[#5cb85c] hover:bg-[#4cae4c] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
              >
                Save & Next
              </button>

              <button
                onClick={handleClearResponse}
                className="px-5 py-2.5 bg-white dark:bg-[#252b3b] border border-[#ccc] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#1e2330] text-slate-800 dark:text-slate-200 text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
              >
                Clear
              </button>

              <button
                onClick={handleSaveAndMarkForReview}
                className="px-5 py-2.5 bg-[#f0ad4e] hover:bg-[#eea236] dark:bg-amber-600 dark:hover:bg-amber-700 text-white text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
              >
                Save & Mark For Review
              </button>

              <button
                onClick={handleMarkForReviewAndNext}
                className="px-5 py-2.5 bg-[#337ab7] hover:bg-[#286090] dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
              >
                Mark For Review & Next
              </button>
            </div>
          </div>

          {/* Secondary Bottom Bar */}
          <div className="px-6 py-2.5 border-t border-slate-300 dark:border-slate-700/60 bg-[#f0f4f7] dark:bg-[#1e2330] shrink-0 flex justify-between items-center shadow-inner transition-colors duration-200">
            <div className="flex gap-2">
              <button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="px-5 py-1.5 border border-[#ccc] dark:border-slate-700 bg-white dark:bg-[#252b3b] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#1a1e29] disabled:opacity-50 transition-all shadow-sm rounded-sm flex items-center gap-1 cursor-pointer"
              >
                &lt;&lt; BACK
              </button>
              <button
                onClick={handleNext}
                disabled={currentQuestionIndex === exam.questions.length - 1}
                className="px-5 py-1.5 border border-[#ccc] dark:border-slate-700 bg-white dark:bg-[#252b3b] text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-[#1a1e29] disabled:opacity-50 transition-all shadow-sm rounded-sm flex items-center gap-1 cursor-pointer"
              >
                NEXT &gt;&gt;
              </button>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-8 py-1.5 bg-[#5cb85c] hover:bg-[#4cae4c] dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-bold uppercase transition-all shadow-sm rounded-sm cursor-pointer"
            >
              Submit
            </button>
          </div>
        </section>

        {/* Right Pane Slider (Mobile) / Sidebar (Desktop) */}
        {showMobileQuestionsPane && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden" 
            onClick={() => setShowMobileQuestionsPane(false)}
          />
        )}
        <aside className={`fixed right-0 top-0 bottom-0 z-40 lg:static lg:z-30 w-[300px] sm:w-[340px] lg:w-[340px] flex flex-col bg-white dark:bg-[#222736] border-l border-slate-300 dark:border-slate-700/60 shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.03)] overflow-hidden transition-transform duration-300 ease-in-out ${showMobileQuestionsPane ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
          {/* Mobile Drawer Header */}
          <div className="lg:hidden flex justify-between items-center p-4 bg-slate-50 dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 shrink-0">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Question Palette</h3>
            <button onClick={() => setShowMobileQuestionsPane(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* NTA Color State Legends */}
          <div className="p-4 border-b border-slate-300 dark:border-slate-700/60 bg-white dark:bg-[#222736] grid grid-cols-2 gap-x-2 gap-y-4 text-xs leading-tight text-slate-700 dark:text-slate-300 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-7 bg-[#f0f0f0] dark:bg-[#252b3b] border border-slate-300 dark:border-slate-700 rounded flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shadow-sm">{unvisitedCount}</div>
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
              <span className="text-slate-600 dark:text-slate-400 mt-1">Answered & Marked for Review (will be considered for evaluation)</span>
            </div>
          </div>

          <div className="flex bg-slate-50 dark:bg-[#1e2330] border-b border-slate-200 dark:border-slate-700/60 shrink-0">
            {(['Mathematics', 'Physics', 'Chemistry'] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => handleSwitchSubject(sub)}
                className={`flex-1 py-3 font-bold text-xs tracking-wide transition-all uppercase text-center cursor-pointer ${activeSubject.toLowerCase() === sub.toLowerCase()
                  ? 'text-blue-900 dark:text-blue-400 border-b-2 border-blue-900 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-[#252b3b]'
                  }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Active Palette Header and Stats */}
          <div className="p-4 bg-blue-50 dark:bg-[#1e2330] text-blue-900 dark:text-blue-300 text-xs font-bold flex justify-between items-center border-b border-slate-200 dark:border-slate-700/60">
            <span className="tracking-wide uppercase">{activeSubject}</span>
            <span className="bg-white dark:bg-[#252b3b] text-blue-900 dark:text-blue-300 border border-blue-100 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
              {exam.questions.filter((q) => q.subject.toLowerCase() === activeSubject.toLowerCase()).length} Questions
            </span>
          </div>

          {/* Grid Question Palette Buttons */}
          <div className="flex-1 p-4 bg-blue-50/30 dark:bg-[#1a1e29] overflow-y-auto">
            <div className="grid grid-cols-5 gap-3">
              {exam.questions.map((q, idx) => {
                if (q.subject.toLowerCase() !== activeSubject.toLowerCase()) return null;

                const status = session.statuses[q.id];
                const isActive = currentQuestionIndex === idx;

                let btnClass = 'bg-[#f0f0f0] dark:bg-[#252b3b] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded';
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
                    onClick={() => {
                      handleJumpToQuestion(idx);
                      if (window.innerWidth < 1024) {
                        setShowMobileQuestionsPane(false);
                      }
                    }}
                    style={style}
                    className={`w-11 h-10 text-sm font-bold flex items-center justify-center relative hover:opacity-85 transition-all cursor-pointer shadow-sm ${btnClass} ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#1a1e29] z-10' : ''
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

      {/* Footer */}
      <footer className="w-full bg-[#0f3057] dark:bg-[#151821] text-white dark:text-slate-400 text-xs font-medium py-3 text-center shrink-0 z-20 shadow-inner transition-colors duration-200">
        © All Rights Reserved - ExamSimula
      </footer>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 z-[999] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white dark:bg-[#252b3b] rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700/70 text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center gap-3 text-blue-900 dark:text-blue-400 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                <h3 className="text-lg font-bold">Confirm Exam Submission</h3>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Are you sure you want to submit your paper? You will not be able to review or modify your answers once submitted. Here is your current progress overview:
              </p>

              {/* Stats overview */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-xs bg-slate-50 dark:bg-[#1e2330] border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Answered:</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-bold">{answeredCount + answeredMarkedCount}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Marked for Review:</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-bold">{markedCount}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Not Answered:</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-bold">{notAnsweredCount}</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span>Unvisited:</span>
                  <strong className="text-slate-800 dark:text-slate-100 font-bold">{unvisitedCount}</strong>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 bg-white dark:bg-[#1e2330] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold py-2.5 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-[#1a1e29] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    handleSubmit();
                  }}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
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
