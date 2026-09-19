import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import ThemeToggle from './ThemeToggle';

interface InstructionsScreenProps {
  onProceed: (paperId: number) => void;
}

export default function InstructionsScreen({ onProceed }: InstructionsScreenProps) {
  const { paperId } = useParams<{ paperId: string }>();
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);
  const [showFullscreenPopup, setShowFullscreenPopup] = useState(() => !document.fullscreenElement);
  const [durationMins, setDurationMins] = useState(180);

  React.useEffect(() => {
    fetch(`${import.meta.env.VITE_EXAM_API_URL || 'http://localhost:8080'}/api/v1/exams`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json()).then(data => {
      const exam = data.find((e: any) => e.exam_code === paperId || e.paper_id === paperId);
      if (exam && exam.duration_seconds) {
        setDurationMins(Math.round(exam.duration_seconds / 60));
      }
    }).catch(console.error);
  }, [paperId]);

  return (
    <div className="bg-white dark:bg-[#1a1e29] min-h-screen p-4 sm:p-8 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
      <AnimatePresence>
        {showFullscreenPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-[#252b3b] rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-slate-200 dark:border-slate-700/70"
            >
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">fullscreen</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Full Screen Required</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">
                To simulate the actual exam environment, this test must be taken in full screen mode. Please do not switch tabs or exit full screen during the exam, as it may result in automatic submission or warnings.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => navigate(-1)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-[#1e2330] transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await document.documentElement.requestFullscreen();
                    } catch (err) {
                      console.error("Error attempting to enable fullscreen:", err);
                    }
                    setShowFullscreenPopup(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer text-sm shadow-sm"
                >
                  Enter Full Screen
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-200 dark:border-slate-700/60 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Please read the instructions carefully</h1>
          <ThemeToggle size="md" />
        </div>
        
        <div className="space-y-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <section>
            <h2 className="text-lg font-bold underline mb-3 text-slate-900 dark:text-slate-100">General Instructions:</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Total duration of the examination is {durationMins} min.</li>
              <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
              <li>The Questions Palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                <ul className="list-none pl-5 mt-3 space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-[#1e2330] text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold">1</div>
                    <span>You have not visited the question yet.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#d9534f] text-white flex items-center justify-center font-bold" style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)" }}>2</div>
                    <span>You have not answered the question.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-[#5cb85c] dark:bg-emerald-600 text-white flex items-center justify-center font-bold" style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)" }}>3</div>
                    <span>You have answered the question.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#603598] text-white flex items-center justify-center font-bold">4</div>
                    <span>You have NOT answered the question, but have marked the question for review.</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#603598] text-white flex items-center justify-center font-bold relative">
                      5 <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#5cb85c] dark:bg-emerald-500 rounded-full border border-white dark:border-[#252b3b]"></div>
                    </div>
                    <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
                  </li>
                </ul>
              </li>
              <li className="mt-4">You can click on the "&gt;" arrow which appears to the left of question palette to collapse the question palette thereby maximizing the question window. To view the question palette again, you can click on "&lt;" which appears on the right side of question window.</li>
              <li>You can click on your "Profile" image on top right corner of your screen to change the language during the exam for entire question paper. On clicking of Profile image you will get a drop-down to change the question content to the desired language.</li>
              <li>You can click on <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-xs font-bold leading-none">↓</span> to navigate to the bottom and <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white rounded-full text-xs font-bold leading-none">↑</span> to navigate to top of the question area, without scrolling.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold underline mb-3 text-slate-900 dark:text-slate-100">Navigating to a Question:</h2>
            <ol className="list-decimal pl-5 space-y-2" start={7}>
              <li>To answer a question, do the following:
                <ol className="list-[lower-alpha] pl-5 mt-2 space-y-1">
                  <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                  <li>Click on <strong className="text-slate-900 dark:text-slate-100">Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
                  <li>Click on <strong className="text-slate-900 dark:text-slate-100">Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                </ol>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold underline mb-3 text-slate-900 dark:text-slate-100">Answering a Question:</h2>
            <ol className="list-decimal pl-5 space-y-2" start={8}>
              <li>Procedure for answering a multiple choice type question:
                <ol className="list-[lower-alpha] pl-5 mt-2 space-y-1">
                  <li>To select your answer, click on the button of one of the options.</li>
                  <li>To deselect your chosen answer, click on the button of the chosen option again or click on the <strong className="text-slate-900 dark:text-slate-100">Clear Response</strong> button</li>
                  <li>To change your chosen answer, click on the button of another option</li>
                  <li>To save your answer, you MUST click on the Save & Next button.</li>
                  <li>To mark the question for review, click on the Mark for Review & Next button.</li>
                </ol>
              </li>
              <li>To change your answer to a question that has already been answered, first select that question for answering and then follow the procedure for answering that type of question.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-bold underline mb-3 text-slate-900 dark:text-slate-100">Navigating through sections:</h2>
            <ol className="list-decimal pl-5 space-y-2" start={10}>
              <li>Sections in this question paper are displayed on the top bar of the screen. Questions in a section can be viewed by click on the section name. The section you are currently viewing is highlighted.</li>
              <li>After click the Save & Next button on the last question for a section, you will automatically be taken to the first question of the next section.</li>
              <li>You can shuffle between sections and questions anything during the examination as per your convenience only during the time stipulated.</li>
              <li>Candidate can view the corresponding section summery as part of the legend that appears in every section above the question palette.</li>
            </ol>
          </section>

          <div className="py-4 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-[#1e2330] p-4 rounded-xl mt-4 border border-slate-200 dark:border-slate-700">
            <strong>Disclaimer:</strong> ExamSimula is an independent educational tool designed to help students practice in a simulated Computer-Based Test (CBT) environment. ExamSimula is not affiliated with, endorsed by, or associated with the National Testing Agency (NTA), the Ministry of Education, or any official examination board. The user interface is simulated solely for familiarization and educational purposes. All exam names and related trademarks are the property of their respective owners.
          </div>

          <div className="py-6">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 text-emerald-600 dark:accent-blue-500 rounded border-slate-300 dark:border-slate-600 focus:ring-emerald-500 dark:bg-[#1a1e29]"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations
              </span>
            </label>
          </div>

          <div className="flex justify-center pb-10">
            <button
              disabled={!isChecked}
              onClick={() => {
                if (paperId) onProceed(Number(paperId));
              }}
              className={`px-12 py-3 rounded-xl text-white font-bold text-lg transition-colors shadow-sm ${isChecked ? 'bg-[#5CB85C] hover:bg-[#4cae4c] dark:bg-emerald-600 dark:hover:bg-emerald-700 cursor-pointer' : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'}`}
            >
              PROCEED
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
