import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getExamMetadata } from '../data/examMetadata';

interface ExamsListScreenProps {
  onStartExam: (paperId: number) => void;
  onViewReport: (paperId: number) => void;
}

export default function ExamsListScreen({ onStartExam, onViewReport }: ExamsListScreenProps) {
  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [exams, setExams] = useState<{id: string, title: string, paper_id: number, total_questions: number, duration_seconds: number, status: string}[]>([]);

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
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All Tests');
  const itemsPerPage = 6;

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
          setExams(data.map((e: any) => ({
            id: e.exam_code || e.paper_id,
            title: e.title,
            paper_id: e.paper_id,
            total_questions: e.total_questions,
            duration_seconds: e.duration_seconds,
            status: e.status || 'Unattempted'
          })));
        } else {
          console.error("Failed to fetch exams");
        }
      } catch (error) {
        console.error("Error fetching exams:", error);
      }
    };
    fetchExams();
  }, [token]);

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen">
      {/* TopNavBar */}
      <header className="bg-surface border-b border-outline-variant w-full h-16 fixed top-0 z-50">
        <div className="flex justify-between items-center w-full px-margin-desktop max-w-[1440px] mx-auto h-full">
          <div className="flex items-center gap-8">
            <span 
              className="text-headline-sm font-bold text-primary cursor-pointer"
              onClick={() => navigate('/dashboard')}
            >
              ExamSimula
            </span>
            <nav className="hidden md:flex gap-6">
              <a className="text-primary border-b-2 border-primary pb-1 text-label-lg hover:text-primary transition-colors" href="#">JEE</a>
              {/* <a className="text-on-surface-variant text-label-lg hover:text-primary transition-colors" href="#">NEET</a> */}
              {/* <a className="text-on-surface-variant text-label-lg hover:text-primary transition-colors" href="#">CUET</a> */}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden md:flex items-center bg-surface-container-low px-4 py-1.5 rounded-full border transition-all ${isSearchFocused ? 'ring-2 ring-primary/20 border-primary' : 'border-outline-variant'}`}>
              <span className="material-symbols-outlined text-outline mr-2" style={{ fontSize: '20px' }}>search</span>
              <input 
                className="bg-transparent border-none focus:ring-0 text-body-sm w-48 outline-none" 
                placeholder="Search mock tests..." 
                type="text"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
            </div>
            
            <button className="text-primary p-2 rounded-full hover:bg-surface-container transition-colors">
              <span className="material-symbols-outlined">local_fire_department</span>
            </button>
            
            <div className="relative" ref={profileMenuRef}>
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-bold text-label-lg hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined">person</span>
              </button>
              
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-xl shadow-lg border border-outline-variant py-2 z-50">
                  <button 
                    onClick={async () => {
                      await logout();
                      navigate('/home');
                    }}
                    className="w-full px-4 py-2 text-left text-error hover:bg-error-container hover:text-on-error-container flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                    <span className="text-label-lg font-semibold">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 px-margin-desktop max-w-[1440px] mx-auto min-h-screen">
        {/* Tab Navigation */}
        <div className="mb-8 border-b border-outline-variant">
          <div className="flex gap-8 overflow-x-auto pb-px">
            <button className="pb-4 border-b-2 border-primary text-primary text-title-md md:text-headline-sm flex items-center gap-2 font-semibold whitespace-nowrap">
              Full Mocks
              <span className="text-label-md bg-primary-fixed text-on-primary-fixed px-2 py-0.5 rounded-full font-bold">{exams.length}</span>
            </button>
            <button className="pb-4 border-b-2 border-transparent text-on-surface-variant text-title-md md:text-headline-sm hover:text-primary transition-colors font-semibold whitespace-nowrap">Subject Tests</button>
            <button className="pb-4 border-b-2 border-transparent text-on-surface-variant text-title-md md:text-headline-sm hover:text-primary transition-colors font-semibold whitespace-nowrap">Previous Year Papers</button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-gutter">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-6">
            <div className="bg-surface border border-outline-variant p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-headline-sm text-primary font-semibold">Filters</h3>
                  <button 
                    className="lg:hidden bg-surface-container hover:bg-surface-container-high px-3 py-1 rounded-full text-label-md text-primary transition-colors flex items-center gap-1"
                    onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  >
                    <span className="material-symbols-outlined" style={{fontSize: '18px'}}>tune</span>
                    {isFiltersOpen ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button className="text-label-md text-primary font-semibold hover:underline">Clear all</button>
              </div>
              
              {/* Filter Groups */}
              <div className={`space-y-6 ${!isFiltersOpen ? 'hidden lg:block' : ''}`}>
                {/* Subjects */}
                <div>
                  <label className="block text-label-lg font-semibold mb-3">Subject</label>
                  <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                      <input defaultChecked className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">Physics</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                      <input defaultChecked className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">Chemistry</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                      <input defaultChecked className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" type="checkbox"/>
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">Mathematics</span>
                    </label>
                  </div>
                </div>
                
                <hr className="border-outline-variant hidden lg:block"/>
                
                {/* Status */}
                <div>
                  <label className="block text-label-lg font-semibold mb-3">Status</label>
                  <div className="flex flex-row lg:flex-col gap-4 lg:gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 hide-scrollbar">
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                      <input 
                        checked={statusFilter === 'All Tests'} 
                        onChange={() => { setStatusFilter('All Tests'); setCurrentPage(1); }} 
                        className="w-5 h-5 border-outline-variant text-primary focus:ring-primary" 
                        name="status" 
                        type="radio"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">All Tests</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                      <input 
                        checked={statusFilter === 'In Progress'} 
                        onChange={() => { setStatusFilter('In Progress'); setCurrentPage(1); }} 
                        className="w-5 h-5 border-outline-variant text-primary focus:ring-primary" 
                        name="status" 
                        type="radio"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">In Progress</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                      <input 
                        checked={statusFilter === 'Attempted'} 
                        onChange={() => { setStatusFilter('Attempted'); setCurrentPage(1); }} 
                        className="w-5 h-5 border-outline-variant text-primary focus:ring-primary" 
                        name="status" 
                        type="radio"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">Attempted</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group whitespace-nowrap">
                      <input 
                        checked={statusFilter === 'Unattempted'} 
                        onChange={() => { setStatusFilter('Unattempted'); setCurrentPage(1); }} 
                        className="w-5 h-5 border-outline-variant text-primary focus:ring-primary" 
                        name="status" 
                        type="radio"
                      />
                      <span className="text-body-sm text-on-surface-variant group-hover:text-on-surface">Unattempted</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Promo Card (Desktop)
            <div className="hidden lg:block bg-primary-container p-6 rounded-xl relative overflow-hidden text-on-primary">
              <div className="relative z-10">
                <p className="text-label-lg text-on-primary-container mb-2 font-semibold">PRO PLAN</p>
                <h4 className="text-headline-sm mb-4 font-semibold">Unlock 100+ Advanced Mocks</h4>
                <button className="bg-on-primary-container text-primary-container px-4 py-2 rounded-lg font-semibold hover:scale-105 transition-transform">Upgrade Now</button>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>military_tech</span>
              </div>
            </div>
            */}
          </aside>

          {/* Test Grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <p className="text-body-sm text-on-surface-variant">Showing {(() => {
                const filtered = statusFilter === 'All Tests' ? exams : exams.filter(e => e.status === statusFilter);
                return filtered.length;
              })()} mock tests for <span className="font-bold text-on-surface">JEE Main</span></p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-label-md text-on-surface-variant whitespace-nowrap">Sort by:</span>
                <select className="bg-transparent border-none text-label-md font-bold text-primary focus:ring-0 cursor-pointer outline-none pl-1">
                  <option>Latest First</option>
                  <option>Difficulty: High to Low</option>
                  <option>Difficulty: Low to High</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 min-h-[500px] content-start">
              {(() => {
                const filtered = statusFilter === 'All Tests' ? exams : exams.filter(e => e.status === statusFilter);
                return filtered.length > 0 ? filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((exam) => {
                const totalQuestions = exam.total_questions || 75;
                const durationMinutes = exam.duration_seconds ? Math.round(exam.duration_seconds / 60) : 180;
                const marks = totalQuestions * 4;
                return (
                <div key={exam.id} className="bg-surface border border-outline-variant rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col">
                  <h3 className="text-headline-sm mb-4 line-clamp-2 font-semibold">{exam.title}</h3>
                  <div className="grid grid-cols-2 gap-y-3 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>schedule</span>
                      <span className="text-label-md">{durationMinutes > 60 ? `${durationMinutes/60} Hours` : `${durationMinutes} mins`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>quiz</span>
                      <span className="text-label-md">{totalQuestions} Qs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline" style={{ fontSize: '18px' }}>workspace_premium</span>
                      <span className="text-label-md">{marks} Marks</span>
                    </div>

                  </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline-variant">
                      <span className="text-label-md text-on-surface-variant font-semibold">{exam.status}</span>
                      <button 
                        className="bg-primary hover:bg-primary/90 text-on-primary px-5 py-2 rounded-full text-label-md font-bold transition-colors shadow-sm"
                        onClick={() => {
                          if (exam.status === 'Attempted') {
                            try {
                              onViewReport(exam.paper_id);
                            } catch (e: any) {
                              alert("Error in onViewReport: " + e.message);
                            }
                          } else {
                            onStartExam(exam.paper_id);
                          }
                        }}
                      >
                        {exam.status === 'Attempted' ? 'View Report' : exam.status === 'In Progress' ? 'Resume' : 'Start Now'}
                      </button>
                    </div>
                </div>
              )}) : (
                <div className="col-span-full py-12 text-center text-on-surface-variant">
                  <p>No exams found.</p>
                </div>
              )})()}
            </div>

            {/* Pagination */}
            {(() => {
              const filtered = statusFilter === 'All Tests' ? exams : exams.filter(e => e.status === statusFilter);
              return filtered.length > 0 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low text-on-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                
                {Array.from({ length: Math.ceil(filtered.length / itemsPerPage) || 1 }).map((_, idx) => {
                  const pageNumber = idx + 1;
                  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                  // Show max 5 page buttons logic
                  if (
                    pageNumber === 1 || 
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button 
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-colors ${
                          currentPage === pageNumber 
                            ? 'border-primary bg-primary text-on-primary font-bold' 
                            : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'
                        }`}>
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return <span key={pageNumber} className="text-on-surface-variant">...</span>;
                  }
                  return null;
                })}

                <button 
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage >= Math.ceil(filtered.length / itemsPerPage)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container-low text-on-surface-variant transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )})()}
          </div>
        </div>

        {/* Promo Card (Mobile)
        <div className="lg:hidden mt-8 bg-primary-container p-6 rounded-xl relative overflow-hidden text-on-primary">
          <div className="relative z-10">
            <p className="text-label-lg text-on-primary-container mb-2 font-semibold">PRO PLAN</p>
            <h4 className="text-headline-sm mb-4 font-semibold">Unlock 100+ Advanced Mocks</h4>
            <button className="bg-on-primary-container text-primary-container px-4 py-2 rounded-lg font-semibold hover:scale-105 transition-transform">Upgrade Now</button>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <span className="material-symbols-outlined" style={{ fontSize: '120px' }}>military_tech</span>
          </div>
        </div>
        */}
      </main>

      {/* Footer */}
      <footer className="bg-surface-container border-t border-outline-variant mt-20">
        <div className="w-full py-12 px-margin-desktop flex flex-col md:flex-row justify-between items-start max-w-[1440px] mx-auto gap-8">
          <div className="max-w-sm">
            <span className="text-headline-sm font-bold text-primary block mb-4">ExamSimula</span>
            <p className="text-body-sm text-on-surface-variant mb-6">Empowering students with industry-standard mock examinations and real-time performance analytics for JEE, NEET, and competitive exams.</p>
            <div className="flex gap-4">
              <a className="w-10 h-10 bg-surface-container-highest rounded-full flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors" href="#">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>public</span>
              </a>
              <a className="w-10 h-10 bg-surface-container-highest rounded-full flex items-center justify-center text-primary hover:bg-primary-fixed transition-colors" href="#">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mail</span>
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h5 className="text-label-lg font-semibold text-primary mb-4">Exams</h5>
              <ul className="space-y-3 text-body-sm text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors" href="#">JEE Main</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">JEE Advanced</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">NEET UG</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">CUET</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-label-lg font-semibold text-primary mb-4">Support</h5>
              <ul className="space-y-3 text-body-sm text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors" href="#">Technical Requirements</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Contact Support</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">FAQs</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Help Center</a></li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h5 className="text-label-lg font-semibold text-primary mb-4">Legal</h5>
              <ul className="space-y-3 text-body-sm text-on-surface-variant">
                <li><a className="hover:text-primary transition-colors" href="#">Terms of Service</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="max-w-[1440px] mx-auto px-margin-desktop py-6 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-label-md text-on-surface-variant">© 2024 ExamSimula Technologies Pvt Ltd.</p>
          <div className="flex items-center gap-6 text-label-md text-on-surface-variant">
            <span>Status: All Systems Operational</span>
            <span>Version: 2.4.0-stable</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
