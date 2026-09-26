import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';
import ExamSimulaLogo from './Logo';
import { getExamMetadata } from '../data/examMetadata';
import { ExamTypeConfig } from '../types';
import { fetchExamTypes, matchesExamCategory, normalizeExamCategory, DEFAULT_EXAM_TYPES } from '../services/examTypesService';
import { useRazorpayCheckout } from '../hooks/useRazorpayCheckout';

interface ExamsListScreenProps {
  onStartExam: (paperId: number) => void;
  onViewReport: (paperId: number) => void;
}

export interface ExamItem {
  id: string;
  title: string;
  raw_title?: string;
  paper_id: number;
  total_questions: number;
  duration_seconds: number;
  status: string;
  exam_code?: string;
  category?: string;
  subject?: string;
  display_name?: string;
  bio?: string;
  teacher_id?: string;
  teacher_slug?: string;
  referral_code?: string;
  price_paise?: number;
  is_free?: boolean;
  is_purchased?: boolean;
}

export default function ExamsListScreen({ onStartExam, onViewReport }: ExamsListScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, logout, user } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Referral URL state
  const teacherSlug = searchParams.get('teacher') || '';
  const refCode = searchParams.get('ref') || '';
  const viewParam = searchParams.get('view'); // 'teacher' | 'all'
  const hasReferral = Boolean(teacherSlug || refCode);

  // Resolved teacher details from referral code
  const [referredTeacher, setReferredTeacher] = useState<{ teacher_id: string; display_name: string } | null>(null);

  const { buyPaper, isCheckingOut, activePaperId } = useRazorpayCheckout({
    onSuccess: (_, paperId) => {
      setExams(prev => prev.map(ex => ex.paper_id === paperId ? { ...ex, is_purchased: true } : ex));
    }
  });

  useEffect(() => {
    if (!refCode) return;
    localStorage.setItem('referral_code', refCode);
    sessionStorage.setItem('referral_code', refCode);
    fetch(`${import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080'}/api/v1/teacher/referral/${refCode}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.teacher_id) {
          setReferredTeacher({
            teacher_id: data.teacher_id,
            display_name: data.display_name || ''
          });
        }
      })
      .catch(err => console.error("Failed to resolve teacher by referral code:", err));
  }, [refCode]);

  // Initialize state: 'teacher' if URL contains referral/teacher identifier, otherwise 'all'
  const activeView: 'teacher' | 'all' = hasReferral
    ? (viewParam === 'all' ? 'all' : 'teacher')
    : 'all';

  const handleToggleView = (newView: 'teacher' | 'all') => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', newView);
    setSearchParams(nextParams, { replace: true });
    setCurrentPage(1);
  };

  const [examTypes, setExamTypes] = useState<ExamTypeConfig[]>(DEFAULT_EXAM_TYPES);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('JEE');
  const [activeTab, setActiveTab] = useState<'Full Mocks' | 'Subject Tests' | 'Previous Year Papers'>('Full Mocks');
  const [statusFilter, setStatusFilter] = useState('All Tests');
  const [sortBy, setSortBy] = useState<'Latest First' | 'Difficulty: High to Low' | 'Difficulty: Low to High' | 'Title (A-Z)'>('Latest First');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 1. Fetch server-driven exam types and mock test papers concurrently
  useEffect(() => {
    const loadData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const [typesData, examsRes] = await Promise.all([
          fetchExamTypes(token),
          fetch(`${import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080'}/api/v1/exams`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.ok ? r.json() : []).catch(() => [])
        ]);

        // Map exams
        const mappedExams: ExamItem[] = Array.isArray(examsRes) ? examsRes.map((e: any) => {
          const rawTitle = e.title || e.exam_code || `Mock Test ${e.paper_id}`;
          const displayName = (e.display_name || e.displayName || '').trim();
          const title = displayName && !rawTitle.toLowerCase().includes(`by ${displayName.toLowerCase()}`)
            ? `${rawTitle} by ${displayName}`
            : rawTitle;
          const isFree = e.is_free !== undefined ? Boolean(e.is_free) : (!e.price_paise && !e.price);
          const isPurchased = Boolean(e.is_purchased || e.purchased || e.has_access);
          const pricePaise = e.price_paise ?? (e.price ? e.price * 100 : 0);

          return {
            id: String(e.paper_id),
            title,
            raw_title: rawTitle,
            paper_id: Number(e.paper_id),
            total_questions: e.total_questions || 75,
            duration_seconds: e.duration_seconds || 10800,
            status: e.status || 'Unattempted',
            exam_code: e.exam_code || '',
            category: e.category || '',
            subject: e.subject || '',
            display_name: displayName,
            bio: e.bio || '',
            teacher_id: e.teacher_id || '',
            price_paise: pricePaise,
            is_free: isFree,
            is_purchased: isPurchased
          };
        }) : [];

        // Deduplicate exams by paper_id to prevent any duplicate card rendering
        const seenIds = new Set<number>();
        const uniqueExams = mappedExams.filter(exam => {
          if (seenIds.has(exam.paper_id)) return false;
          seenIds.add(exam.paper_id);
          return true;
        });

        setExams(uniqueExams);

        // Merge server-driven types with any newly discovered exam codes from the database papers
        const finalTypes = [...typesData];
        const existingCodes = new Set(typesData.map(t => t.exam_code.toUpperCase()));

        mappedExams.forEach(e => {
          const detected = normalizeExamCategory(e, typesData);
          if (detected && !existingCodes.has(detected.toUpperCase())) {
            existingCodes.add(detected.toUpperCase());
            finalTypes.push({
              exam_code: detected.toUpperCase(),
              name: `${detected.toUpperCase()} Exam Series`,
              subjects: ['Section 1', 'Section 2', 'Section 3'],
              duration_seconds: e.duration_seconds || 10800,
              total_questions: e.total_questions || 75,
              total_marks: (e.total_questions || 75) * 4,
              is_active: true
            });
          }
        });

        setExamTypes(finalTypes);

        // Ensure activeCategory exists
        if (finalTypes.length > 0 && !finalTypes.some(t => t.exam_code.toUpperCase() === activeCategory.toUpperCase())) {
          setActiveCategory(finalTypes[0].exam_code);
        }
      } catch (error) {
        console.error("Error loading exam list & types:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  // Current active exam type config
  const currentExamType = useMemo(() => {
    return examTypes.find(t => t.exam_code.toUpperCase() === activeCategory.toUpperCase()) || examTypes[0] || DEFAULT_EXAM_TYPES[0];
  }, [examTypes, activeCategory]);

  // Dynamic subjects from server-driven config
  const availableSubjects = useMemo(() => {
    if (currentExamType && Array.isArray(currentExamType.subjects) && currentExamType.subjects.length > 0) {
      return currentExamType.subjects;
    }
    return ['Physics', 'Chemistry', 'Mathematics'];
  }, [currentExamType]);

  // Derive teacher display name
  const formattedTeacherName = useMemo(() => {
    if (referredTeacher?.display_name) {
      return referredTeacher.display_name;
    }
    if (teacherSlug) {
      return teacherSlug
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'Teacher';
  }, [referredTeacher, teacherSlug]);

  // Check if an exam belongs to the referred teacher by comparing teacher_id
  const isExamByReferredTeacher = (exam: ExamItem): boolean => {
    if (!hasReferral) return true;

    // Compare exam_paper's teacher_id with the teacher_id resolved from the referral code
    if (referredTeacher?.teacher_id && exam.teacher_id) {
      const cleanPaperTeacherId = exam.teacher_id.replace(/-/g, '').toLowerCase().trim();
      const cleanReferredId = referredTeacher.teacher_id.replace(/-/g, '').toLowerCase().trim();
      return cleanPaperTeacherId === cleanReferredId;
    }

    return false;
  };

  // Count of teacher-specific exams in the current category
  const teacherExamsCount = useMemo(() => {
    return exams.filter(e => isExamByReferredTeacher(e) && matchesExamCategory(e, activeCategory, examTypes)).length;
  }, [exams, activeCategory, examTypes, referredTeacher, hasReferral]);

  // Reset pagination on filter or view changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedSubjects([]);
  }, [activeCategory, searchQuery, statusFilter, activeTab, activeView]);

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // 0. Teacher Referral View Filter (compares exam_paper teacher_id with referral teacher_id)
      if (hasReferral && activeView === 'teacher') {
        if (!isExamByReferredTeacher(exam)) {
          return false;
        }
      }

      // 1. Server-driven Category match (case-insensitive)
      if (!matchesExamCategory(exam, activeCategory, examTypes)) {
        return false;
      }

      // 2. Status filter
      if (statusFilter !== 'All Tests') {
        const examStatus = (exam.status || '').toLowerCase();
        const targetStatus = statusFilter.toLowerCase();
        if (examStatus !== targetStatus) {
          return false;
        }
      }

      // 3. Tab filter (Mock Type)
      if (activeTab === 'Previous Year Papers') {
        const title = exam.title.toLowerCase();
        const code = (exam.exam_code || '').toLowerCase();
        const isPYQ = title.includes('pyq') || title.includes('previous') || title.includes('202') || code.includes('pyq');
        if (!isPYQ) return false;
      } else if (activeTab === 'Subject Tests') {
        const title = exam.title.toLowerCase();
        const isSubject = title.includes('subject') || title.includes('chapter') || title.includes('part');
        if (!isSubject) return false;
      }

      // 4. Subject filter (if subjects selected)
      if (selectedSubjects.length > 0) {
        const examSubj = (exam.subject || '').toLowerCase();
        const examTitle = exam.title.toLowerCase();
        const hasMatchingSubject = selectedSubjects.some(s =>
          examSubj.includes(s.toLowerCase()) || examTitle.includes(s.toLowerCase())
        );
        if (!hasMatchingSubject && examSubj !== '') return false;
      }

      // 5. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = exam.title.toLowerCase().includes(q);
        const codeMatch = (exam.exam_code || '').toLowerCase().includes(q);
        const subjectMatch = (exam.subject || '').toLowerCase().includes(q);
        if (!titleMatch && !codeMatch && !subjectMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'Title (A-Z)') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'Difficulty: High to Low') {
        return b.total_questions - a.total_questions;
      }
      if (sortBy === 'Difficulty: Low to High') {
        return a.total_questions - b.total_questions;
      }
      return b.paper_id - a.paper_id;
    });
  }, [exams, activeCategory, examTypes, statusFilter, activeTab, selectedSubjects, searchQuery, sortBy, hasReferral, activeView, teacherSlug, refCode]);

  const totalPages = Math.ceil(filteredExams.length / itemsPerPage) || 1;
  const paginatedExams = filteredExams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getCategoryCount = (categoryCode: string) => {
    return exams.filter(e => matchesExamCategory(e, categoryCode, examTypes)).length;
  };

  return (
    <div className="bg-slate-50 dark:bg-[#1a1e29] text-slate-900 dark:text-slate-100 font-sans min-h-screen transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 w-full h-16 fixed top-0 z-50 transition-colors duration-200">
        <div className="flex justify-between items-center w-full px-4 md:px-8 max-w-[1440px] mx-auto h-full">
          <div className="flex items-center gap-6 md:gap-8 min-w-0">
            <span
              className="text-xl font-bold text-blue-900 dark:text-blue-400 cursor-pointer shrink-0 flex items-center gap-2"
              onClick={() => navigate('/dashboard')}
            >
              <ExamSimulaLogo size={28} />
              ExamSimula
            </span>

            {/* Server-Driven Exam Category Tabs */}
            <nav className="hidden md:flex gap-4 lg:gap-6 overflow-x-auto hide-scrollbar py-2">
              {examTypes.map((type) => {
                const isSelected = activeCategory.toUpperCase() === type.exam_code.toUpperCase();
                const count = getCategoryCount(type.exam_code);
                return (
                  <button
                    key={type.exam_code}
                    onClick={() => setActiveCategory(type.exam_code)}
                    className={`pb-1 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer relative flex items-center gap-1.5 ${isSelected
                        ? 'text-blue-900 dark:text-blue-400 border-b-2 border-blue-900 dark:border-blue-500 font-bold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-300'
                      }`}
                    title={type.name}
                  >
                    <span>{type.exam_code}</span>
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected
                          ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300'
                          : 'bg-slate-100 dark:bg-[#1e2330] text-slate-500 dark:text-slate-400'
                        }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Realtime Search Bar */}
            <div className={`hidden sm:flex items-center bg-slate-50 dark:bg-[#1a1e29] px-4 py-1.5 rounded-full border transition-all ${isSearchFocused ? 'ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-500' : 'border-slate-300 dark:border-slate-700'}`}>
              <span className="material-symbols-outlined text-slate-400 mr-2" style={{ fontSize: '18px' }}>search</span>
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-36 lg:w-48 outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400"
                placeholder={`Search ${activeCategory} tests...`}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              )}
            </div>

            <ThemeToggle size="md" />

            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-10 h-10 bg-slate-100 dark:bg-[#1e2330] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-blue-500/20 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined">person</span>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#252b3b] rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/70 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Student'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email || 'student@example.com'}</p>
                  </div>
                  <button
                    onClick={async () => {
                      await logout();
                      navigate('/home');
                    }}
                    className="w-full px-4 py-2 text-left text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                    <span className="text-sm font-semibold">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Exam Category Switcher Ribbon */}
      <div className="md:hidden bg-white dark:bg-[#222736] border-b border-slate-200 dark:border-slate-700/60 pt-20 px-4 pb-2 flex gap-2 overflow-x-auto hide-scrollbar">
        {examTypes.map((type) => {
          const isSelected = activeCategory.toUpperCase() === type.exam_code.toUpperCase();
          const count = getCategoryCount(type.exam_code);
          return (
            <button
              key={type.exam_code}
              onClick={() => setActiveCategory(type.exam_code)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${isSelected
                  ? 'bg-blue-900 dark:bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#1e2330] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
            >
              <span>{type.exam_code}</span>
              {count > 0 && <span className="opacity-80 text-[10px]">({count})</span>}
            </button>
          );
        })}
      </div>

      <main className="pt-8 md:pt-24 pb-20 px-4 md:px-8 max-w-[1440px] mx-auto min-h-screen">
        {/* Tab Navigation (Full Mocks / Subject Tests / PYQs) */}
        <div className="mb-8 border-b border-slate-200 dark:border-slate-700/60">
          <div className="flex gap-8 overflow-x-auto pb-px hide-scrollbar">
            {(['Full Mocks', 'Subject Tests', 'Previous Year Papers'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 border-b-2 text-base md:text-lg flex items-center gap-2 font-semibold whitespace-nowrap cursor-pointer transition-colors ${activeTab === tab
                    ? 'border-blue-900 dark:border-blue-500 text-blue-900 dark:text-blue-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-300'
                  }`}
              >
                <span>{tab}</span>
                {tab === 'Full Mocks' && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold">
                    {filteredExams.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg text-slate-900 dark:text-slate-100 font-bold">Filters</h3>
                  <button
                    className="lg:hidden bg-slate-100 dark:bg-[#1e2330] hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1 rounded-full text-xs text-blue-900 dark:text-blue-400 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>tune</span>
                    {isFiltersOpen ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setStatusFilter('All Tests');
                    setSearchQuery('');
                    setSelectedSubjects([]);
                  }}
                  className="text-xs text-blue-700 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              {/* Filter Groups */}
              <div className={`space-y-6 ${!isFiltersOpen ? 'hidden lg:block' : ''}`}>
                {/* Dynamic Subjects from Server-driven config */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-900 dark:text-slate-200">
                    {activeCategory} Subjects
                  </label>
                  <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
                    {availableSubjects.map((subj) => (
                      <label key={subj} className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                        <input
                          checked={selectedSubjects.includes(subj)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSubjects([...selectedSubjects, subj]);
                            } else {
                              setSelectedSubjects(selectedSubjects.filter(s => s !== subj));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 accent-blue-600 dark:accent-blue-500 dark:bg-[#1a1e29]"
                          type="checkbox"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{subj}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-200 dark:border-slate-700/60 hidden lg:block" />

                {/* Status Radio Filters */}
                <div>
                  <label className="block text-sm font-semibold mb-3 text-slate-900 dark:text-slate-200">Attempt Status</label>
                  <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
                    {(['All Tests', 'In Progress', 'Attempted', 'Unattempted'] as const).map((status) => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                        <input
                          checked={statusFilter === status}
                          onChange={() => { setStatusFilter(status); setCurrentPage(1); }}
                          className="w-4 h-4 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 accent-blue-600 dark:accent-blue-500 dark:bg-[#1a1e29]"
                          name="status"
                          type="radio"
                        />
                        <span className="text-sm text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Test Grid Section */}
          <div className="flex-1 min-w-0">
            {/* Referred Teacher Segmented Toggle Banner */}
            {hasReferral && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-slate-50/60 dark:from-[#202637] dark:via-[#1e2433] dark:to-[#1a1e29] border border-blue-200/70 dark:border-blue-500/20 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 shrink-0">
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>school</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 bg-blue-100/80 dark:bg-blue-950/80 px-2 py-0.5 rounded-md">
                        Teacher Referral
                      </span>
                      {refCode && (
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {refCode}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      Recommended by <span className="font-bold text-blue-900 dark:text-blue-300">{formattedTeacherName}</span>
                    </p>
                  </div>
                </div>

                {/* Segmented Control */}
                <div className="flex items-center bg-slate-200/80 dark:bg-[#161a24] p-1 rounded-xl border border-slate-300/70 dark:border-slate-700/60 self-stretch sm:self-auto shrink-0">
                  <button
                    onClick={() => handleToggleView('teacher')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeView === 'teacher'
                        ? 'bg-white dark:bg-[#252b3b] text-blue-900 dark:text-blue-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
                    <span>{formattedTeacherName}'s Tests</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      activeView === 'teacher'
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                        : 'bg-slate-300/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {teacherExamsCount}
                    </span>
                  </button>

                  <button
                    onClick={() => handleToggleView('all')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      activeView === 'all'
                        ? 'bg-white dark:bg-[#252b3b] text-blue-900 dark:text-blue-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>grid_view</span>
                    <span>Explore All</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredExams.length}</span> mock tests for <span className="font-bold text-blue-900 dark:text-blue-400">{currentExamType.name || activeCategory}</span>
                {hasReferral && activeView === 'teacher' && (
                  <span className="text-blue-700 dark:text-blue-400 font-semibold ml-1">
                    by {formattedTeacherName}
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent border-none text-xs font-bold text-blue-900 dark:text-blue-400 focus:ring-0 cursor-pointer outline-none pl-1"
                >
                  <option value="Latest First" className="dark:bg-[#252b3b]">Latest First</option>
                  <option value="Title (A-Z)" className="dark:bg-[#252b3b]">Title (A - Z)</option>
                  <option value="Difficulty: High to Low" className="dark:bg-[#252b3b]">Difficulty: High to Low</option>
                  <option value="Difficulty: Low to High" className="dark:bg-[#252b3b]">Difficulty: Low to High</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20 min-h-[400px]">
                <div className="w-8 h-8 border-4 border-blue-900 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : paginatedExams.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[400px] content-start">
                {paginatedExams.map((exam) => {
                  const meta = getExamMetadata(exam.title, exam.exam_code);
                  const totalQuestions = exam.total_questions || currentExamType.total_questions || parseInt(meta.questions) || 75;
                  const durationMinutes = exam.duration_seconds
                    ? Math.round(exam.duration_seconds / 60)
                    : currentExamType.duration_seconds
                      ? Math.round(currentExamType.duration_seconds / 60)
                      : 180;
                  const marks = totalQuestions * 4;

                  return (
                    <div key={`exam-${exam.paper_id}`} className="bg-white dark:bg-[#252b3b] border border-slate-200 dark:border-slate-700/70 rounded-2xl p-6 hover:shadow-md transition-all flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/30">
                            {normalizeExamCategory(exam, examTypes)}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${exam.status.toLowerCase() === 'attempted'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : exam.status.toLowerCase() === 'in progress'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                : 'bg-slate-100 dark:bg-[#1e2330] text-slate-500 dark:text-slate-400'
                            }`}>
                            {exam.status}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 line-clamp-2 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                          {exam.title}
                        </h3>

                        <div className="grid grid-cols-2 gap-y-3 mb-6">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>schedule</span>
                            <span className="text-xs">{durationMinutes >= 60 ? `${durationMinutes / 60} Hours` : `${durationMinutes} mins`}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>quiz</span>
                            <span className="text-xs">{totalQuestions} Qs</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '18px' }}>workspace_premium</span>
                            <span className="text-xs">{marks} Marks</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/60">
                        <div>
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">
                            {exam.status.toLowerCase() === 'attempted'
                              ? 'Completed'
                              : exam.status.toLowerCase() === 'in progress'
                                ? 'Ongoing'
                                : exam.is_purchased || exam.is_free
                                  ? 'Available'
                                  : `₹${((exam.price_paise || 4900) / 100).toFixed(0)}`}
                          </span>
                        </div>
                        {exam.status.toLowerCase() === 'attempted' ? (
                          <button
                            className="px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                            onClick={() => {
                              try {
                                onViewReport(exam.paper_id);
                              } catch (e: any) {
                                alert("Error in onViewReport: " + e.message);
                              }
                            }}
                          >
                            View Report
                          </button>
                        ) : exam.status.toLowerCase() === 'in progress' ? (
                          <button
                            className="px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer bg-blue-900 hover:bg-blue-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                            onClick={() => onStartExam(exam.paper_id)}
                          >
                            Resume
                          </button>
                        ) : exam.is_purchased || exam.is_free ? (
                          <button
                            className="px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
                            onClick={() => onStartExam(exam.paper_id)}
                          >
                            Start Now
                          </button>
                        ) : (
                          <button
                            disabled={isCheckingOut && activePaperId === exam.paper_id}
                            className="px-5 py-2 rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5"
                            onClick={() => {
                              buyPaper({
                                paperId: exam.paper_id,
                                paperTitle: exam.title,
                                pricePaise: exam.price_paise || 4900,
                                referralCode: refCode || exam.referral_code
                              });
                            }}
                          >
                            <span className="material-symbols-outlined text-[16px]">shopping_cart</span>
                            <span>{isCheckingOut && activePaperId === exam.paper_id ? 'Opening...' : `Buy Paper (₹${((exam.price_paise || 4900) / 100).toFixed(0)})`}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-white dark:bg-[#252b3b] rounded-2xl border border-slate-200 dark:border-slate-700/70 p-8 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">
                    {hasReferral && activeView === 'teacher' ? 'person_search' : 'menu_book'}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                  {hasReferral && activeView === 'teacher'
                    ? `No ${activeCategory} Tests Found by ${formattedTeacherName}`
                    : `No ${activeCategory} Mock Tests Found`}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                  {hasReferral && activeView === 'teacher'
                    ? `There are currently no mock tests uploaded under ${activeCategory} by ${formattedTeacherName}. You can switch to explore all tests across the marketplace.`
                    : `There are currently no question papers matching your filters for ${currentExamType.name || activeCategory}. Any newly uploaded papers will appear here automatically.`}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {hasReferral && activeView === 'teacher' && (
                    <button
                      onClick={() => handleToggleView('all')}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>explore</span>
                      <span>Explore All Marketplace Tests</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setStatusFilter('All Tests');
                      setSearchQuery('');
                      setSelectedSubjects([]);
                    }}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2330] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 px-6 rounded-xl transition-all cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Pagination Controls */}
            {filteredExams.length > itemsPerPage && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#1e2330] text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNumber = idx + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${currentPage === pageNumber
                            ? 'border-blue-600 bg-blue-600 text-white font-bold'
                            : 'border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#1e2330] text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="text-slate-400 dark:text-slate-500">...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#1e2330] text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-[#222736] border-t border-slate-200 dark:border-slate-700/60 mt-20 transition-colors duration-200">
        <div className="w-full py-12 px-4 md:px-8 flex flex-col md:flex-row justify-between items-start max-w-[1440px] mx-auto gap-8">
          <div className="max-w-sm">
            <span className="text-xl font-bold text-blue-900 dark:text-blue-400 flex items-center gap-2 mb-4">
              <ExamSimulaLogo size={28} />
              ExamSimula
            </span>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Empowering students with industry-standard mock examinations and real-time performance analytics across competitive exams.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-4">Exams</h5>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                {examTypes.map(t => (
                  <li key={t.exam_code}>
                    <button
                      onClick={() => {
                        setActiveCategory(t.exam_code);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:text-blue-900 dark:hover:text-blue-300 transition-colors cursor-pointer text-left"
                    >
                      {t.name || t.exam_code}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-4">Support & Office</h5>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li><Link className="hover:text-blue-900 dark:hover:text-blue-300 transition-colors" to="/contact">Contact Support</Link></li>
                <li><Link className="hover:text-blue-900 dark:hover:text-blue-300 transition-colors" to="/contact">Bengaluru Office</Link></li>
                <li><Link className="hover:text-blue-900 dark:hover:text-blue-300 transition-colors" to="/legal">Compliance Desk</Link></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-400 mb-4">Policies & Legal</h5>
              <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li><Link className="hover:text-blue-900 dark:hover:text-blue-300 transition-colors" to="/terms">Terms of Use</Link></li>
                <li><Link className="hover:text-blue-900 dark:hover:text-blue-300 transition-colors" to="/privacy">Privacy Policy</Link></li>
                <li><Link className="hover:text-blue-900 dark:hover:text-blue-300 transition-colors" to="/refund-policy">Cancellation & Refund</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 border-t border-slate-200 dark:border-slate-700/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">&copy; {new Date().getFullYear()} ExamSimula. All rights reserved.</p>
          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/terms" className="hover:underline">Terms</Link>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <Link to="/refund-policy" className="hover:underline">Refund Policy</Link>
            <Link to="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
