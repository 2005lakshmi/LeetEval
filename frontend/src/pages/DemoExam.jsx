import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import CodeEditor from '../components/CodeEditor';
import { Clock, ShieldAlert, Play, Send, CheckCircle2, XCircle, AlertTriangle, Maximize2, RotateCcw, FileText, Code2, Terminal, ChevronRight, Check, RefreshCw, Lock, Minimize2, GripVertical, GripHorizontal, Save, Trophy, Users, RefreshCcw } from 'lucide-react';

export default function DemoExam() {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState('');
  const [paperData, setPaperData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [codeMap, setCodeMap] = useState({}); // questionId -> code
  const [submittedQuestionIds, setSubmittedQuestionIds] = useState([]);
  const [submissionResultsMap, setSubmissionResultsMap] = useState({}); // questionId -> result

  const [timeRemaining, setTimeRemaining] = useState(1800);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [rawOutput, setRawOutput] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [totalRuntimeMs, setTotalRuntimeMs] = useState(0);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeBottomConsole, setActiveBottomConsole] = useState('testcase');

  // Proctoring State
  const [warningCount, setWarningCount] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [warningLimit] = useState(3);
  const [tabSwitchLimit] = useState(3);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [showResultsModal, setShowResultsModal] = useState(false);

  // Resizable Panels State
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const [editorPanelHeight, setEditorPanelHeight] = useState(60);
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    const savedName = localStorage.getItem('leeteval_demo_name') || 'Demo Student';
    setStudentName(savedName);
    fetchDemoPaper();

    const socket = io();
    socket.emit('join_demo_room');

    socket.on('demo_online_count', (data) => {
      if (data?.onlineCount !== undefined) {
        setOnlineCount(Math.max(1, data.onlineCount));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchDemoPaper = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/student/demo/paper');
      const data = res.data;
      setPaperData(data);
      setTimeRemaining((data.timeLimitMinutes || 30) * 60);

      const initialCodes = {};
      (data.questions || []).forEach((q) => {
        initialCodes[q._id] = q.boilerplate?.python || 'def solution():\n    pass\n';
      });
      setCodeMap(initialCodes);
    } catch (err) {
      console.error('[DemoExam Fetch Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer countdown
  useEffect(() => {
    if (showResultsModal || loading) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinishDemoExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showResultsModal, loading]);

  // Proctoring tab switch & visibility detector
  useEffect(() => {
    if (showResultsModal || loading) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          setWarningCount((wPrev) => wPrev + 1);
          setWarningMessage(`Anti-Cheat Alert: Tab switch detected! (Count: ${newCount})`);
          setShowWarningModal(true);
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showResultsModal, loading]);

  // Resizable panel mouse handlers
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingHorizontal && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        if (newWidth >= 25 && newWidth <= 75) setLeftPanelWidth(newWidth);
      }

      if (isDraggingVertical && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newHeight = ((e.clientY - rect.top) / rect.height) * 100;
        if (newHeight >= 20 && newHeight <= 80) setEditorPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingHorizontal(false);
      setIsDraggingVertical(false);
    };

    if (isDraggingHorizontal || isDraggingVertical) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingHorizontal, isDraggingVertical]);

  const questionsList = Array.isArray(paperData?.questions) ? paperData.questions : [];
  const currentQuestion = questionsList[activeQuestionIndex];

  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    if (currentQuestion) {
      const existingCode = codeMap[currentQuestion._id];
      if (!existingCode || Object.values(currentQuestion.boilerplate || {}).includes(existingCode)) {
        const defaultCode = currentQuestion.boilerplate?.[lang] || '';
        setCodeMap((prev) => ({ ...prev, [currentQuestion._id]: defaultCode }));
      }
    }
  };

  const handleCodeChange = (newCode) => {
    if (!currentQuestion) return;
    setCodeMap((prev) => ({ ...prev, [currentQuestion._id]: newCode }));
  };

  const handleRun = async () => {
    if (!currentQuestion) return;

    setRunning(true);
    setVerdict('Running...');
    setRawOutput('');
    setTestResults(null);
    setTotalRuntimeMs(0);
    setSelectedCaseIdx(0);
    setActiveBottomConsole('result');

    try {
      const res = await axios.post('/api/student/demo/run', {
        language: selectedLanguage,
        code: codeMap[currentQuestion._id],
        testcases: currentQuestion.sampleTestcases || []
      });

      setRunning(false);
      setVerdict(res.data.verdict);
      setRawOutput(res.data.rawOutput || '');
      setTestResults(res.data.testResults || []);
      setTotalRuntimeMs(res.data.totalRuntimeMs || 0);

      if (res.data.verdict === 'Accepted') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      setRunning(false);
      setVerdict('Runtime Error');
      setRawOutput(err.response?.data?.message || err.message || 'Execution failed');
    }
  };

  const handleSubmit = async () => {
    if (!currentQuestion) return;

    setSubmitting(true);
    setVerdict('Submitting...');
    setRawOutput('');
    setTestResults(null);
    setTotalRuntimeMs(0);
    setSelectedCaseIdx(0);
    setActiveBottomConsole('result');

    try {
      const res = await axios.post('/api/student/demo/submit', {
        language: selectedLanguage,
        code: codeMap[currentQuestion._id],
        sampleTestcases: currentQuestion.sampleTestcases || [],
        hiddenTestcases: currentQuestion.hiddenTestcases || []
      });

      const qIdStr = String(currentQuestion._id);
      if (!submittedQuestionIds.includes(qIdStr)) {
        setSubmittedQuestionIds((prev) => [...prev, qIdStr]);
      }

      setSubmissionResultsMap((prev) => ({
        ...prev,
        [qIdStr]: {
          verdict: res.data.verdict,
          testResults: res.data.testResults || [],
          totalRuntimeMs: res.data.totalRuntimeMs || 0,
          code: codeMap[currentQuestion._id],
          language: selectedLanguage
        }
      }));

      setSubmitting(false);
      setVerdict(res.data.verdict);
      setRawOutput(res.data.rawOutput || '');
      setTestResults(res.data.testResults || []);
      setTotalRuntimeMs(res.data.totalRuntimeMs || 0);

      if (res.data.verdict === 'Accepted') {
        confetti({ particleCount: 160, spread: 80, origin: { y: 0.6 } });
      }
    } catch (err) {
      setSubmitting(false);
      setVerdict('Runtime Error');
      setRawOutput(err.response?.data?.message || err.message || 'Execution failed');
    }
  };

  // Calculate Overall Demo Score
  const totalQuestions = questionsList.length;
  let passedQuestionsCount = 0;
  let totalTestcasesPassed = 0;
  let totalTestcasesCount = 0;

  questionsList.forEach((q) => {
    const res = submissionResultsMap[String(q._id)];
    if (res && res.verdict === 'Accepted') passedQuestionsCount++;
    if (res && res.testResults) {
      res.testResults.forEach((tr) => {
        totalTestcasesCount++;
        if (tr.passed) totalTestcasesPassed++;
      });
    }
  });

  const overallScorePercentage = totalTestcasesCount > 0 ? Math.round((totalTestcasesPassed / totalTestcasesCount) * 100) : 0;

  const handleFinishDemoExam = async () => {
    setShowResultsModal(true);

    try {
      const questionSubmissions = questionsList.map((q) => {
        const qIdStr = String(q._id);
        const subRes = submissionResultsMap[qIdStr];
        return {
          questionId: qIdStr,
          questionTitle: q.title,
          code: codeMap[qIdStr] || q.boilerplate?.python || '',
          language: subRes?.language || selectedLanguage,
          verdict: subRes?.verdict || 'Not Submitted',
          testResults: subRes?.testResults || []
        };
      });

      await axios.post('/api/student/demo/submit-exam', {
        name: studentName,
        paperTitle: paperData?.title || 'Demo Exam',
        overallScore: overallScorePercentage,
        passedQuestionsCount,
        totalQuestionsCount: totalQuestions,
        totalTestcasesPassed,
        totalTestcasesCount,
        tabSwitchCount,
        timeTakenSeconds: ((paperData?.timeLimitMinutes || 30) * 60) - timeRemaining,
        questionSubmissions
      });
    } catch (e) {
      console.error('[Demo Result Save Error]:', e);
    }
  };

  const formatLeetCodeInput = (inp) => {
    if (inp === null || inp === undefined) return '';
    if (typeof inp === 'object' && !Array.isArray(inp)) {
      return Object.entries(inp)
        .map(([k, v]) => `${k} =\n${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join('\n');
    }
    if (typeof inp === 'string') {
      try {
        const parsed = JSON.parse(inp);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return Object.entries(parsed)
            .map(([k, v]) => `${k} =\n${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
            .join('\n');
        }
      } catch (e) {}
    }
    return String(inp);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center space-y-4 text-[#00b8a3] font-mono text-sm">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00b8a3]" />
        <span className="font-bold text-white tracking-wider">Loading LeetCode Assessment Interface...</span>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#1a1a1a] text-[#eff1f6] flex flex-col overflow-hidden font-sans select-none relative">
      
      {/* Small Bottom-Left Live Online Counter Pill */}
      <div className="fixed bottom-3 left-3 z-30 flex items-center space-x-2 px-3 py-1 bg-[#282828] border border-[#3e3e3e] rounded-full text-xs font-mono font-bold text-emerald-400 shadow-xl">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{onlineCount} online</span>
      </div>

      {/* Top Navbar Header (Identical to StudentExam.jsx) */}
      <header className="h-12 border-b border-[#333333] bg-[#282828] px-4 flex items-center justify-between flex-shrink-0 z-10">
        
        {/* Left Brand & Problem Selector Pills */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFA116] flex items-center justify-center text-black font-extrabold text-sm">
              L
            </div>
            <span className="font-bold text-white text-sm hidden sm:inline">{paperData?.title}</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">DEMO</span>
          </div>

          <div className="h-4 w-[1px] bg-[#3e3e3e]" />

          {/* Problem Selector Buttons */}
          <div className="flex space-x-1.5 overflow-x-auto">
            {questionsList.map((q, idx) => {
              const isSubmitted = submittedQuestionIds.includes(String(q._id));
              const isActive = activeQuestionIndex === idx;

              return (
                <button
                  key={q._id || idx}
                  onClick={() => {
                    setActiveQuestionIndex(idx);
                    setVerdict(null);
                    setRawOutput('');
                    setTestResults(null);
                    setTotalRuntimeMs(0);
                    setSelectedCaseIdx(0);
                    setActiveBottomConsole('testcase');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                    isActive
                      ? 'bg-[#3e3e3e] text-white shadow-sm border border-[#555555]'
                      : 'text-[#909090] hover:text-slate-200 hover:bg-[#333333]'
                  }`}
                >
                  <span>Problem {idx + 1}</span>
                  {isSubmitted && <Check className="w-3 h-3 text-[#00b8a3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Info & Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Finish Exam Button */}
          {submittedQuestionIds.length === totalQuestions ? (
            <button
              onClick={handleFinishDemoExam}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish & End Assessment ✓</span>
            </button>
          ) : (
            <button
              onClick={handleFinishDemoExam}
              className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-all"
            >
              <span>Finish Exam</span>
            </button>
          )}

          {/* Tab Switch Counter Badge */}
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <RefreshCw className="w-3 h-3" />
            <span>Tab Switches: {tabSwitchCount}/{tabSwitchLimit}</span>
          </div>

          {/* Anti-Cheat Warning Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warnings: {warningCount}/{warningLimit}</span>
          </div>

          {/* Timer Countdown */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#333333] border border-[#444444] text-[#FFA116] font-mono font-bold text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </header>

      {/* Main Split-Panel Content (Identical to StudentExam.jsx) */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden p-2 gap-0 bg-[#1a1a1a] relative">
        
        {/* Left Panel: Problem Statement & Testcases */}
        <div
          style={{ width: `${leftPanelWidth}%` }}
          className="bg-[#282828] rounded-lg border border-[#333333] flex flex-col overflow-hidden min-w-[25%] max-w-[75%]"
        >
          {/* Tab Header */}
          <div className="flex items-center border-b border-[#3e3e3e] bg-[#282828] px-2 pt-1 space-x-1 flex-shrink-0">
            <button
              onClick={() => setActiveLeftTab('description')}
              className={`px-3 py-2 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all ${
                activeLeftTab === 'description'
                  ? 'border-[#FFA116] text-white bg-[#333333]/50 rounded-t-md'
                  : 'border-transparent text-[#8a8a8a] hover:text-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-[#FFA116]" />
              <span>Description</span>
            </button>
          </div>

          {/* Problem Content View */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 text-slate-300 text-sm leading-relaxed">
            {currentQuestion && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{currentQuestion.title}</h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 text-[#00b8a3] border border-emerald-500/20' :
                    currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {currentQuestion.difficulty}
                  </span>
                </div>

                <div className="prose prose-invert max-w-none text-slate-300 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                  {currentQuestion.description}
                </div>

                {currentQuestion.constraints && (
                  <div className="space-y-1.5 pt-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Constraints:</div>
                    <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#3e3e3e] text-xs font-mono text-slate-300 whitespace-pre-wrap">
                      {currentQuestion.constraints}
                    </div>
                  </div>
                )}

                {currentQuestion.sampleTestcases?.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Examples:</div>
                    {currentQuestion.sampleTestcases.map((tc, idx) => (
                      <div key={idx} className="p-3 bg-[#1a1a1a] rounded-lg border border-[#3e3e3e] space-y-2 text-xs font-mono">
                        <div className="text-[#FFA116] font-bold">Example {idx + 1}:</div>
                        <div>
                          <span className="text-slate-400">Input: </span>
                          <span className="text-white font-bold">{tc.input}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Output: </span>
                          <span className="text-[#00b8a3] font-bold">{tc.expectedOutput}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Resizable Divider (Vertical) */}
        <div
          onMouseDown={() => setIsDraggingHorizontal(true)}
          className="w-2 hover:bg-[#FFA116] cursor-col-resize flex items-center justify-center transition-colors group z-20"
        >
          <div className="w-1 h-8 rounded-full bg-[#3e3e3e] group-hover:bg-[#FFA116]" />
        </div>

        {/* Right Panel: Code Editor + LeetCode Console Results */}
        <div
          style={{ width: `${100 - leftPanelWidth}%` }}
          className="flex flex-col overflow-hidden min-w-[25%] max-w-[75%]"
        >
          {/* Editor Header Bar */}
          <div
            style={{ height: `${editorPanelHeight}%` }}
            className="bg-[#282828] rounded-lg border border-[#333333] flex flex-col overflow-hidden mb-1"
          >
            <div className="h-10 border-b border-[#3e3e3e] bg-[#282828] px-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1.5 text-xs text-[#00b8a3] font-bold">
                  <Code2 className="w-4 h-4" />
                  <span>Code</span>
                </div>

                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-[#1a1a1a] text-white px-3 py-1 rounded-md border border-[#3e3e3e] focus:outline-none focus:border-[#FFA116] text-xs font-mono font-bold"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="c">C (GCC)</option>
                  <option value="java">Java (OpenJDK)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRun}
                  disabled={running || submitting}
                  className="px-3 py-1.5 rounded-md bg-[#282828] hover:bg-[#3e3e3e] border border-[#3e3e3e] text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-[#00b8a3]" />
                  <span>{running ? 'Running...' : 'Run Code'}</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={running || submitting}
                  className="px-4 py-1.5 rounded-md bg-[#00b8a3] hover:bg-[#009e8c] text-white text-xs font-bold shadow-md shadow-[#00b8a3]/20 flex items-center space-x-1.5 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                </button>
              </div>
            </div>

            {/* CodeMirror Code Editor Component */}
            <div className="flex-1 overflow-hidden bg-[#1a1a1a]">
              <CodeEditor
                value={codeMap[currentQuestion?._id] || ''}
                onChange={handleCodeChange}
                language={selectedLanguage}
              />
            </div>
          </div>

          {/* Resizable Divider (Horizontal) */}
          <div
            onMouseDown={() => setIsDraggingVertical(true)}
            className="h-2 hover:bg-[#FFA116] cursor-row-resize flex items-center justify-center transition-colors group z-20"
          >
            <div className="h-1 w-8 rounded-full bg-[#3e3e3e] group-hover:bg-[#FFA116]" />
          </div>

          {/* Bottom Console / LeetCode Results Box */}
          <div
            style={{ height: `${100 - editorPanelHeight}%` }}
            className="bg-[#282828] rounded-lg border border-[#333333] flex flex-col overflow-hidden"
          >
            <div className="h-9 border-b border-[#3e3e3e] bg-[#282828] px-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2 text-xs font-semibold">
                <button
                  onClick={() => setActiveBottomConsole('testcase')}
                  className={`px-3 py-1 rounded-t-md transition-all ${
                    activeBottomConsole === 'testcase'
                      ? 'border-b-2 border-[#FFA116] text-white bg-[#333333]/50'
                      : 'text-[#8a8a8a] hover:text-slate-300'
                  }`}
                >
                  Testcase Suite
                </button>
                <button
                  onClick={() => setActiveBottomConsole('result')}
                  className={`px-3 py-1 rounded-t-md transition-all ${
                    activeBottomConsole === 'result'
                      ? 'border-b-2 border-[#FFA116] text-white bg-[#333333]/50'
                      : 'text-[#8a8a8a] hover:text-slate-300'
                  }`}
                >
                  Test Result
                </button>
              </div>
            </div>

            {/* Console Content Box */}
            <div className="flex-1 p-3 overflow-y-auto bg-[#1a1a1a] font-mono text-xs">
              {activeBottomConsole === 'testcase' && (
                <div className="space-y-3">
                  {currentQuestion?.sampleTestcases?.map((tc, idx) => (
                    <div key={idx} className="p-3 bg-[#282828] rounded-lg border border-[#383838] space-y-2">
                      <div className="text-[#FFA116] font-bold">Sample Case {idx + 1}</div>
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#8a8a8a]">Input</div>
                        <div className="bg-[#1a1a1a] p-2.5 rounded border border-[#383838] text-white select-text">
                          {tc.input}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[11px] text-[#8a8a8a]">Expected Output</div>
                        <div className="bg-[#1a1a1a] p-2.5 rounded border border-[#383838] text-[#00b8a3] font-bold select-text">
                          {tc.expectedOutput}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeBottomConsole === 'result' && (
                <div className="font-mono text-xs space-y-3">
                  {(running || submitting) ? (
                    <div className="p-4 rounded-lg bg-[#282828] border border-[#FFA116]/40 text-center space-y-2 font-mono">
                      <div className="flex items-center justify-center space-x-2 text-[#FFA116]">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="font-bold text-sm">Evaluating demo code against testcases...</span>
                      </div>
                    </div>
                  ) : !verdict ? (
                    <div className="text-[#8a8a8a] text-xs pt-4 text-center">
                      Click <strong>Run Code</strong> or <strong>Submit</strong> to evaluate your solution.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* LeetCode Header: Verdict & Runtime */}
                      <div className="flex items-center justify-between border-b border-[#383838] pb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`text-lg font-black tracking-tight ${
                            verdict === 'Accepted' ? 'text-[#2cbb5d]' : 'text-[#ef4743]'
                          }`}>
                            {verdict}
                          </span>
                          {totalRuntimeMs > 0 && (
                            <span className="text-xs text-[#8a8a8a] font-semibold">
                              Runtime: {totalRuntimeMs} ms
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Case Pills Row */}
                      {testResults && testResults.length > 0 && (
                        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                          {testResults.map((tr, idx) => {
                            const isPassed = Boolean(tr.passed);
                            const isSelected = selectedCaseIdx === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedCaseIdx(idx)}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all border ${
                                  isSelected
                                    ? 'bg-white/10 border-slate-500 text-white shadow-md'
                                    : 'bg-[#282828] border-[#383838] text-slate-400 hover:text-white'
                                }`}
                              >
                                <span className={isPassed ? 'text-[#2cbb5d]' : 'text-[#ef4743]'}>
                                  {isPassed ? '✓' : '✕'}
                                </span>
                                <span>Case {idx + 1}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Selected Case Details */}
                      {testResults && testResults.length > 0 && (() => {
                        const curCase = testResults[selectedCaseIdx] || testResults[0];
                        const errText = curCase?.error || curCase?.stderr || curCase?.consoleError;
                        const inputVal = curCase?.input !== undefined ? curCase.input : '';
                        const stdoutVal = curCase?.stdout !== undefined ? curCase.stdout : (curCase?.printed !== undefined ? curCase.printed : (rawOutput && !rawOutput.includes('__RESULTS__') ? rawOutput : ''));
                        const actualVal = curCase?.actualOutput !== undefined ? String(curCase.actualOutput) : (curCase?.output !== undefined ? String(curCase.output) : '');
                        const expectedVal = curCase?.expectedOutput !== undefined ? String(curCase.expectedOutput) : (curCase?.expected !== undefined ? String(curCase.expected) : '');

                        return (
                          <div className="space-y-3 pt-1">
                            {errText && (
                              <div className="p-3.5 rounded-lg bg-[#2c1d20] border border-[#ef4743]/40 text-[#ff6b6b] font-mono text-xs select-text">
                                <pre className="whitespace-pre-wrap font-semibold leading-relaxed">
                                  {errText}
                                </pre>
                              </div>
                            )}

                            {inputVal !== '' && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold text-slate-400">Input</div>
                                <div className="bg-[#282828] p-3 rounded-lg border border-[#383838] text-white text-xs font-mono select-text whitespace-pre-wrap">
                                  {formatLeetCodeInput(inputVal)}
                                </div>
                              </div>
                            )}

                            {stdoutVal !== '' && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold text-slate-400">Stdout</div>
                                <div className="bg-[#282828] p-3 rounded-lg border border-[#383838] text-[#00b8a3] text-xs font-mono select-text whitespace-pre-wrap font-semibold">
                                  {stdoutVal}
                                </div>
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="text-[11px] font-bold text-slate-400">Output</div>
                              <div className={`p-3 rounded-lg border border-[#383838] bg-[#282828] text-xs font-mono select-text whitespace-pre-wrap font-semibold ${
                                curCase?.passed ? 'text-white' : 'text-[#ef4743]'
                              }`}>
                                {actualVal !== '' ? actualVal : (stdoutVal !== '' ? '""' : '(No output returned or printed)')}
                              </div>
                            </div>

                            {expectedVal !== '' && (
                              <div className="space-y-1">
                                <div className="text-[11px] font-bold text-slate-400">Expected</div>
                                <div className="bg-[#282828] p-3 rounded-lg border border-[#383838] text-white text-xs font-mono select-text whitespace-pre-wrap font-semibold">
                                  {expectedVal}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Proctoring Anti-Cheat Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#282828] border border-rose-500/40 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl text-center text-white font-sans">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold font-mono">Anti-Cheat Alert (Demo Simulation)</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {warningMessage}
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg"
            >
              Acknowledge & Resume Demo
            </button>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE DEMO RESULTS SUMMARY MODAL */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#282828] border border-[#3e3e3e] rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl text-slate-100 font-sans my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#3e3e3e] pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-[#FFA116]/20 text-[#FFA116] border border-[#FFA116]/40">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-white font-['Playfair_Display',serif]">
                    Demo Assessment Results
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Student: <span className="text-white font-bold">{studentName}</span> | Paper: <span className="text-slate-200">{paperData?.title}</span>
                  </p>
                </div>
              </div>

              <div className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase font-mono">
                Demo Completed
              </div>
            </div>

            {/* Scorecard Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#383838] space-y-1">
                <div className="text-xs text-slate-400 uppercase font-bold">Overall Score</div>
                <div className="text-3xl font-black text-[#FFA116]">{overallScorePercentage}%</div>
                <div className="text-[11px] text-slate-400">Passed {passedQuestionsCount} of {totalQuestions} Problems</div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#383838] space-y-1">
                <div className="text-xs text-slate-400 uppercase font-bold">Testcase Pass Rate</div>
                <div className="text-3xl font-black text-[#00b8a3]">
                  {totalTestcasesPassed} / {totalTestcasesCount}
                </div>
                <div className="text-[11px] text-slate-400 font-sans">Individual Testcases Evaluated</div>
              </div>

              <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#383838] space-y-1">
                <div className="text-xs text-slate-400 uppercase font-bold">Proctoring Record</div>
                <div className={`text-3xl font-black ${tabSwitchCount === 0 ? 'text-[#00b8a3]' : 'text-amber-400'}`}>
                  {tabSwitchCount} Alerts
                </div>
                <div className="text-[11px] text-slate-400 font-sans">Tab Switches & Focus Loss</div>
              </div>
            </div>

            {/* Problem-wise Code & Testcases Detailed Submissions Breakdown */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2 border-b border-[#3e3e3e] pb-2 font-mono">
                <Code2 className="w-4 h-4 text-[#FFA116]" />
                <span>Problem-wise Code Submissions & Testcase Results:</span>
              </h3>

              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 font-mono">
                {questionsList.map((q, qIdx) => {
                  const qIdStr = String(q._id);
                  const subResult = submissionResultsMap[qIdStr];
                  const codeWritten = codeMap[qIdStr] || q.boilerplate?.python || 'No code written';
                  const isAccepted = subResult?.verdict === 'Accepted';

                  return (
                    <div key={qIdx} className="p-4 rounded-xl bg-[#1a1a1a] border border-[#383838] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#383838] pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-sm">{q.title}</span>
                          <span className="text-xs text-slate-400">({q.difficulty})</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                          isAccepted
                            ? 'bg-emerald-500/20 text-[#00b8a3] border border-emerald-500/30'
                            : subResult
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                        }`}>
                          {subResult ? subResult.verdict : 'Not Submitted'}
                        </span>
                      </div>

                      {/* Submitted Code Block */}
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-slate-400">Submitted Code ({subResult?.language || selectedLanguage}):</div>
                        <pre className="p-3 bg-[#282828] rounded-lg border border-[#383838] text-xs text-slate-200 whitespace-pre-wrap select-text max-h-36 overflow-y-auto">
                          {codeWritten}
                        </pre>
                      </div>

                      {/* Evaluated Testcases List */}
                      {subResult?.testResults && (
                        <div className="space-y-1.5 pt-1">
                          <div className="text-[11px] font-bold text-slate-400">Testcases Evaluated ({subResult.testResults.filter(t => t.passed).length} / {subResult.testResults.length} Passed):</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {subResult.testResults.map((tr, tIdx) => (
                              <div key={tIdx} className={`p-2 rounded border flex items-center justify-between ${
                                tr.passed ? 'bg-emerald-950/30 border-emerald-800/40 text-[#00b8a3]' : 'bg-rose-950/30 border-rose-800/40 text-rose-300'
                              }`}>
                                <span>Testcase #{tIdx + 1} ({tr.runtimeMs || 0}ms)</span>
                                <span className="font-bold">{tr.passed ? 'PASSED ✓' : 'FAILED ✕'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#3e3e3e] pt-4 font-mono">
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  setSubmissionResultsMap({});
                  setSubmittedQuestionIds([]);
                  setTimeRemaining((paperData?.timeLimitMinutes || 30) * 60);
                  setActiveQuestionIndex(0);
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-[#333333] hover:bg-[#3e3e3e] text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-2 border border-[#444444] transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake Demo Exam</span>
              </button>

              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={() => navigate('/student/join')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#00b8a3] hover:bg-[#009e8c] text-white rounded-lg font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#00b8a3]/20"
                >
                  <span>Join Live Exam Portal</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
