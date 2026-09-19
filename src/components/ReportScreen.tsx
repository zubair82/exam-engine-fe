import React, { useState, useEffect } from 'react';
import { Award, ArrowLeft, Clock, Sparkles, AlertCircle, Check, XCircle } from 'lucide-react';
import { MathText } from './MathText';
import { Exam, ExamSession, AISuggestion } from '../types';
import ThemeToggle from './ThemeToggle';

interface ReportScreenProps {
  exam: Exam;
  session: ExamSession;
  aiSuggestion: AISuggestion | null;
  loadingAI: boolean;
  onRetry?: () => void;
  onReturnToDashboard: () => void;
  onStartAIFocusTest: (topic: string, subject: string) => void;
}

export default function ReportScreen({
  exam,
  session,
  aiSuggestion,
  loadingAI,
  onRetry,
  onReturnToDashboard,
  onStartAIFocusTest,
}: ReportScreenProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'solutions'>('insights');
  const [selectedSolutionIndex, setSelectedSolutionIndex] = useState(0);
  const [focusGenerating, setFocusGenerating] = useState<string | null>(null);
  const [showMobileReviewGrid, setShowMobileReviewGrid] = useState(false);

  const normalizeSubject = (subj?: string | null): string => {
    if (!subj) return 'Physics';
    const lower = subj.toLowerCase().trim();
    if (lower.includes('math')) return 'Mathematics';
    if (lower.includes('chem')) return 'Chemistry';
    if (lower.includes('phy')) return 'Physics';
    return subj.charAt(0).toUpperCase() + subj.slice(1);
  };

  // Local state to store fetched full questions
  const [fullQuestions, setFullQuestions] = useState<Record<string | number, { correctOption: number, solution: string, diagrams?: string, answerText?: string, text?: string, options?: string[], estimatedTimeSeconds?: number, subject?: string }>>({});

  const selectedQuestion = exam.questions[selectedSolutionIndex];
  const currentFullQ = fullQuestions[selectedQuestion?.id];
  const actualCorrectOption = currentFullQ?.correctOption ?? selectedQuestion?.correctOption;
  const actualSolution = currentFullQ?.solution ?? selectedQuestion?.solution;
  const actualDiagrams = currentFullQ?.diagrams ?? selectedQuestion?.diagrams;
  const estimatedTime = currentFullQ?.estimatedTimeSeconds ?? selectedQuestion?.estimatedTimeSeconds ?? 120;
  const actualSubject = normalizeSubject(currentFullQ?.subject ?? selectedQuestion?.subject);

  // Fetch full question when selectedSolutionIndex changes
  useEffect(() => {
    if (!selectedQuestion) return;
    if (fullQuestions[selectedQuestion.id]) return; // Already fetched

    const fetchFullQuestion = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080'}/api/v1/exams/${exam.id}/questions/${selectedQuestion.id}/full`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
        });
        if (res.ok) {
          const fullQ = await res.json();
          let correctOpt = -1;
          const ansStr = fullQ.answer ? String(fullQ.answer).trim().toUpperCase() : "";
          if (ansStr.startsWith('A.') || ansStr.startsWith('A ') || ansStr === 'A' || ansStr === '1') correctOpt = 0;
          else if (ansStr.startsWith('B.') || ansStr.startsWith('B ') || ansStr === 'B' || ansStr === '2') correctOpt = 1;
          else if (ansStr.startsWith('C.') || ansStr.startsWith('C ') || ansStr === 'C' || ansStr === '3') correctOpt = 2;
          else if (ansStr.startsWith('D.') || ansStr.startsWith('D ') || ansStr === 'D' || ansStr === '4') correctOpt = 3;

          let parsedOptions: string[] = [];
          if (fullQ.options) {
            try {
              const parsed = JSON.parse(fullQ.options);
              if (Array.isArray(parsed)) parsedOptions = parsed;
              else if (typeof parsed === 'object' && parsed !== null) {
                parsedOptions = ['A', 'B', 'C', 'D'].map(key => parsed[key] || '');
              }
            } catch {
              parsedOptions = [fullQ.options];
            }
          }

          setFullQuestions(prev => ({
            ...prev,
            [selectedQuestion.id]: {
              correctOption: correctOpt,
              solution: fullQ.explanation || 'No explanation provided.',
              diagrams: fullQ.diagrams,
              answerText: fullQ.answer,
              text: fullQ.question_latex || '',
              options: parsedOptions,
              estimatedTimeSeconds: fullQ.estimated_time_seconds ?? fullQ.estimatedTimeSeconds,
              subject: fullQ.subject
            }
          }));
        }
      } catch (err) {
        console.error("Error fetching full question:", err);
      }
    };
    fetchFullQuestion();
  }, [selectedSolutionIndex, exam.id, selectedQuestion, fullQuestions]);

  // Helper stats
  const totalQuestions = exam.questions.length;

  // Calculate counts
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let physicsScore = 0;
  let chemistryScore = 0;
  let mathematicsScore = 0;

  let physicsTotal = 0;
  let chemistryTotal = 0;
  let mathematicsTotal = 0;

  let physicsTime = 0;
  let chemistryTime = 0;
  let mathematicsTime = 0;

  exam.questions.forEach((q) => {
    const chosen = session.answers[q.id];
    const correctOpt = fullQuestions[q.id]?.correctOption ?? q.correctOption;

    let isCorrect = false;
    if (chosen !== undefined) {
      if (q.type === 'numerical') {
        const ansText = fullQuestions[q.id]?.answerText ?? q.correctAnswerText ?? "";
        const extractedSelected = String(chosen).match(/-?\d+(\.\d+)?/);
        const extractedCorrect = String(ansText).match(/-?\d+(\.\d+)?/);
        const valSelected = extractedSelected ? parseFloat(extractedSelected[0]) : NaN;
        const valCorrect = extractedCorrect ? parseFloat(extractedCorrect[0]) : NaN;
        isCorrect = !isNaN(valSelected) && !isNaN(valCorrect) && valSelected === valCorrect;
      } else {
        let parsedChosen = chosen;
        if (typeof chosen === 'string' && !isNaN(parseInt(chosen))) {
          parsedChosen = parseInt(chosen);
        }
        isCorrect = parsedChosen === correctOpt;
      }
    }

    const normSubj = normalizeSubject(q.subject);
    const timeSpent = session.timeSpent[q.id] || 0;
    if (normSubj === 'Physics') { physicsTotal += 4; physicsTime += timeSpent; }
    else if (normSubj === 'Chemistry') { chemistryTotal += 4; chemistryTime += timeSpent; }
    else if (normSubj === 'Mathematics') { mathematicsTotal += 4; mathematicsTime += timeSpent; }

    if (chosen === undefined) {
      unattemptedCount++;
    } else if (isCorrect) {
      correctCount++;
      if (normSubj === 'Physics') physicsScore += 4;
      else if (normSubj === 'Chemistry') chemistryScore += 4;
      else if (normSubj === 'Mathematics') mathematicsScore += 4;
    } else {
      incorrectCount++;
      if (normSubj === 'Physics') physicsScore -= 1;
      else if (normSubj === 'Chemistry') chemistryScore -= 1;
      else if (normSubj === 'Mathematics') mathematicsScore -= 1;
    }
  });

  if (session.reportStats) {
    correctCount = session.reportStats.correctCount;
    incorrectCount = session.reportStats.incorrectCount;
    unattemptedCount = session.reportStats.unattemptedCount;
  }

  const totalObtained = session.score ?? (correctCount * 4 - incorrectCount * 1);
  const maxScore = totalQuestions * 4;
  const accuracy = (correctCount + incorrectCount) > 0
    ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
    : 0;

  const formatTimeSpent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const subjectTimes: Record<string, number> = {
    'Physics': physicsTime,
    'Chemistry': chemistryTime,
    'Mathematics': mathematicsTime
  };

  let finalTotalTime = physicsTime + chemistryTime + mathematicsTime;
  if (session.reportStats && session.reportStats.totalTimeSpent !== undefined && session.reportStats.totalTimeSpent > 0) {
    finalTotalTime = session.reportStats.totalTimeSpent;
  }

  // Dynamic radar chart data preparation
  const getRadarData = () => {
    if (aiSuggestion?.radar_data && aiSuggestion.radar_data.length >= 3) {
      return aiSuggestion.radar_data.map(item => ({
        subject: item.subject,
        score: item.score,
        total: 1,
        timeSpent: subjectTimes[item.subject] || 0,
        fraction: Math.max(0.1, Math.min(1.0, item.score))
      }));
    }

    return [
      { subject: 'Physics', score: Math.max(0, physicsScore), total: physicsTotal || 1, timeSpent: physicsTime, fraction: physicsTotal > 0 ? Math.max(0, physicsScore) / physicsTotal : 0.1 },
      { subject: 'Chemistry', score: Math.max(0, chemistryScore), total: chemistryTotal || 1, timeSpent: chemistryTime, fraction: chemistryTotal > 0 ? Math.max(0, chemistryScore) / chemistryTotal : 0.1 },
      { subject: 'Mathematics', score: Math.max(0, mathematicsScore), total: mathematicsTotal || 1, timeSpent: mathematicsTime, fraction: mathematicsTotal > 0 ? Math.max(0, mathematicsScore) / mathematicsTotal : 0.1 }
    ].map(item => ({ ...item, fraction: Math.max(0.1, Math.min(1.0, item.fraction)) }));
  };

  const radarDataPoints = getRadarData();
  const numRadarPoints = radarDataPoints.length;
  const cx = 160;
  const cy = 160;
  const maxR = 120;

  const getCoord = (index: number, totalPoints: number, radius: number) => {
    const angle = (Math.PI * 2 * index) / totalPoints - Math.PI / 2;
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  };

  const studentPolygonPoints = radarDataPoints.map((dp, i) => {
    const pt = getCoord(i, numRadarPoints, maxR * dp.fraction);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const grid50PolygonPoints = Array.from({ length: numRadarPoints }).map((_, i) => {
    const pt = getCoord(i, numRadarPoints, maxR * 0.5);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const grid100PolygonPoints = Array.from({ length: numRadarPoints }).map((_, i) => {
    const pt = getCoord(i, numRadarPoints, maxR);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const getLabelCoord = (index: number, totalPoints: number, radius: number) => {
    const pt = getCoord(index, totalPoints, radius);
    const angle = (Math.PI * 2 * index) / totalPoints - Math.PI / 2;
    let anchor = "middle";
    if (Math.cos(angle) > 0.1) anchor = "start";
    else if (Math.cos(angle) < -0.1) anchor = "end";
    return { x: pt.x, y: pt.y, textAnchor: anchor };
  };

  return (
    <div className="bg-slate-50 dark:bg-[#1a1e29] min-h-screen text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">

      {/* Top navbar */}
      <header className="sticky top-0 z-40 bg-slate-900 dark:bg-[#222736] text-white h-16 flex items-center px-6 border-b border-slate-800 dark:border-slate-700/60 justify-between shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <button
            onClick={onReturnToDashboard}
            className="p-1.5 hover:bg-slate-800 dark:hover:bg-[#1e2330] rounded-lg transition-colors text-slate-300 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            <Award className="w-5 h-5 text-blue-400" />
            Performance Diagnostic Report
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle size="sm" />

          <button
            onClick={onReturnToDashboard}
            className="text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main body content */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col gap-8 overflow-y-auto">

        {/* Scoreboard Metrics Banner */}
        <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Test Attempt Complete</span>
              <h2 className="text-2xl font-bold text-slate-950 dark:text-slate-100 tracking-tight">{exam.name}</h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">Attempt Date: {session.completedAt || new Date().toLocaleDateString()}</p>
            </div>

            {/* Score pill */}
            <div className="flex items-center justify-between md:justify-end gap-2 md:gap-6 divide-x divide-slate-150 dark:divide-slate-700 w-full md:w-auto">
              <div className="pr-2 md:pr-6 text-center flex-1 md:flex-none">
                <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wide block leading-tight">Obtained Score</span>
                <span className="text-3xl md:text-4xl font-extrabold text-blue-900 dark:text-blue-400 tracking-tight block mt-1">{totalObtained}<span className="text-xs md:text-sm text-slate-400 font-semibold"> / {maxScore}</span></span>
              </div>

              <div className="px-2 md:px-6 text-center flex-1 md:flex-none">
                <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wide block leading-tight">Accuracy Rate</span>
                <span className="text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400 block mt-1 md:mt-2">{accuracy}%</span>
              </div>

              <div className="pl-2 md:pl-6 text-center flex-1 md:flex-none">
                <span className="text-[9px] md:text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wide block leading-tight">Cheating Warnings</span>
                <span className={`text-lg md:text-xl font-bold block mt-1 md:mt-2 ${session.cheatingWarnings > 0 ? 'text-red-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {session.cheatingWarnings} alerts
                </span>
              </div>
            </div>
          </div>

          <hr className="border-slate-150 dark:border-slate-700/60 my-6" />

          {/* Simple category statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 rounded-xl">
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{correctCount}</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">Correct</p>
            </div>

            <div className="p-3 bg-red-50/50 dark:bg-rose-950/60 border border-red-100 dark:border-rose-800 rounded-xl">
              <span className="text-2xl font-bold text-red-700 dark:text-rose-400">{incorrectCount}</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-0.5">Incorrect</p>
            </div>

            <div className="bg-slate-50 dark:bg-[#1e2330] p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-1">{unattemptedCount}</span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Unattempted</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#1e2330] p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {Math.floor(finalTotalTime / 60)} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">mins</span>
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">Time Spent</span>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700/60 gap-6 shrink-0">
          <button
            onClick={() => setActiveTab('insights')}
            className={`pb-3 font-semibold text-sm transition-all cursor-pointer ${activeTab === 'insights'
              ? 'text-blue-900 dark:text-blue-400 border-b-2 border-blue-900 dark:border-blue-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-300'
              }`}
          >
            Overview & AI Insights
          </button>
          <button
            onClick={() => setActiveTab('solutions')}
            className={`pb-3 font-semibold text-sm transition-all cursor-pointer ${activeTab === 'solutions'
              ? 'text-blue-900 dark:text-blue-400 border-b-2 border-blue-900 dark:border-blue-500'
              : 'text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-300'
              }`}
          >
            Detailed Solutions & Answer Key
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === 'insights' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Subject Strength Visualizer Radar Chart (SVG implementation, Colspan 4) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-between">
              <div className="w-full">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Subject Strength Index</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">Custom performance radar mapping</p>
              </div>

              {/* Vector SVG Radar Chart */}
              <div className="my-6 relative w-full min-h-[320px] flex items-center justify-center">
                {loadingAI ? (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="text-xs text-slate-400 dark:text-slate-400 font-bold tracking-wider animate-pulse">GENERATING RADAR...</span>
                  </div>
                ) : (
                  <svg width="320" height="320" className="overflow-visible">
                    {/* Concentric grid polygon at 50% */}
                    <polygon
                      points={grid50PolygonPoints}
                      className="fill-none stroke-slate-200 dark:stroke-slate-700 stroke-1 stroke-dasharray-[3,3]"
                    />
                    {/* Concentric grid polygon at 100% */}
                    <polygon
                      points={grid100PolygonPoints}
                      className="fill-none stroke-slate-300 dark:stroke-slate-600 stroke-1"
                    />

                    {/* Axis lines */}
                    {Array.from({ length: numRadarPoints }).map((_, i) => {
                      const outerPt = getCoord(i, numRadarPoints, maxR);
                      return <line key={`axis-${i}`} x1={cx} y1={cy} x2={outerPt.x} y2={outerPt.y} className="stroke-slate-200 dark:stroke-slate-700 stroke-1" />;
                    })}

                    {/* Student performance polygon */}
                    <polygon
                      points={studentPolygonPoints}
                      className="fill-blue-500/20 dark:fill-blue-500/30 stroke-blue-700 dark:stroke-blue-400 stroke-2"
                    />

                    {/* Coordinates dots (Performance) */}
                    {radarDataPoints.map((dp, i) => {
                      const pt = getCoord(i, numRadarPoints, maxR * dp.fraction);
                      return (
                        <circle key={`dot-${i}`} cx={pt.x} cy={pt.y} r="5" className="fill-blue-900 dark:fill-blue-400 stroke-white dark:stroke-[#252b3b] stroke-2 cursor-pointer pointer-events-auto">
                          <title>{`${dp.subject}: ${Math.round(dp.fraction * 100)}%`}</title>
                        </circle>
                      );
                    })}

                    {/* Labels / Outer Interactive Tooltips */}
                    {radarDataPoints.map((dp, i) => {
                      const labelPt = getLabelCoord(i, numRadarPoints, maxR + 24);
                      const shortLabel = dp.subject.split(' ')[0].substring(0, 4).toUpperCase();
                      return (
                        <g key={`label-${i}`} className="group cursor-help pointer-events-auto">
                          <circle cx={labelPt.x} cy={labelPt.y} r="18" className="fill-slate-50 dark:fill-[#1e2330] stroke-slate-200 dark:stroke-slate-700 stroke-1 group-hover:fill-blue-50 dark:group-hover:fill-blue-950/70 group-hover:stroke-blue-300 dark:group-hover:stroke-blue-500 transition-colors" />
                          <text x={labelPt.x} y={labelPt.y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-600 dark:fill-slate-300 group-hover:fill-blue-700 dark:group-hover:fill-blue-300 pointer-events-none tracking-tight">
                            {shortLabel}
                          </text>
                          <title>{dp.subject}</title>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>

              {/* Subject scores overview */}
              <div className="w-full text-xs font-semibold text-slate-500 dark:text-slate-400 space-y-3 border-t border-slate-100 dark:border-slate-700/60 pt-4 max-h-[140px] overflow-y-auto">
                {loadingAI ? (
                  <div className="flex flex-col gap-3 py-2">
                    <div className="h-4 bg-slate-100 dark:bg-[#1e2330] rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-slate-100 dark:bg-[#1e2330] rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-slate-100 dark:bg-[#1e2330] rounded w-4/6 animate-pulse"></div>
                  </div>
                ) : (
                  radarDataPoints.map((dp, i) => {
                    const percentage = aiSuggestion?.radar_data
                      ? Math.round(dp.score * 100)
                      : Math.round((dp.score / (dp.total || 1)) * 100);

                    return (
                      <div key={`score-${i}`} className="flex flex-col gap-1.5 w-full">
                        <div className="flex justify-between w-full">
                          <span className="text-slate-600 dark:text-slate-300">{dp.subject} {aiSuggestion?.radar_data ? 'Strength' : 'Score'}:</span>
                          <span className="text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <span>{aiSuggestion?.radar_data ? `${percentage}%` : `${dp.score} / ${dp.total}`}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-[#1e2330] px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatTimeSpent(dp.timeSpent)}
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-[#1a1e29] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AI Coaching Insights panel (Colspan 8) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                      AI Performance Diagnostic Focus Plan
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">Actionable coaching insights based on your exact response vectors</p>
                  </div>

                  {loadingAI && (
                    <div className="flex items-center gap-1.5 text-xs text-blue-900 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/70 px-2.5 py-1 rounded">
                      <div className="w-3.5 h-3.5 border-2 border-blue-900 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Analyzing...</span>
                    </div>
                  )}
                </div>

                {loadingAI ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                    <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Consulting AI Exam Experts...</span>
                    <span className="text-[10px] text-slate-400">Reviewing speed-to-accuracy indices and calculation times</span>
                  </div>
                ) : aiSuggestion?.status === 'processing' ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center gap-2">
                    <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Detailed AI analytics report is generating...</span>
                    <span className="text-[10px] text-slate-400">Please refresh this page in a minute to view it.</span>
                  </div>
                ) : aiSuggestion?.summary ? (
                  <div className="space-y-6">
                    {/* General Summary feedback */}
                    <div className="p-4 bg-slate-50 dark:bg-[#1e2330] border border-slate-150 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                      <strong className="block mb-1 text-emerald-700 dark:text-emerald-400">✓ What Went Well</strong>
                      <ul className="list-disc pl-5 mb-4 space-y-1">
                        {aiSuggestion.summary?.what_went_well?.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>

                      <strong className="block mb-1 text-red-600 dark:text-rose-400">⚠ Where The Gap Is</strong>
                      <ul className="list-disc pl-5 space-y-1">
                        {aiSuggestion.summary?.key_areas_for_improvement?.map((item, idx) => <li key={idx}>{item}</li>)}
                      </ul>
                    </div>

                    {/* Behavioral Analysis */}
                    <div className="space-y-3.5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Behavioral Insights</span>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1e2330] text-center">
                          <strong className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 block">Speed vs Accuracy</strong>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{aiSuggestion.behavioral_metrics?.speed_accuracy_score?.value}</div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{aiSuggestion.behavioral_metrics?.speed_accuracy_score?.label}</p>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1e2330] text-center">
                          <strong className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 block">Guessing Prob</strong>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{aiSuggestion.behavioral_metrics?.guessing_probability?.value}</div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{aiSuggestion.behavioral_metrics?.guessing_probability?.label}</p>
                        </div>

                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1e2330] text-center">
                          <strong className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 block">Strategy Score</strong>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{aiSuggestion.behavioral_metrics?.strategy_score?.value}</div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{aiSuggestion.behavioral_metrics?.strategy_score?.label}</p>
                        </div>
                      </div>

                      {/* Weaknesses */}
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mt-6">Weakness Mapping</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiSuggestion.weakness_mapping?.map((w, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1e2330] flex justify-between items-center">
                            <div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{w.subject}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">{w.topic}</div>
                            </div>
                            <div className={`text-xs font-bold px-2 py-1 rounded ${w.priority === 'High' ? 'bg-red-100 dark:bg-rose-950/60 text-red-700 dark:text-rose-400' : w.priority === 'Medium' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                              {w.priority} Priority
                            </div>
                          </div>
                        ))}
                      </div>

                      <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block mt-6">Coaching Tip</span>
                      <div className="p-4 border border-blue-200 dark:border-blue-900/60 rounded-xl bg-blue-50/50 dark:bg-blue-950/40 flex gap-2.5">
                        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900 dark:text-blue-300 font-semibold leading-relaxed">{aiSuggestion.coaching_tip}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center gap-1 bg-slate-50 dark:bg-[#1e2330] border border-slate-200 dark:border-slate-700 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">AI analysis unavailable</span>
                    <span className="text-[10px] text-slate-400">Configure your GEMINI_API_KEY to unlock cognitive coaching feedback.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Answer Key and Solutions panel */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4 sm:p-6 shadow-sm flex-1 overflow-hidden min-h-[500px]">

            {/* Left grid question navigator (Colspan 4) -> Slider on mobile */}
            {showMobileReviewGrid && (
              <div 
                className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
                onClick={() => setShowMobileReviewGrid(false)}
              />
            )}
            <div className={`fixed left-0 top-0 bottom-0 z-50 lg:static lg:z-auto w-[300px] lg:w-auto bg-white dark:bg-[#252b3b] lg:bg-transparent lg:col-span-4 border-r border-slate-200 dark:border-slate-700/60 p-4 lg:p-2 overflow-y-auto max-h-screen lg:max-h-[520px] shadow-xl lg:shadow-none transition-transform duration-300 ease-in-out ${showMobileReviewGrid ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
              <div className="flex justify-between items-center mb-4 lg:mb-3 px-1">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Questions Review Grid</span>
                <button onClick={() => setShowMobileReviewGrid(false)} className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((q, idx) => {
                  const studentAnswer = session.answers[q.id];
                  let isCorrect = false;

                  if (q.type === 'numerical') {
                    const ansText = fullQuestions[q.id]?.answerText ?? q.correctAnswerText ?? "";
                    const extractedSelected = String(studentAnswer).match(/-?\d+(\.\d+)?/);
                    const extractedCorrect = String(ansText).match(/-?\d+(\.\d+)?/);
                    const valSelected = extractedSelected ? parseFloat(extractedSelected[0]) : NaN;
                    const valCorrect = extractedCorrect ? parseFloat(extractedCorrect[0]) : NaN;
                    isCorrect = !isNaN(valSelected) && !isNaN(valCorrect) && valSelected === valCorrect;
                  } else {
                    const correctOpt = fullQuestions[q.id]?.correctOption ?? q.correctOption;
                    let parsedStudentAns = studentAnswer;
                    if (typeof studentAnswer === 'string' && !isNaN(parseInt(studentAnswer))) {
                      parsedStudentAns = parseInt(studentAnswer);
                    }
                    isCorrect = parsedStudentAns === correctOpt;
                  }
                  const isUnattempted = studentAnswer === undefined;
                  const isActive = selectedSolutionIndex === idx;

                  let colorClass = 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1e2330]';
                  if (!isUnattempted) {
                    colorClass = isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-rose-950/60 text-red-800 dark:text-rose-300 border-red-300 dark:border-rose-800';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setSelectedSolutionIndex(idx);
                        if (window.innerWidth < 1024) setShowMobileReviewGrid(false);
                      }}
                      className={`h-9 rounded-lg border text-xs font-bold flex items-center justify-center relative cursor-pointer ${colorClass} ${isActive ? 'ring-2 ring-blue-900 dark:ring-blue-400 ring-offset-1 dark:ring-offset-[#252b3b] z-10 font-black' : ''
                        }`}
                    >
                      {idx + 1}
                      {!isUnattempted && (
                        <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${isCorrect ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-red-500 dark:bg-rose-400'}`}></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Question Solution Viewer (Colspan 8) */}
            <div className="lg:col-span-8 p-2 sm:p-4 flex flex-col justify-start overflow-y-auto max-h-[520px] gap-6 text-slate-800 dark:text-slate-200">

              {/* Mobile Question Palette Button */}
              <button 
                onClick={() => setShowMobileReviewGrid(true)}
                className="lg:hidden w-full flex justify-center items-center gap-2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 px-3 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>format_list_bulleted</span>
                <span>Question Palette</span>
              </button>

              {/* Question identity */}
              <div className="space-y-4">

                <div className="flex justify-between items-center text-xs font-bold pb-2 border-b border-slate-150 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-800 dark:text-slate-100">Question {selectedQuestion.id} • {actualSubject}</span>
                    <span className="text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-[#1e2330] border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[10px]">
                      {selectedQuestion.type}
                    </span>
                  </div>
                </div>

                {/* Question body text */}
                <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap text-slate-900 dark:text-slate-100"><MathText text={currentFullQ?.text ?? selectedQuestion.text} diagramsText={actualDiagrams} /></div>

                {/* Question options */}
                {selectedQuestion.type === 'numerical' ? (
                  <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-[#1e2330] text-slate-800 dark:text-slate-200 text-sm font-semibold flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 mr-2">Correct Answer:</span>
                        {currentFullQ?.answerText ?? "Value"}
                      </div>
                    </div>
                    {session.answers[selectedQuestion.id] !== undefined && (
                      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 mr-2">Your Answer:</span>
                          <span className={
                            (() => {
                              const extractedSelected = String(session.answers[selectedQuestion.id]).match(/-?\d+(\.\d+)?/);
                              const extractedCorrect = String(currentFullQ?.answerText ?? "").match(/-?\d+(\.\d+)?/);
                              const valSelected = extractedSelected ? parseFloat(extractedSelected[0]) : NaN;
                              const valCorrect = extractedCorrect ? parseFloat(extractedCorrect[0]) : NaN;
                              return !isNaN(valSelected) && !isNaN(valCorrect) && valSelected === valCorrect;
                            })()
                              ? "text-emerald-600 dark:text-emerald-400 font-bold"
                              : "text-red-600 dark:text-rose-400 font-bold"
                          }>
                            {session.answers[selectedQuestion.id]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {(currentFullQ?.options && currentFullQ.options.length > 0 ? currentFullQ.options : selectedQuestion.options).map((opt, idx) => {
                      const studentAnswer = session.answers[selectedQuestion.id];
                      const isCorrectOption = idx === actualCorrectOption;

                      let parsedStudentAns = studentAnswer;
                      if (typeof studentAnswer === 'string' && !isNaN(parseInt(studentAnswer))) {
                        parsedStudentAns = parseInt(studentAnswer);
                      }
                      const isChosenOption = idx === parsedStudentAns;

                      let optClass = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2330] text-slate-700 dark:text-slate-200';
                      if (isCorrectOption) {
                        optClass = 'border-emerald-500 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold';
                      } else if (isChosenOption) {
                        optClass = 'border-red-500 dark:border-rose-800 bg-red-50/20 dark:bg-rose-950/60 text-red-900 dark:text-rose-300';
                      }

                      return (
                        <div
                          key={idx}
                          className={`p-3 border rounded-xl flex items-center justify-between ${optClass}`}
                        >
                          <span className="flex-1"><MathText text={opt} diagramsText={actualDiagrams} /></span>
                          {isCorrectOption && (
                            <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-0.5">
                              <Check className="w-3 h-3" />
                              Correct Answer
                            </span>
                          )}
                          {isChosenOption && !isCorrectOption && (
                            <span className="text-red-700 dark:text-rose-400 bg-red-100 dark:bg-rose-950/80 border border-red-200 dark:border-rose-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-0.5">
                              <XCircle className="w-3 h-3" />
                              Your Selection
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* AI Solution Explanation */}
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-bold text-blue-900 dark:text-blue-300">Step-by-step Solution</span>
                  </div>
                  <div className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed font-medium whitespace-pre-wrap"><MathText text={actualSolution} diagramsText={actualDiagrams} /></div>
                </div>

                {/* Score outcome & time indicator banner (bottom) */}
                <div className="p-3 bg-slate-50 dark:bg-[#1e2330] border border-slate-150 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-900 dark:text-blue-400 shrink-0" />
                    <div className="text-slate-500 dark:text-slate-400 flex flex-col gap-0.5 leading-tight">
                      <span>Time spent: <strong className="text-slate-800 dark:text-slate-200">{session.timeSpent[selectedQuestion.id] || 0} seconds</strong></span>
                      <span className="text-slate-400">Est. time: <strong className="text-slate-700 dark:text-slate-300">{formatTimeSpent(estimatedTime)}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {session.answers[selectedQuestion.id] === undefined ? (
                      <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg text-slate-600 dark:text-slate-300 shadow-sm">
                        <span className="font-bold text-xs uppercase tracking-wide">Unattempted</span>
                        <span className="font-semibold text-[10px]">+0 Marks</span>
                      </div>
                    ) : (selectedQuestion.type === 'numerical' ? (
                      (() => {
                        const extractedSelected = String(session.answers[selectedQuestion.id]).match(/-?\d+(\.\d+)?/);
                        const extractedCorrect = String(currentFullQ?.answerText ?? "").match(/-?\d+(\.\d+)?/);
                        const valSelected = extractedSelected ? parseFloat(extractedSelected[0]) : NaN;
                        const valCorrect = extractedCorrect ? parseFloat(extractedCorrect[0]) : NaN;
                        return !isNaN(valSelected) && !isNaN(valCorrect) && valSelected === valCorrect;
                      })()
                    ) : session.answers[selectedQuestion.id] === actualCorrectOption) ? (
                      <div className="flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-lg text-emerald-700 dark:text-emerald-400 shadow-sm">
                        <span className="font-bold text-xs uppercase tracking-wide">Correct</span>
                        <span className="font-bold text-[10px] text-emerald-600 dark:text-emerald-400">+4 Marks</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center bg-red-50 dark:bg-rose-950/60 border border-red-200 dark:border-rose-800 px-3 py-1 rounded-lg text-red-700 dark:text-rose-400 shadow-sm">
                        <span className="font-bold text-xs uppercase tracking-wide">Incorrect</span>
                        <span className="font-bold text-[10px] text-red-600 dark:text-rose-400">-1 Mark</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
