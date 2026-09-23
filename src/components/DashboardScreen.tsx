import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, Clock, Activity, CheckCircle2, AlertTriangle, Play, Sparkles, AlertCircle, User, LogOut, Target, X, BookOpen } from 'lucide-react';
import { focusAreaDatabase } from '../data/focusAreas';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import Footer from './Footer';
import ExamSimulaLogo from './Logo';

interface DashboardScreenProps {
  onStartExam: (paperId: number) => void;
  onStartAIFocusTest: (topic: string, subject: string) => void;
  geminiConfigured: boolean;
  streakDays: number;
}

export default function DashboardScreen({
  onStartExam,
  onStartAIFocusTest,
  geminiConfigured,
  streakDays,
}: DashboardScreenProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'home' | 'exams'>('home');
  const [loadingTopic, setLoadingTopic] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, token, logout } = useAuth();

  const [inProgressExam, setInProgressExam] = useState<any>(null);
  const [recommendedExam, setRecommendedExam] = useState<any>(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [overview, setOverview] = useState<any>(null);

  const [showReviseModal, setShowReviseModal] = useState(false);
  const [revisingArea, setRevisingArea] = useState<{ topic: string, subject: string } | null>(null);
  const [resourceData, setResourceData] = useState<any>(null);
  const [loadingResource, setLoadingResource] = useState<boolean>(false);

  useEffect(() => {
    const fetchExams = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080'}/api/v1/exams`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          const mappedData = Array.isArray(data) ? data.map((e: any) => {
            const rawTitle = e.title || e.exam_code || e.exam_name || `Mock Exam ${e.paper_id}`;
            const displayName = (e.display_name || e.displayName || '').trim();
            const title = displayName && !rawTitle.toLowerCase().includes(`by ${displayName.toLowerCase()}`)
              ? `${rawTitle} by ${displayName}`
              : rawTitle;
            return { ...e, title, raw_title: rawTitle, display_name: displayName };
          }) : [];

          const inProgress = mappedData.find((e: any) => (e.status || '').toLowerCase() === 'in progress');
          setInProgressExam(inProgress || null);

          const unattemptedExams = mappedData.filter((e: any) => (e.status || '').toLowerCase() === 'unattempted');
          if (unattemptedExams.length > 0) {
            const randomExam = unattemptedExams[Math.floor(Math.random() * unattemptedExams.length)];
            setRecommendedExam(randomExam);
          }
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
      } finally {
        setLoadingExams(false);
      }
    };

    const fetchOverview = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080'}/api/v1/dashboard/overview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setOverview(data);
        }
      } catch (error) {
        console.error("Error fetching overview:", error);
      }
    };

    fetchExams();
    fetchOverview();
  }, [token]);

  const handlePracticeTopic = async (topic: string, subject: string) => {
    setLoadingTopic(topic);
    try {
      await onStartAIFocusTest(topic, subject);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTopic(null);
    }
  };

  const handleReviseConcept = async (topic: string, subject: string) => {
    setRevisingArea({ topic, subject });
    setShowReviseModal(true);
    setLoadingResource(true);
    setResourceData(null);
    try {
      const apiUrl = import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080';

      // 1. First call POST /api/v1/resources/search-by-tags
      const response = await fetch(`${apiUrl}/api/v1/resources/search-by-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ subject, tags: [topic] })
      });

      let data = null;
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.success && resJson.data && resJson.data.length > 0) {
          data = resJson.data[0];
        }
      }

      // 2. If no resource found, call GET /api/v1/resources/videos fallback
      if (!data) {
        const searchParams = new URLSearchParams({
          subject: subject,
          topic: topic
        });
        const ytResponse = await fetch(`${apiUrl}/api/v1/resources/videos?${searchParams.toString()}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (ytResponse.ok) {
          const ytJson = await ytResponse.json();
          if (ytJson.success && ytJson.data && ytJson.data.length > 0) {
            data = ytJson.data[0];
          }
        }
      }
      setResourceData(data);
    } catch (err) {
      console.error("Error fetching resource:", err);
    } finally {
      setLoadingResource(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-[#1a1e29] min-h-screen text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 h-16 flex justify-between items-center px-4 md:px-6 max-w-7xl mx-auto w-full shrink-0 transition-colors duration-200">
        <div className="flex items-center gap-4 md:gap-8 min-w-0">
          <span
            className="text-lg md:text-xl font-bold tracking-tight text-blue-900 dark:text-blue-400 flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => setActiveTab('home')}
          >
            <ExamSimulaLogo size={28} />
            ExamSimula
          </span>
          <nav className="hidden md:flex gap-6">
            <button onClick={() => setActiveTab('home')} className={`text-sm font-semibold pb-1 border-b-2 transition-all cursor-pointer ${activeTab === 'home' ? 'text-blue-900 dark:text-blue-400 border-blue-900 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-blue-900 dark:hover:text-blue-300'}`}>Home</button>
            <button onClick={() => navigate('/question-papers')} className={`text-sm font-semibold pb-1 border-b-2 transition-all cursor-pointer ${activeTab === 'exams' ? 'text-blue-900 dark:text-blue-400 border-blue-900 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-blue-900 dark:hover:text-blue-300'}`}>Exams</button>
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 md:gap-2 text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-500/30 px-2 md:px-3.5 py-1 rounded-full whitespace-nowrap">
            <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-[10px] md:text-xs">
              <span className="hidden sm:inline">Tests this month: </span>
              <span className="sm:hidden">Tests: </span>
              {overview?.tests_in_month || 0}
            </span>
          </div>

          <ThemeToggle size="md" />

          <div className="relative">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-100 dark:bg-[#1e2330] flex items-center justify-center border border-slate-300 dark:border-slate-700 hover:ring-2 hover:ring-blue-600/30 transition-all cursor-pointer">
              <User className="w-4 h-4 md:w-5 md:h-5 text-slate-600 dark:text-slate-300" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#252b3b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/70 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Student'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || 'student@example.com'}</p>
                </div>
                <button onClick={async () => { await logout(); navigate('/home'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden bg-white dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 px-4 py-2 flex justify-center gap-8 shrink-0">
        <button onClick={() => setActiveTab('home')} className={`text-sm font-semibold pb-1 border-b-2 transition-all ${activeTab === 'home' ? 'text-blue-900 dark:text-blue-400 border-blue-900 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-blue-900 dark:hover:text-blue-300'}`}>Home</button>
        <button onClick={() => navigate('/question-papers')} className={`text-sm font-semibold pb-1 border-b-2 transition-all ${activeTab === 'exams' ? 'text-blue-900 dark:text-blue-400 border-blue-900 dark:border-blue-500' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-blue-900 dark:hover:text-blue-300'}`}>Exams</button>
      </div>

      {/* Main Canvas */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto">

        {loadingExams ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Welcome back, {user?.name ? user.name.split(' ')[0] : 'Alex'}.</h2>
                <p className="text-base text-slate-500 dark:text-slate-400 mt-1">Ready to continue your high-performance preparation?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Active Test Card */}
              {inProgressExam ? (
                <div className="lg:col-span-8 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between shadow-sm group">
                  <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-700"></div>

                  <div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <span className="inline-block bg-red-50 dark:bg-rose-950/60 text-red-700 dark:text-rose-400 border border-red-100 dark:border-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">In Progress</span>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{inProgressExam.title}</h3>
                        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-1">{inProgressExam.subject || 'Mock Test'}</p>
                      </div>
                      <Clock className="text-slate-300 dark:text-slate-500 w-5 h-5" />
                    </div>

                    <div className="mb-6 relative z-10">
                      <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                        <span>Progress</span>
                        <span className="text-blue-900 dark:text-blue-400 font-bold">{inProgressExam.attempted_questions || 0} / {inProgressExam.total_questions || 90} Attempted</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#1a1e29] rounded-full h-2">
                        <div className="bg-blue-900 dark:bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.round(((inProgressExam.attempted_questions || 0) / (inProgressExam.total_questions || 90)) * 100))}%` }}></div>
                      </div>
                      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-400 mt-2 text-right">{inProgressExam.duration_minutes || 180} mins Total</p>
                    </div>
                  </div>

                  <button onClick={() => onStartExam(inProgressExam.paper_id)} className="relative z-10 w-full bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-sm cursor-pointer">
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume Test</span>
                  </button>
                </div>
              ) : (
                <div className="lg:col-span-8 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center items-center shadow-sm text-center">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">All caught up!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">You have no tests currently in progress. Ready to tackle another one?</p>
                  <button onClick={() => navigate('/question-papers')} className="mt-6 bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer">
                    <Play className="w-4 h-4 fill-white" />
                    Find a New Test
                  </button>
                </div>
              )}

              {/* Quick Metrics */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-blue-800 dark:text-blue-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overview?.total_tests_taken || 0}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">Tests Attempted</span>
                </div>
                <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                  <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overview?.average_accuracy || '0%'}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">Accuracy</span>
                </div>
                <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                  <Award className="w-5 h-5 text-blue-900 dark:text-blue-400 mb-2" />
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{overview?.average_score || 0}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-400 font-medium mt-0.5">Avg. Score</span>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-sm">
                  <Target className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-2" />
                  <span className="text-2xl font-bold text-blue-800 dark:text-blue-300">{overview?.tests_in_month || 0}</span>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">Tests this month</span>
                </div>
              </div>

              {/* Recommended Test Card */}
              <div className="lg:col-span-6 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Recommended Tests</h3>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-400 hover:underline cursor-pointer" onClick={() => navigate('/question-papers')}>View All</span>
                </div>

                <div className="bg-slate-50 dark:bg-[#1e2330] border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center flex-1 flex flex-col justify-center items-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-4">
                    <Award className="w-6 h-6" />
                  </div>
                  {recommendedExam ? (
                    <>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">{recommendedExam.title || recommendedExam.exam_name || 'Mock Exam'}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                        Ready for your next challenge? Take this recommended mock test to improve your skills.
                      </p>
                      <button onClick={() => onStartExam(recommendedExam.paper_id || recommendedExam.id)} className="bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm">
                        <Play className="w-4 h-4 fill-white" />
                        Take a Test
                      </button>
                    </>
                  ) : (
                    <>
                      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">Explore Tests</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
                        You're all caught up! Browse the question bank library to find more practice material.
                      </p>
                      <button onClick={() => navigate('/question-papers')} className="bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm">
                        <Play className="w-4 h-4 fill-white" />
                        Browse Library
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* AI Focus Recommendation Area */}
              <div className="lg:col-span-6 bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                      Personalized Focus Areas
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400">Powered by AI Analysis</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mb-5 leading-relaxed">
                    Based on your recent mock scores and time elapsed per question, our AI tutor recommends taking practice tests on these weak chapters:
                  </p>

                  {(!overview || overview.total_tests_taken === 0) ? (
                    <div className="bg-slate-50 dark:bg-[#1e2330] border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center flex-1 flex flex-col justify-center items-center mt-4">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-300 rounded-full flex items-center justify-center mb-4">
                        <Target className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-2">No Data Available Yet</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
                        Complete a diagnostic test or a mock exam to unlock your personalized AI study recommendations and weak areas.
                      </p>
                      <button onClick={() => navigate('/question-papers')} className="bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-lg transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm">
                        <Play className="w-3.5 h-3.5 fill-white" />
                        Take a Test
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {((overview?.personalized_focus_areas && overview.personalized_focus_areas.length > 0) ? overview.personalized_focus_areas : focusAreaDatabase).map((area: any, idx: number) => {
                        const accuracy = area.accuracy ?? area.accuracy_percentage ?? area.accuracy_score ?? 0;
                        return (
                          <div key={area.topic || idx} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#1e2330] border border-slate-200 dark:border-slate-700 rounded-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                            <div className="flex items-center gap-3">
                              {accuracy < 50 ? <AlertTriangle className="w-5 h-5 text-red-500 dark:text-rose-400 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />}
                              <div>
                                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">{area.topic}</span>
                                <span className="text-xs text-slate-400 dark:text-slate-400 font-medium">
                                  {area.subject} • <strong className="text-slate-600 dark:text-slate-300">{accuracy}% Accuracy</strong>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleReviseConcept(area.topic, area.subject)} disabled={loadingResource && revisingArea?.topic === area.topic} className="bg-white dark:bg-[#252b3b] border border-blue-900 dark:border-blue-500 text-blue-900 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Revise Concept</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Revise Concept Modal */}
      {showReviseModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#222736]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-700 dark:text-blue-400" />
                Revise Concept: {revisingArea?.topic}
              </h3>
              <button onClick={() => setShowReviseModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-[#1e2330] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-[#252b3b]">
              {loadingResource ? (
                <div className="flex flex-col justify-center items-center h-64 gap-4">
                  <div className="w-8 h-8 border-4 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Finding the best resource for you...</p>
                </div>
              ) : resourceData ? (
                <div className="flex flex-col gap-4">
                  {resourceData.video_id ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${resourceData.video_id}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : resourceData.url && resourceData.url.includes('youtube.com/watch') ? (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${new URL(resourceData.url).searchParams.get('v')}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/50 rounded-xl p-6 text-center">
                      <BookOpen className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-3" />
                      <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Reading Material</h4>
                      <a href={resourceData.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
                        Open Resource
                      </a>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{resourceData.title || revisingArea?.topic}</h4>
                    {resourceData.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{resourceData.description}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center h-64 text-center">
                  <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                  <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">No resources found</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">We couldn't find a specific resource for this topic. Let's go straight to practice!</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#222736] flex justify-end">
              <button
                onClick={() => setShowReviseModal(false)}
                className="bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold py-2 px-5 rounded-lg transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer compact />
    </div>
  );
}
