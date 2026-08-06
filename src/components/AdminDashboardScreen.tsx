import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function AdminDashboardScreen() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Real-time progress simulation (visual only)
  const [progress, setProgress] = useState({
    p1: 14,
    p2: 72,
    p3: 64,
    p4: 5
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => ({
        p1: prev.p1 < 100 ? prev.p1 + 0.1 : prev.p1,
        p2: prev.p2 < 100 ? prev.p2 + 0.1 : prev.p2,
        p3: prev.p3 < 100 ? prev.p3 + 0.1 : prev.p3,
        p4: prev.p4 < 100 ? prev.p4 + 0.1 : prev.p4,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-surface text-on-surface font-sans min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 right-0 z-50 flex justify-between items-center h-14 bg-surface border-b border-outline-variant px-margin-desktop" style={{ left: '280px' }}>
        <div className="flex items-center gap-4">
          <span className="text-headline-sm font-bold text-primary">Student Directory</span>
          <div className="hidden md:flex gap-2 ml-4">
            <span className="text-label-lg px-3 py-1 bg-primary-container text-on-primary-container rounded-full">Admin View</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined">local_fire_department</span>
            <span className="text-label-md">System Status: Stable</span>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant bg-primary flex items-center justify-center text-white uppercase text-sm font-bold hover:ring-2 hover:ring-primary/30 transition-all cursor-pointer"
            >
              {user?.name?.[0] || 'A'}
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email || 'admin@example.com'}</p>
                </div>
                <button 
                  onClick={async () => { await logout(); navigate('/home'); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Sidebar (Persistent) */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col z-50">
        <div className="p-6 border-b border-outline-variant">
          <span 
            className="text-headline-sm font-extrabold text-primary tracking-tight cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            ExamSimula
          </span>
          <p className="text-label-md text-on-surface-variant mt-1">Assessment Management</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-xl" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-label-lg">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 bg-primary-container text-on-primary-container font-bold rounded-xl" href="#">
            <span className="material-symbols-outlined">group</span>
            <span className="text-label-lg">Student Directory</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-xl" href="#">
            <span className="material-symbols-outlined">quiz</span>
            <span className="text-label-lg">Exam Builder</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-xl" href="#">
            <span className="material-symbols-outlined">analytics</span>
            <span className="text-label-lg">Global Analytics</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-xl" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-label-lg">Platform Settings</span>
          </a>
          <button 
            onClick={async () => { await logout(); navigate('/home'); }}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors rounded-xl"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="text-label-lg">Logout</span>
          </button>
        </nav>
        <div className="p-4 border-t border-outline-variant bg-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white overflow-hidden uppercase font-bold text-lg">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-label-lg text-on-surface truncate">{user?.name || 'Admin User'}</p>
              <p className="text-label-md text-on-surface-variant truncate">{user?.email || 'admin@example.com'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="ml-[280px] min-h-screen pt-20 pb-12 px-margin-desktop space-y-8">
        {/* Metric Overview Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border border-outline-variant bg-white p-6 rounded-xl flex flex-col justify-between hover:-translate-y-0.5 transition-transform duration-200">
            <div>
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Total Registered</span>
              <div className="text-headline-md text-primary mt-1">12,482</div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-secondary">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              <span className="text-label-md">+8.4% from last month</span>
            </div>
          </div>
          
          <div className="border border-outline-variant bg-white p-6 rounded-xl flex flex-col justify-between border-l-4 border-l-secondary hover:-translate-y-0.5 transition-transform duration-200">
            <div>
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Active Students</span>
              <div className="text-headline-md text-secondary mt-1">1,240</div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
              </span>
              <span className="text-label-md text-on-surface-variant">Currently Live</span>
            </div>
          </div>
          
          <div className="border border-outline-variant bg-white p-6 rounded-xl flex flex-col justify-between hover:-translate-y-0.5 transition-transform duration-200">
            <div>
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Questions Attempted</span>
              <div className="text-headline-md text-primary mt-1">2.1M</div>
            </div>
            <div className="text-label-md text-on-surface-variant mt-4">Avg. 168 per student</div>
          </div>
          
          <div className="border border-outline-variant bg-white p-6 rounded-xl flex flex-col justify-between hover:-translate-y-0.5 transition-transform duration-200">
            <div>
              <span className="text-label-md text-on-surface-variant uppercase tracking-wider">Average Score</span>
              <div className="text-headline-md text-primary mt-1">64.2%</div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-4">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '64.2%' }}></div>
            </div>
          </div>
        </section>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Student Management Table Section */}
          <section className="flex-1 space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
              <div className="relative w-full md:w-96">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                  placeholder="Search by name, ID, or email..." 
                  type="text"
                />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <select className="px-4 py-2 bg-white border border-outline-variant rounded-lg text-label-lg focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                  <option>Exam: All</option>
                  <option>JEE Advanced</option>
                  <option>NEET UG</option>
                  <option>CUET</option>
                </select>
                <select className="px-4 py-2 bg-white border border-outline-variant rounded-lg text-label-lg focus:ring-1 focus:ring-primary outline-none cursor-pointer">
                  <option>Status: All</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-outline text-primary hover:bg-surface-container transition-colors rounded-lg text-label-lg font-bold">
                  <span className="material-symbols-outlined text-[18px]">filter_list</span>
                  More Filters
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="border border-outline-variant rounded-lg overflow-hidden bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-6 py-4 text-label-lg font-bold text-on-surface-variant">Student Name</th>
                    <th className="px-6 py-4 text-label-lg font-bold text-on-surface-variant">ID</th>
                    <th className="px-6 py-4 text-label-lg font-bold text-on-surface-variant">Target Exam</th>
                    <th className="px-6 py-4 text-label-lg font-bold text-on-surface-variant">Status</th>
                    <th className="px-6 py-4 text-label-lg font-bold text-on-surface-variant">Tests</th>
                    <th className="px-6 py-4 text-label-lg font-bold text-on-surface-variant">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {/* Student 1 */}
                  <tr className="hover:bg-surface-container-lowest hover:translate-x-1 transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-lg">RS</div>
                        <div>
                          <p className="text-label-lg font-bold text-primary">Rahul Sharma</p>
                          <p className="text-label-md text-on-surface-variant">rahul.s@university.edu</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-mono-label text-on-surface-variant">#ES-2024-8842</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-label-md rounded-md font-medium">JEE Advanced</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-secondary">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        <span className="text-label-md font-bold">Active</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm font-medium">24 / 30</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-primary text-primary text-label-md font-bold rounded-lg hover:bg-primary hover:text-white transition-all">View Report</button>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"><span className="material-symbols-outlined">edit</span></button>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"><span className="material-symbols-outlined">more_vert</span></button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Student 2 */}
                  <tr className="hover:bg-surface-container-lowest hover:translate-x-1 transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          <img 
                            className="w-full h-full object-cover" 
                            alt="Student Profile" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC03HdCJHlsJhaI0C1DEO5HVaP0LI0Oa_oTpqseGSRg_xlHOx0lWR7kd5Hjy7jvzCx_aN7ZG8DCYwj1bQIYFGdNKehyECcnFeDqbjVW9MjpYoWmbThPth6aAWwv2NEvmzDpW5KYX2CHQnmDDem2NrVYBLEPnnFS1zyV2RVe81kAZJh6NV4GMkRtXnnK_WCDDY72n_5_ioGhaIEyvHXr_-F3yn4-P0gc_Omf-a_HI6T3ks8Xa76R8XyVkGdnbjd09Xg1HL7lwjakDR8"
                          />
                        </div>
                        <div>
                          <p className="text-label-lg font-bold text-primary">Ananya Iyer</p>
                          <p className="text-label-md text-on-surface-variant">ananya.i@academy.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-mono-label text-on-surface-variant">#ES-2024-9120</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-label-md rounded-md font-medium">NEET UG</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-secondary">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        <span className="text-label-md font-bold">Active</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm font-medium">18 / 25</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-primary text-primary text-label-md font-bold rounded-lg hover:bg-primary hover:text-white transition-all">View Report</button>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"><span className="material-symbols-outlined">edit</span></button>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"><span className="material-symbols-outlined">more_vert</span></button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Student 3 */}
                  <tr className="hover:bg-surface-container-lowest hover:translate-x-1 transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center font-bold text-label-lg">PK</div>
                        <div>
                          <p className="text-label-lg font-bold text-primary">Priya Kapoor</p>
                          <p className="text-label-md text-on-surface-variant">p.kapoor@mail.in</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-mono-label text-on-surface-variant">#ES-2024-7731</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-label-md rounded-md font-medium">CUET</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-on-surface-variant opacity-60">
                        <span className="w-2 h-2 rounded-full bg-outline"></span>
                        <span className="text-label-md font-bold">Inactive</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm font-medium">12 / 12</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-primary text-primary text-label-md font-bold rounded-lg hover:bg-primary hover:text-white transition-all">View Report</button>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"><span className="material-symbols-outlined">edit</span></button>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"><span className="material-symbols-outlined">more_vert</span></button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Student 4 */}
                  <tr className="hover:bg-surface-container-lowest hover:translate-x-1 transition-all duration-200 cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-lg">AV</div>
                        <div>
                          <p className="text-label-lg font-bold text-primary">Arjun Verma</p>
                          <p className="text-label-md text-on-surface-variant">averma88@webmail.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-mono-label text-on-surface-variant">#ES-2024-1056</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-label-md rounded-md font-medium">JEE Advanced</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-secondary">
                        <span className="w-2 h-2 rounded-full bg-secondary"></span>
                        <span className="text-label-md font-bold">Active</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm font-medium">42 / 50</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 border border-primary text-primary text-label-md font-bold rounded-lg hover:bg-primary hover:text-white transition-all">View Report</button>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"><span className="material-symbols-outlined">edit</span></button>
                        <button className="p-1.5 text-on-surface-variant hover:bg-surface-container rounded-md"><span className="material-symbols-outlined">more_vert</span></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between">
                <span className="text-label-md text-on-surface-variant">Showing 1-10 of 12,482 students</span>
                <div className="flex items-center gap-2">
                  <button className="p-1 rounded hover:bg-surface-container border border-outline-variant text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
                  <span className="text-label-md font-bold px-3 py-1 bg-primary text-white rounded">1</span>
                  <span className="text-label-md font-bold px-3 py-1 text-on-surface-variant hover:bg-surface-container cursor-pointer rounded">2</span>
                  <span className="text-label-md font-bold px-3 py-1 text-on-surface-variant hover:bg-surface-container cursor-pointer rounded">3</span>
                  <span className="text-label-md font-bold px-3 py-1 text-on-surface-variant">...</span>
                  <span className="text-label-md font-bold px-3 py-1 text-on-surface-variant hover:bg-surface-container cursor-pointer rounded">1248</span>
                  <button className="p-1 rounded hover:bg-surface-container border border-outline-variant text-on-surface-variant"><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
                </div>
              </div>
            </div>
          </section>

          {/* Active Sessions Widget */}
          <aside className="w-full lg:w-96 space-y-6">
            <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">podium</span>
                  <h3 className="text-label-lg font-bold text-primary uppercase tracking-wider">Live Sessions</h3>
                </div>
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded uppercase">Real-time</span>
              </div>
              
              {/* Note: I added a custom hide-scrollbar class to index.css or just relying on standard css if needed */}
              <div className="p-0 max-h-[600px] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="divide-y divide-outline-variant">
                  {/* Live Student 1 */}
                  <div className="p-4 hover:bg-surface-container-lowest transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-md font-bold text-primary">Rahul S.</span>
                      <span className="text-[10px] text-on-surface-variant font-mono-label">Active 01:24:10</span>
                    </div>
                    <div className="text-body-sm text-on-surface-variant mb-3">JEE Mock 4 — <span className="font-bold text-primary">Q12/90</span></div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-container-high h-1 rounded-full">
                        <div className="bg-secondary h-1 rounded-full" style={{ width: `${progress.p1}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">{progress.p1.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  {/* Live Student 2 */}
                  <div className="p-4 hover:bg-surface-container-lowest transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-md font-bold text-primary">Meera Jain</span>
                      <span className="text-[10px] text-on-surface-variant font-mono-label">Active 02:15:30</span>
                    </div>
                    <div className="text-body-sm text-on-surface-variant mb-3">NEET Test 12 — <span className="font-bold text-primary">Q145/200</span></div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-container-high h-1 rounded-full">
                        <div className="bg-secondary h-1 rounded-full" style={{ width: `${progress.p2}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">{progress.p2.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  {/* Live Student 3 */}
                  <div className="p-4 hover:bg-surface-container-lowest transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-md font-bold text-primary">Zaid Khan</span>
                      <span className="text-[10px] text-on-surface-variant font-mono-label">Active 00:45:12</span>
                    </div>
                    <div className="text-body-sm text-on-surface-variant mb-3">CUET Practice — <span className="font-bold text-primary">Q32/50</span></div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-container-high h-1 rounded-full">
                        <div className="bg-secondary h-1 rounded-full" style={{ width: `${progress.p3}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">{progress.p3.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  {/* Live Student 4 */}
                  <div className="p-4 hover:bg-surface-container-lowest transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-label-md font-bold text-primary">Sophia E.</span>
                      <span className="text-[10px] text-on-surface-variant font-mono-label">Active 01:05:00</span>
                    </div>
                    <div className="text-body-sm text-on-surface-variant mb-3">JEE Main Phase 1 — <span className="font-bold text-primary">Q5/90</span></div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-surface-container-high h-1 rounded-full">
                        <div className="bg-secondary h-1 rounded-full" style={{ width: `${progress.p4}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-secondary">{progress.p4.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-3 bg-surface-container-low border-t border-outline-variant text-center">
                <button className="text-label-md font-bold text-primary hover:underline">View All Active Sessions</button>
              </div>
            </div>
            
            <div className="bg-primary-container p-6 rounded-xl text-on-primary-container">
              <h4 className="text-label-lg font-bold mb-2">Quick Reports</h4>
              <p className="text-body-sm opacity-80 mb-4">Generate bulk performance reports for selected groups.</p>
              <button className="w-full py-2 bg-on-primary-container text-primary-container font-bold rounded-lg text-label-md hover:opacity-90 transition-opacity">
                Bulk Export (.csv)
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="ml-[280px]">
        <div className="w-full py-8 px-margin-desktop flex flex-col md:flex-row justify-between items-center max-w-container-max-width mx-auto border-t border-outline-variant bg-surface-container">
          <div className="flex flex-col gap-1">
            <span className="text-headline-sm font-bold text-on-surface-variant">ExamSimula</span>
            <p className="text-body-sm text-on-surface-variant">© 2024 ExamSimula Technologies Pvt Ltd.</p>
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a className="text-label-md text-on-surface-variant hover:underline" href="#">Terms of Service</a>
            <a className="text-label-md text-on-surface-variant hover:underline" href="#">Privacy Policy</a>
            <a className="text-label-md text-on-surface-variant hover:underline" href="#">Contact Support</a>
            <a className="text-label-md text-on-surface-variant hover:underline" href="#">Technical Requirements</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
