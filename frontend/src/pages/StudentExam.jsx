import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { GradFlow } from 'gradflow';
import CodeEditor from '../components/CodeEditor';
import { Clock, ShieldAlert, Play, Send, CheckCircle2, XCircle, AlertTriangle, Maximize2, RotateCcw, FileText, Code2, Terminal, ChevronRight, Check, RefreshCw, Lock, Minimize2, GripVertical, GripHorizontal, LogOut } from 'lucide-react';

export default function StudentExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [examData, setExamData] = useState(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('python');
  const [codeMap, setCodeMap] = useState({}); // questionId -> code
  const [submittedQuestionIds, setSubmittedQuestionIds] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [rawOutput, setRawOutput] = useState('');
  const [verdict, setVerdict] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeBottomConsole, setActiveBottomConsole] = useState('testcase');

  // Proctoring & Warnings
  const [warningCount, setWarningCount] = useState(0);
  const [warningLimit, setWarningLimit] = useState(3);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const [kicked, setKicked] = useState(false);

  // Resizable Panels State
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // % width (min 25%, max 75%)
  const [editorPanelHeight, setEditorPanelHeight] = useState(60); // % height (min 20%, max 80%)
  const [isDraggingVertical, setIsDraggingVertical] = useState(false);
  const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);

  const containerRef = useRef(null);
  const rightPanelRef = useRef(null);
  const socketRef = useRef(null);
  const timerRef = useRef(null);

  const [saveStatus, setSaveStatus] = useState('Saved');

  const [sessionError, setSessionError] = useState(null);

  // Fetch initial exam session data
  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setSessionError(null);
      const res = await axios.get(`/api/student/session/${sessionId}`);
      const data = res.data;
      setExamData(data);
      setTimeRemaining(data.timeRemainingSeconds);
      setWarningCount(data.warningCount || 0);
      setWarningLimit(data.warningLimit || 3);
      setTabSwitchLimit(data.tabSwitchLimit || 3);
      setSubmittedQuestionIds(data.submittedQuestionIds || []);

      if (
        data.status === 'auto-submitted' ||
        data.status === 'submitted' ||
        data.roomStatus === 'ended' ||
        (data.timeRemainingSeconds !== undefined && data.timeRemainingSeconds <= 0)
      ) {
        setAutoSubmitted(true);
      }
      if (data.status === 'kicked') setKicked(true);

      // Initialize boilerplate code or existing currentCode
      const initialCodes = { ...data.currentCode };
      (data.questions || []).forEach((q) => {
        if (q && q._id && !initialCodes[q._id]) {
          initialCodes[q._id] = q.boilerplate?.python || 'class Solution:\n    def solution(self, input_val):\n        return input_val\n';
        }
      });
      setCodeMap(initialCodes);
    } catch (err) {
      console.error('Error fetching exam session:', err);
      setSessionError(err.response?.data?.message || err.message || 'Failed to connect to exam session server');
    }
  };

  // Auto-switch selectedLanguage if current choice is not in paper allowedLanguages
  useEffect(() => {
    if (!examData) return;
    const allowed = Array.isArray(examData.allowedLanguages) && examData.allowedLanguages.length > 0
      ? examData.allowedLanguages
      : ['python', 'cpp', 'c', 'java', 'javascript'];

    if (allowed.length > 0 && !allowed.includes(selectedLanguage)) {
      setSelectedLanguage(allowed[0]);
    }
  }, [examData]);

  // Setup Socket.IO & Heartbeat
  useEffect(() => {
    const socket = io(window.location.origin);
    socketRef.current = socket;

    socket.on('connect', () => {
      const token = localStorage.getItem(`resume_token_${sessionId}`);
      socket.emit('student_join_exam', { sessionId, resumeToken: token });
    });

    socket.on('exam_session_restored', ({ status, warningCount: restoredWarn, tabSwitchCount: restoredTab, warningLimit: restoredWarnLimit, tabSwitchLimit: restoredTabLimit }) => {
      if (restoredWarn !== undefined) setWarningCount(restoredWarn);
      if (restoredTab !== undefined) setTabSwitchCount(restoredTab);
      if (restoredWarnLimit !== undefined) setWarningLimit(restoredWarnLimit);
      if (restoredTabLimit !== undefined) setTabSwitchLimit(restoredTabLimit);
      if (status === 'kicked') setKicked(true);
      if (status === 'submitted' || status === 'auto-submitted') setAutoSubmitted(true);
    });

    socket.on('warning_updated', ({ warningCount: newCount, tabSwitchCount: newTabCount, warningLimit: newLimit, tabSwitchLimit: newTabLimit, isKicked, eventType }) => {
      if (newCount !== undefined) setWarningCount(newCount);
      if (newTabCount !== undefined) setTabSwitchCount(newTabCount);
      if (newLimit !== undefined) setWarningLimit(newLimit);
      if (newTabLimit !== undefined) setTabSwitchLimit(newTabLimit);

      if (isKicked) {
        setKicked(true);
      } else {
        setWarningMessage(`Anti-Cheat Warning (${eventType}): Warning ${newCount || 0} of ${newLimit || 3}. Tab Switches: ${newTabCount || 0} of ${newTabLimit || 3}. Exceeding either limit will kick you off the exam.`);
        setShowWarningModal(true);
      }
    });

    socket.on('submission_result', (data) => {
      setRunning(false);
      setSubmitting(false);
      setVerdict(data.verdict);
      setRawOutput(data.rawOutput || '');
      setTestResults(data.testResults);
      setActiveBottomConsole('result');

      // Celebration Blast on Accepted!
      if (data.verdict === 'Accepted') {
        confetti({
          particleCount: 160,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00b8a3', '#FFA116', '#3b82f6', '#ec4899', '#10b981', '#f59e0b']
        });
      }
    });

    socket.on('session_ended_all', ({ message }) => {
      alert(message || 'Faculty has ended the exam session for all students.');
      setAutoSubmitted(true);
    });

    socket.on('session_ended_individual', ({ message }) => {
      alert(message || 'Faculty has ended your exam session.');
      setAutoSubmitted(true);
    });

    socket.on('kicked_by_admin', () => {
      setKicked(true);
    });

    // Heartbeat every 15s
    const heartbeatInterval = setInterval(() => {
      socket.emit('student_heartbeat', { sessionId });
    }, 15000);

    return () => {
      clearInterval(heartbeatInterval);
      socket.disconnect();
    };
  }, [sessionId]);

  // Server-authoritative timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeRemaining]);

  // Centralized Anti-cheat Warning Reporter (Socket + REST Dual Delivery)
  const triggerAntiCheatWarning = async (eventType) => {
    if (autoSubmitted || kicked) return;

    // 1. Socket Delivery
    if (socketRef.current) {
      socketRef.current.emit('anti_cheat_warning', {
        sessionId,
        eventType,
        timestamp: new Date()
      });
    }

    // 2. Guaranteed REST API Fallback
    try {
      const res = await axios.post('/api/student/warning', { sessionId, eventType });
      const data = res.data;
      if (data.warningCount !== undefined) setWarningCount(data.warningCount);
      if (data.tabSwitchCount !== undefined) setTabSwitchCount(data.tabSwitchCount);
      if (data.warningLimit !== undefined) setWarningLimit(data.warningLimit);
      if (data.tabSwitchLimit !== undefined) setTabSwitchLimit(data.tabSwitchLimit);

      if (data.isKicked || data.status === 'kicked') {
        setKicked(true);
      } else if (eventType) {
        setWarningMessage(`Anti-Cheat Warning (${eventType}): Warning ${data.warningCount || 0} of ${data.warningLimit || 3}. Tab Switches: ${data.tabSwitchCount || 0} of ${data.tabSwitchLimit || 3}. Exceeding either limit will terminate your exam.`);
        setShowWarningModal(true);
      }
    } catch (err) {
      console.error('Error reporting anti-cheat warning:', err);
    }
  };

  // Anti-cheat event listeners & Fullscreen Monitor
  useEffect(() => {
    let lastBlurTime = 0;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const now = Date.now();
        if (now - lastBlurTime > 500) {
          lastBlurTime = now;
          triggerAntiCheatWarning('Tab Switch / Visibility Loss');
        }
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (now - lastBlurTime > 500) {
        lastBlurTime = now;
        triggerAntiCheatWarning('Window Focus Lost');
      }
    };

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);
      if (!isFull) {
        triggerAntiCheatWarning('Fullscreen Exit Violation');
      }
    };

    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'u', 's'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key))
      ) {
        e.preventDefault();
        triggerAntiCheatWarning(`Blocked Shortcut (${e.key})`);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sessionId]);

  // Mouse drag listeners for resizable panels
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingVertical && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const newWidthPercent = (offsetX / rect.width) * 100;
        setLeftPanelWidth(Math.min(Math.max(newWidthPercent, 25), 75));
      }

      if (isDraggingHorizontal && rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const newHeightPercent = (offsetY / rect.height) * 100;
        setEditorPanelHeight(Math.min(Math.max(newHeightPercent, 20), 80));
      }
    };

    const handleMouseUp = () => {
      if (isDraggingVertical) setIsDraggingVertical(false);
      if (isDraggingHorizontal) setIsDraggingHorizontal(false);
    };

    if (isDraggingVertical || isDraggingHorizontal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVertical, isDraggingHorizontal]);

  // Drag handlers
  const handleVerticalMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingVertical(true);
  };

  const handleHorizontalMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingHorizontal(true);
  };

  // Request Fullscreen
  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    }
  };

  // Autosave code on edit
  const handleCodeChange = (newCode) => {
    const currentQ = examData?.questions[activeQuestionIndex];
    if (!currentQ) return;

    setCodeMap((prev) => ({ ...prev, [currentQ._id]: newCode }));
    setSaveStatus('Saving...');

    clearTimeout(window.autosaveTimer);
    window.autosaveTimer = setTimeout(async () => {
      try {
        await axios.post('/api/student/autosave', {
          sessionId,
          questionId: currentQ._id,
          code: newCode
        });
        setSaveStatus('Saved');
      } catch (err) {
        setSaveStatus('Error saving');
      }
    }, 1200);
  };

  // Handle Question Navigation with Sequential Lock Check
  const handleQuestionTabClick = (idx) => {
    if (examData?.sequentialLock && idx > activeQuestionIndex) {
      const currentQId = String(examData.questions[activeQuestionIndex]._id);
      const isSubmitted = submittedQuestionIds.includes(currentQId);

      if (!isSubmitted) {
        alert(`Sequential Lock Enforced: You must submit Question ${activeQuestionIndex + 1} before proceeding to Question ${idx + 1}!`);
        return;
      }
    }
    setActiveQuestionIndex(idx);
    setVerdict(null);
    setRawOutput('');
    setTestResults(null);
    setActiveBottomConsole('testcase');
  };

  // Reset Code
  const handleResetCode = () => {
    const currentQ = examData?.questions[activeQuestionIndex];
    if (!currentQ) return;
    const defaultCode = currentQ.boilerplate?.[selectedLanguage] || '';
    setCodeMap((prev) => ({ ...prev, [currentQ._id]: defaultCode }));
  };

  // Run sample cases
  const handleRun = async () => {
    const currentQ = examData?.questions[activeQuestionIndex];
    if (!currentQ) return;

    setRunning(true);
    setVerdict('Running...');
    setRawOutput('');
    setTestResults(null);
    setActiveBottomConsole('result');

    try {
      const res = await axios.post('/api/student/run', {
        sessionId,
        questionId: currentQ._id,
        language: selectedLanguage,
        code: codeMap[currentQ._id],
        socketId: socketRef.current?.id
      });

      if (res.data.verdict) {
        setRunning(false);
        setVerdict(res.data.verdict);
        setRawOutput(res.data.rawOutput || '');
        setTestResults(res.data.testResults || []);

        if (res.data.verdict === 'Accepted') {
          confetti({
            particleCount: 160,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#00b8a3', '#FFA116', '#3b82f6', '#ec4899', '#10b981', '#f59e0b']
          });
        }
      }
    } catch (err) {
      setRunning(false);
      setVerdict('Runtime Error');
      setRawOutput(err.response?.data?.message || err.message || 'Execution failed');
    }
  };

  // Submit answer
  const handleSubmit = async () => {
    const currentQ = examData?.questions[activeQuestionIndex];
    if (!currentQ) return;

    setSubmitting(true);
    setVerdict('Submitting...');
    setRawOutput('');
    setTestResults(null);
    setActiveBottomConsole('result');

    try {
      const res = await axios.post('/api/student/submit', {
        sessionId,
        questionId: currentQ._id,
        language: selectedLanguage,
        code: codeMap[currentQ._id],
        socketId: socketRef.current?.id
      });

      const qIdStr = String(currentQ._id);
      if (!submittedQuestionIds.includes(qIdStr)) {
        setSubmittedQuestionIds((prev) => [...prev, qIdStr]);
      }

      if (res.data.verdict) {
        setSubmitting(false);
        setVerdict(res.data.verdict);
        setRawOutput(res.data.rawOutput || '');
        setTestResults(res.data.testResults || []);

        if (res.data.verdict === 'Accepted') {
          confetti({
            particleCount: 160,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#00b8a3', '#FFA116', '#3b82f6', '#ec4899', '#10b981', '#f59e0b']
          });
        }
      }
    } catch (err) {
      setSubmitting(false);
      setVerdict('Runtime Error');
      setRawOutput(err.response?.data?.message || err.message || 'Submission failed');
    }
  };

  const handleFinishAssessment = async () => {
    if (!confirm("Are you sure you want to finish and submit your entire exam paper? Once submitted, you cannot edit your solutions.")) return;
    try {
      await axios.post('/api/student/auto-submit', { sessionId });
    } catch (err) {}
    setAutoSubmitted(true);
  };

  const handleAutoSubmit = async () => {
    try {
      await axios.post('/api/student/auto-submit', { sessionId });
    } catch (err) {}
    setAutoSubmitted(true);
  };

  if (kicked) {
    return (
      <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] flex items-center justify-center p-4 relative overflow-hidden select-none">
        
        {/* Fiery Red/Crimson GradFlow Radiant Flash Flow Background */}
        <GradFlow
          config={{
            color1: { r: 255, g: 0, b: 50 },
            color2: { r: 180, g: 0, b: 0 },
            color3: { r: 20, g: 0, b: 5 },
            speed: 1.2,
            scale: 2.2,
            type: 'animated',
            noise: 0.6
          }}
          className="fixed inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Ambient Red Radiant Pulse Shading */}
        <div className="fixed inset-0 bg-gradient-to-t from-rose-950/80 via-transparent to-rose-950/60 pointer-events-none z-0 animate-pulse" />

        <div className="relative z-10 max-w-md w-full rounded-xl p-8 bg-black/55 backdrop-blur-2xl border border-rose-500/60 shadow-[0_25px_60px_rgba(225,29,72,0.45)] text-center space-y-6">
          <div className="p-4 rounded-xl bg-rose-600/20 border border-rose-500/40 text-rose-400 inline-flex shadow-2xl animate-bounce">
            <ShieldAlert className="w-12 h-12 text-rose-500" />
          </div>

          <div className="space-y-2">
            <h2 className="font-['Playfair_Display',serif] text-3xl font-extrabold text-white tracking-wider drop-shadow-xl">
              Session Terminated
            </h2>
            <p className="text-sm text-rose-200/90 font-medium leading-relaxed">
              You have been automatically removed from this assessment due to exceeding anti-cheat warning limits.
            </p>
          </div>

          <button
            onClick={() => navigate('/join')}
            className="w-full py-4 px-6 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-sm tracking-wider uppercase rounded-lg shadow-2xl shadow-rose-900/80 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
          >
            <LogOut className="w-5 h-5" />
            <span>EXIT ASSESSMENT</span>
          </button>
        </div>
      </div>
    );
  }

  if (autoSubmitted) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
        <div className="bg-[#282828] p-8 rounded-2xl text-center max-w-md border border-emerald-500/30 shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-[#00b8a3] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Exam Paper Submitted</h2>
          <p className="text-sm text-slate-400 mt-2">
            Your answers have been stored and submitted successfully. You may close this browser tab.
          </p>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center p-4">
        <div className="bg-[#222222] p-8 rounded-xl max-w-md w-full border border-rose-500/40 text-center space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold font-serif">Exam Session Connection Error</h2>
          <p className="text-xs text-slate-300 font-mono leading-relaxed">{sessionError}</p>
          <div className="flex space-x-3 pt-2">
            <button
              onClick={() => navigate('/join')}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-mono font-bold text-xs rounded-lg uppercase"
            >
              Exit to Join Page
            </button>
            <button
              onClick={fetchSessionData}
              className="flex-1 py-2.5 bg-[#00b8a3] hover:bg-[#00a390] text-black font-mono font-bold text-xs rounded-lg uppercase"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!examData) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center space-y-4 text-[#00b8a3] font-mono text-sm">
        <RefreshCw className="w-8 h-8 animate-spin text-[#00b8a3]" />
        <span className="font-bold text-white tracking-wider">Loading LeetCode Assessment Interface...</span>
      </div>
    );
  }

  const questionsList = Array.isArray(examData.questions) ? examData.questions : [];
  const allowedLanguages = Array.isArray(examData.allowedLanguages) && examData.allowedLanguages.length > 0
    ? examData.allowedLanguages
    : ['python', 'cpp', 'c', 'java', 'javascript'];

  const currentQuestion = questionsList[activeQuestionIndex] || {
    _id: 'default_q',
    title: 'Coding Question',
    descriptionHtml: '<p>Loading problem description...</p>',
    sampleTestcases: [],
    boilerplate: {}
  };
  const formatDescriptionHtml = (rawStr) => {
    if (!rawStr) return '';
    let clean = String(rawStr).replace(/\\n/g, '\n');
    if (!/<[a-z][\s\S]*>/i.test(clean)) {
      clean = clean.replace(/\n/g, '<br/>');
    }
    return clean;
  };

  const formatOutputStr = (str) => {
    if (str === null || str === undefined) return '';
    const s = typeof str === 'object' ? JSON.stringify(str, null, 2) : String(str);
    return s.replace(/\\n/g, '\n');
  };

  const extractHarnessTestcases = (question, lang) => {
    if (!question) return [];
    const harness = question.harnessCode?.[lang] || question.harnessCode?.python || '';
    if (harness) {
      const match = harness.match(/(?:test_cases|testcases|sampleTestcases)\s*=\s*(\[[\s\S]*?\])\s*(?:;|\n|$)/i);
      if (match && match[1]) {
        try {
          let jsonStr = match[1].replace(/'/g, '"');
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch (e) {}
      }
    }
    if (question.sampleTestcases && question.sampleTestcases.length > 0) {
      return question.sampleTestcases;
    }
    return [];
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-[#1a1a1a] text-[#eff1f6] flex flex-col overflow-hidden font-sans select-none relative">
      
      {/* Top Navbar Header */}
      <header className="h-12 border-b border-[#333333] bg-[#282828] px-4 flex items-center justify-between flex-shrink-0 z-10">
        
        {/* Left Brand & Question Selector Pills */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFA116] flex items-center justify-center text-black font-extrabold text-sm">
              L
            </div>
            <span className="font-bold text-white text-sm hidden sm:inline">{examData.paperTitle}</span>
          </div>

          <div className="h-4 w-[1px] bg-[#3e3e3e]" />

          {/* Question Selector Buttons */}
          <div className="flex space-x-1.5 overflow-x-auto">
            {questionsList.map((q, idx) => {
              const isSubmitted = submittedQuestionIds.includes(String(q._id));
              const isLocked = examData.sequentialLock && idx > activeQuestionIndex && !submittedQuestionIds.includes(String(questionsList[idx - 1]?._id));

              return (
                <button
                  key={q._id}
                  onClick={() => handleQuestionTabClick(idx)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 transition-all ${
                    activeQuestionIndex === idx
                      ? 'bg-[#3e3e3e] text-white shadow-sm border border-[#555555]'
                      : 'text-[#909090] hover:text-slate-200 hover:bg-[#333333]'
                  }`}
                >
                  <span>Problem {idx + 1}</span>
                  {isSubmitted && <Check className="w-3 h-3 text-[#00b8a3]" />}
                  {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Info & Action Controls */}
        <div className="flex items-center space-x-3">
          {examData.sequentialLock && (
            <span className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Sequential Lock
            </span>
          )}

          {/* Finish & End Assessment Button */}
          {submittedQuestionIds.length === examData.questions.length ? (
            <button
              onClick={handleFinishAssessment}
              className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all animate-pulse"
              title="All problems submitted! Click to finish and end assessment."
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finish & End Assessment ✓</span>
            </button>
          ) : (
            <button
              onClick={handleFinishAssessment}
              className="px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs transition-all"
              title="Submit paper and finish exam early"
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

          {/* Autosave Indicator */}
          <div className="text-xs text-[#8a8a8a] font-mono hidden md:block">
            {saveStatus}
          </div>

          {/* Timer Countdown */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#333333] border border-[#444444] text-[#FFA116] font-mono font-bold text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={requestFullscreen}
            className="p-1.5 text-[#8a8a8a] hover:text-white rounded-md bg-[#333333] hover:bg-[#3e3e3e] transition-colors"
            title="Toggle Fullscreen Mode"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Split-Panel Content with Draggable Dividers */}
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
              <FileText className="w-3.5 h-3.5 text-[#00b8a3]" />
              <span>Description</span>
            </button>

            <button
              onClick={() => setActiveLeftTab('hints')}
              className={`px-3 py-2 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-all ${
                activeLeftTab === 'hints'
                  ? 'border-[#FFA116] text-white bg-[#333333]/50 rounded-t-md'
                  : 'border-transparent text-[#8a8a8a] hover:text-slate-300'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span>Editorial / Hints</span>
            </button>
          </div>

          {/* Left Panel Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 text-[#eff1f6]">
            {activeLeftTab === 'description' && (
              <>
                <div>
                  <h1 className="text-xl font-bold text-white mb-2">
                    {activeQuestionIndex + 1}. {currentQuestion.title}
                  </h1>

                  <div className="flex items-center space-x-3 mb-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      currentQuestion.difficulty === 'Easy' ? 'bg-[#00b8a3]/20 text-[#00b8a3]' :
                      currentQuestion.difficulty === 'Medium' ? 'bg-[#FFC01E]/20 text-[#FFC01E]' : 'bg-[#FF375F]/20 text-[#FF375F]'
                    }`}>
                      {currentQuestion.difficulty}
                    </span>
                    <span className="text-xs text-[#8a8a8a] font-mono">Time Limit: {currentQuestion.timeLimitMs || 2000}ms</span>
                  </div>

                  {/* Problem Description HTML */}
                  <div
                    className="prose prose-invert max-w-none text-sm text-[#cccccc] leading-relaxed font-sans whitespace-pre-wrap select-text"
                    dangerouslySetInnerHTML={{ __html: formatDescriptionHtml(currentQuestion.descriptionHtml) }}
                  />
                </div>

                {/* Sample Testcases Display */}
                {currentQuestion.sampleTestcases?.length > 0 && (
                  <div className="space-y-4 pt-2 border-t border-[#3e3e3e]">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#909090]">
                      Examples
                    </h3>
                    {currentQuestion.sampleTestcases.map((tc, idx) => (
                      <div key={idx} className="p-3.5 rounded-md bg-[#1e1e1e] border border-[#3e3e3e] font-mono text-xs space-y-2">
                        <div className="text-[#8a8a8a] font-sans text-[11px] font-bold">Example {idx + 1}:</div>
                        <div>
                          <span className="text-[#909090] font-bold">Input:</span>
                          <pre className="font-mono text-xs whitespace-pre-wrap bg-[#141414] p-2 rounded border border-[#333333] text-white mt-1 select-text">
                            {formatOutputStr(tc.input)}
                          </pre>
                        </div>
                        <div>
                          <span className="text-[#909090] font-bold">Output:</span>
                          <pre className="font-mono text-xs whitespace-pre-wrap bg-[#141414] p-2 rounded border border-[#333333] text-[#00b8a3] font-bold mt-1 select-text">
                            {formatOutputStr(tc.expectedOutput)}
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeLeftTab === 'hints' && (
              <div className="space-y-4 text-sm text-[#cccccc]">
                <h3 className="text-sm font-bold text-white">Problem Hints & Guidelines</h3>
                {currentQuestion.hints?.length > 0 ? (
                  currentQuestion.hints.map((h, i) => (
                    <div key={i} className="p-3 bg-[#1e1e1e] border border-[#3e3e3e] rounded-md text-xs">
                      <strong>Hint {i + 1}:</strong> {h}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#8a8a8a]">No additional hints provided for this question. Optimize time and space complexity.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Vertical Resizable Divider Handle */}
        <div
          onMouseDown={handleVerticalMouseDown}
          className={`w-2.5 hover:w-2.5 bg-[#1a1a1a] hover:bg-[#00b8a3] cursor-col-resize flex items-center justify-center transition-colors select-none group z-20 flex-shrink-0 ${
            isDraggingVertical ? 'bg-[#00b8a3]' : ''
          }`}
          title="Drag horizontally to resize problem description and code editor panels"
        >
          <GripVertical className="w-3 h-3 text-slate-500 group-hover:text-black opacity-60 group-hover:opacity-100" />
        </div>

        {/* Right Panel: Code Mirror Editor & Console Runner */}
        <div
          ref={rightPanelRef}
          style={{ width: `${100 - leftPanelWidth}%` }}
          className="bg-[#282828] rounded-lg border border-[#333333] flex flex-col overflow-hidden min-w-[25%] max-w-[75%]"
        >
          {/* Top Section: Code Editor Canvas */}
          <div
            style={{ height: `${editorPanelHeight}%` }}
            className="flex flex-col overflow-hidden min-h-[20%] max-h-[80%]"
          >
            {/* Code Editor Header Controls */}
            <div className="h-10 border-b border-[#3e3e3e] bg-[#282828] px-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-[#00b8a3]" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    const lang = e.target.value;
                    setSelectedLanguage(lang);
                    if (currentQuestion.boilerplate?.[lang]) {
                      setCodeMap(prev => ({ ...prev, [currentQuestion._id]: currentQuestion.boilerplate[lang] }));
                    }
                  }}
                  className="bg-[#1e1e1e] border border-[#3e3e3e] text-xs text-white rounded px-2.5 py-1 focus:outline-none focus:border-[#FFA116]"
                >
                  {allowedLanguages.includes('python') && <option value="python">Python 3</option>}
                  {allowedLanguages.includes('cpp') && <option value="cpp">C++</option>}
                  {allowedLanguages.includes('c') && <option value="c">C</option>}
                  {allowedLanguages.includes('java') && <option value="java">Java</option>}
                  {allowedLanguages.includes('javascript') && <option value="javascript">JavaScript (Node.js)</option>}
                </select>
              </div>

              <button
                onClick={handleResetCode}
                className="p-1.5 text-[#8a8a8a] hover:text-white rounded hover:bg-[#3e3e3e] transition-colors"
                title="Reset code to default boilerplate"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CodeMirror Editor Area */}
            <div className="flex-1 overflow-hidden bg-[#1e1e1e]">
              <CodeEditor
                value={codeMap[currentQuestion._id] || ''}
                onChange={handleCodeChange}
                language={selectedLanguage}
              />
            </div>
          </div>

          {/* Horizontal Resizable Divider Handle */}
          <div
            onMouseDown={handleHorizontalMouseDown}
            className={`h-2.5 hover:h-2.5 bg-[#282828] hover:bg-[#00b8a3] cursor-row-resize flex items-center justify-center transition-colors select-none group z-20 flex-shrink-0 border-y border-[#333333] ${
              isDraggingHorizontal ? 'bg-[#00b8a3]' : ''
            }`}
            title="Drag vertically to resize code editor and testcase console heights"
          >
            <GripHorizontal className="w-3 h-3 text-slate-500 group-hover:text-black opacity-60 group-hover:opacity-100" />
          </div>

          {/* Bottom Section: Testcase Console & Execution Runner */}
          <div
            style={{ height: `${100 - editorPanelHeight}%` }}
            className="bg-[#282828] flex flex-col overflow-hidden min-h-[20%] max-h-[80%]"
          >
            {/* Console Header Tabs */}
            <div className="flex items-center justify-between px-3 pt-2 bg-[#282828] border-b border-[#333333] flex-shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveBottomConsole('testcase')}
                  className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-all ${
                    activeBottomConsole === 'testcase'
                      ? 'bg-[#1e1e1e] text-white border-t border-x border-[#3e3e3e]'
                      : 'text-[#8a8a8a] hover:text-slate-300'
                  }`}
                >
                  Testcase
                </button>
                <button
                  onClick={() => setActiveBottomConsole('result')}
                  className={`px-3 py-1 text-xs font-semibold rounded-t-md transition-all ${
                    activeBottomConsole === 'result'
                      ? 'bg-[#1e1e1e] text-white border-t border-x border-[#3e3e3e]'
                      : 'text-[#8a8a8a] hover:text-slate-300'
                  }`}
                >
                  Test Result {verdict && `(${verdict})`}
                </button>
              </div>

              {/* Action Buttons: Run & Submit */}
              <div className="flex items-center space-x-2 pb-1.5">
                <button
                  onClick={handleRun}
                  disabled={running || submitting}
                  className="px-4 py-1.5 rounded bg-[#3e3e3e] hover:bg-[#4a4a4a] text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-[#00b8a3] fill-[#00b8a3]" />
                  <span>{running ? 'Running...' : 'Run Code'}</span>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={running || submitting}
                  className="px-5 py-1.5 rounded bg-[#00b8a3] hover:bg-[#00a390] text-black font-extrabold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Submit'}</span>
                </button>
              </div>
            </div>

            {/* Console Content Box */}
            <div className="flex-1 p-3 overflow-y-auto bg-[#1e1e1e] font-mono text-xs">
              {activeBottomConsole === 'testcase' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] border-b border-[#282828] pb-1">
                    <span>Harness Testcase Suite ({extractHarnessTestcases(currentQuestion, selectedLanguage).length || currentQuestion.sampleTestcases?.length || 0}):</span>
                    <span className="text-[10px] text-[#00b8a3] font-mono font-bold">Executable Testcases</span>
                  </div>

                  {(extractHarnessTestcases(currentQuestion, selectedLanguage).length > 0
                    ? extractHarnessTestcases(currentQuestion, selectedLanguage)
                    : currentQuestion.sampleTestcases
                  )?.map((tc, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#282828] border border-[#3e3e3e] space-y-2">
                      <div className="text-[#00b8a3] text-[11px] font-bold">Testcase {idx + 1}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] font-bold">Input:</div>
                          <pre className="font-mono text-xs whitespace-pre-wrap bg-[#141414] p-2 rounded border border-[#333333] text-white mt-1 select-text">
                            {formatOutputStr(tc.input)}
                          </pre>
                        </div>
                        {tc.expectedOutput && (
                          <div>
                            <div className="text-[#8a8a8a] text-[10px] font-bold">Expected Output:</div>
                            <pre className="font-mono text-xs whitespace-pre-wrap bg-[#141414] p-2 rounded border border-[#333333] text-[#00b8a3] font-bold mt-1 select-text">
                              {formatOutputStr(tc.expectedOutput)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeBottomConsole === 'result' && (
                <div>
                  {(running || submitting) ? (
                    <div className="p-4 rounded-lg bg-[#282828] border border-[#00b8a3]/40 text-center space-y-2 font-mono">
                      <div className="flex items-center justify-center space-x-2 text-[#00b8a3]">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span className="font-bold text-sm">Your code is queued for execution...</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Evaluating code against testcase suite on execution worker pool. Please wait a moment.
                      </p>
                    </div>
                  ) : !verdict ? (
                    <div className="text-[#8a8a8a] text-xs pt-4 text-center">
                      Click <strong>Run Code</strong> or <strong>Submit</strong> to evaluate your solution against testcases.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-extrabold ${
                          verdict === 'Accepted' ? 'text-[#00b8a3]' : 'text-[#FF375F]'
                        }`}>
                          {verdict}
                        </span>
                      </div>

                      {/* Raw Console Text Output Box */}
                      {rawOutput && (
                        <div className="p-3 rounded-md bg-[#141414] border border-[#333333] text-xs text-[#00b8a3] leading-relaxed whitespace-pre-wrap font-mono select-text">
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-bold mb-1 border-b border-[#282828] pb-1">Raw Execution Output:</div>
                          {rawOutput}
                        </div>
                      )}

                      {/* Parsed Testcase Cards */}
                      {testResults?.map((tr, idx) => {
                        const indexNum = idx + 1;
                        const passed = Boolean(tr.passed);
                        const runtimeVal = tr.runtimeMs !== undefined ? tr.runtimeMs : (tr.runtime !== undefined ? tr.runtime : 0);
                        const inputVal = tr.input !== undefined ? (typeof tr.input === 'object' ? JSON.stringify(tr.input) : String(tr.input)) : '';
                        const expectedVal = tr.expected !== undefined ? String(tr.expected) : (tr.expectedOutput !== undefined ? String(tr.expectedOutput) : '');
                        const actualVal = tr.output !== undefined ? String(tr.output) : (tr.actualOutput !== undefined ? String(tr.actualOutput) : '');

                        return (
                          <div key={idx} className={`p-3 rounded-lg border space-y-1.5 font-mono text-xs ${
                            passed ? 'bg-[#1b2a22] border-[#22543d]' : 'bg-[#2a1b1e] border-[#54222b]'
                          }`}>
                            <div className="flex items-center justify-between font-bold">
                              <div className="flex items-center space-x-2">
                                {passed ? (
                                  <span className="w-5 h-5 rounded-full bg-[#00b8a3]/20 text-[#00b8a3] flex items-center justify-center text-[10px] border border-[#00b8a3]/40">✓</span>
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-[#FF375F]/20 text-[#FF375F] flex items-center justify-center text-[10px] border border-[#FF375F]/40">✕</span>
                                )}
                                <span className="text-white text-sm font-extrabold">Testcase {indexNum}</span>
                              </div>
                              <span className="text-[#8a8a8a] text-xs font-mono">{runtimeVal}ms</span>
                            </div>

                            <div className="pl-7 space-y-2 text-xs">
                              {tr.error && (
                                <div className="text-[#FF375F] font-mono text-xs font-bold bg-[#FF375F]/10 p-2 rounded border border-[#FF375F]/20 whitespace-pre-wrap">
                                  Console / Runtime Error: '{tr.error}'
                                </div>
                              )}

                              {inputVal && (
                                <div>
                                  <div className="text-[11px] font-bold text-slate-400">Input:</div>
                                  <pre className="font-mono text-xs whitespace-pre-wrap bg-[#141414] p-2 rounded border border-[#333333] text-white mt-0.5 select-text">
                                    {formatOutputStr(inputVal)}
                                  </pre>
                                </div>
                              )}

                              {expectedVal && (
                                <div>
                                  <div className="text-[11px] font-bold text-slate-400">Expected:</div>
                                  <pre className="font-mono text-xs whitespace-pre-wrap bg-[#141414] p-2 rounded border border-[#333333] text-[#00b8a3] font-bold mt-0.5 select-text">
                                    {formatOutputStr(expectedVal)}
                                  </pre>
                                </div>
                              )}

                              {actualVal && (
                                <div>
                                  <div className="text-[11px] font-bold text-slate-400">Actual Output:</div>
                                  <pre className={`font-mono text-xs whitespace-pre-wrap bg-[#141414] p-2 rounded border border-[#333333] font-bold mt-0.5 select-text ${passed ? 'text-[#00b8a3]' : 'text-[#FF375F]'}`}>
                                    {formatOutputStr(actualVal)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Forceful Fullscreen Requirement Overlay Modal */}
      {!isFullscreen && !autoSubmitted && !kicked && (
        <div className="fixed inset-0 z-50 bg-[#111111] text-[#FFFFFF] flex items-center justify-center p-4">
          <GradFlow
            config={{
              color1: { r: 129, g: 135, b: 217 },
              color2: { r: 232, g: 211, b: 207 },
              color3: { r: 61, g: 110, b: 209 },
              speed: 1,
              scale: 2.1,
              type: 'animated',
              noise: 0.5
            }}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
          />

          <div className="relative z-10 bg-white/40 backdrop-blur-xl p-8 rounded-lg max-w-lg w-full text-center border border-white/70 shadow-2xl space-y-5 text-[#111111]">
            <div className="p-3.5 rounded-lg bg-white/95 text-[#0055ff] inline-flex shadow-xl">
              <ShieldAlert className="w-10 h-10 text-[#0055ff]" />
            </div>
            
            <h2 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl font-extrabold text-[#111111]">Full Screen Mode Required</h2>
            
            <div className="p-4 rounded-lg bg-white/90 border border-white text-left text-xs space-y-3 text-[#111111] shadow-sm">
              <div className="flex items-start gap-2 text-[#C51F02]">
                <AlertTriangle className="w-4 h-4 text-[#C51F02] flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#C51F02] block mb-0.5 uppercase tracking-wide font-extrabold text-xs">What causes Security Warnings?</strong>
                  <ul className="list-disc pl-4 space-y-1 text-[#222222] font-medium">
                    <li>Exiting Full Screen Mode</li>
                    <li>Forbidden Shortcuts: <code className="bg-rose-100 text-[#C51F02] px-1 py-0.5 rounded font-mono font-bold">F12</code>, <code className="bg-rose-100 text-[#C51F02] px-1 py-0.5 rounded font-mono font-bold">Ctrl+C/V/X/U/S</code></li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-2 text-amber-900 pt-2 border-t border-slate-200">
                <RefreshCw className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-800 block mb-0.5 uppercase tracking-wide font-extrabold text-xs">What causes Tab Switch Violations?</strong>
                  <ul className="list-disc pl-4 space-y-1 text-[#222222] font-medium">
                    <li>Switching to another browser tab or window</li>
                    <li>Minimizing browser or clicking outside window</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                requestFullscreen();
                setIsFullscreen(true);
              }}
              className="w-full py-4 bg-[#0055ff] hover:bg-[#0044cc] text-white font-mono font-bold rounded-lg text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#0055ff]/35 flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <Maximize2 className="w-5 h-5" />
              <span>ENTER FULL SCREEN MODE & RESUME EXAM</span>
            </button>
          </div>
        </div>
      )}

      {/* Anti-Cheat Alert Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 bg-[#111111] text-[#FFFFFF] flex items-center justify-center p-4">
          <GradFlow
            config={{
              color1: { r: 66, g: 78, b: 108 },
              color2: { r: 82, g: 82, b: 66 },
              color3: { r: 87, g: 10, b: 10 },
              speed: 0.6,
              scale: 0.6,
              type: 'animated',
              noise: 0.5
            }}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
          />

          <div className="relative z-10 bg-white/40 backdrop-blur-xl p-7 rounded-lg max-w-sm w-full text-center border border-white/70 shadow-2xl space-y-4 text-[#111111]">
            <div className="p-3 rounded-lg bg-white/95 text-[#C51F02] inline-flex shadow-xl border border-white">
              <ShieldAlert className="w-10 h-10 text-[#C51F02]" />
            </div>
            
            <h3 className="font-['Playfair_Display',serif] text-xl sm:text-2xl font-extrabold text-[#111111] tracking-wide">
              Proctored Exam Alert
            </h3>
            
            <p className="text-xs text-[#222222] leading-relaxed font-semibold bg-white/85 p-3.5 rounded-lg border border-white shadow-sm">
              {warningMessage}
            </p>
            
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-3.5 bg-[#C51F02] hover:bg-[#a61700] text-white font-mono font-bold text-xs tracking-wider uppercase rounded-lg shadow-xl shadow-rose-900/40 transition-all active:scale-[0.99]"
            >
              ACKNOWLEDGE & RESUME TEST
            </button>
          </div>
        </div>
      )}

      {/* Forceful Fullscreen Requirement Overlay Modal */}
      {!isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#111111] text-[#FFFFFF] flex items-center justify-center p-4">
          <GradFlow
            config={{
              color1: { r: 129, g: 135, b: 217 },
              color2: { r: 232, g: 211, b: 207 },
              color3: { r: 61, g: 110, b: 209 },
              speed: 1,
              scale: 2.1,
              type: 'animated',
              noise: 0.5
            }}
            className="fixed inset-0 w-full h-full pointer-events-none z-0"
          />

          <div className="relative z-10 bg-white/40 backdrop-blur-xl p-8 rounded-xl max-w-md w-full text-center border border-white/70 shadow-2xl space-y-5 text-[#111111]">
            <div className="p-3.5 rounded-lg bg-white/95 text-[#0055ff] inline-flex shadow-xl">
              <ShieldAlert className="w-10 h-10 text-[#0055ff]" />
            </div>
            <h2 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl font-extrabold text-[#111111]">Full Screen Mode Required</h2>
            <p className="text-xs text-[#313131] font-semibold leading-relaxed">
              This proctored assessment portal requires full screen mode at all times. Please re-enter full screen mode to continue your exam.
            </p>
            <button
              onClick={requestFullscreen}
              className="w-full py-4 bg-[#0055ff] hover:bg-[#0044cc] text-white font-mono font-bold text-sm tracking-wider uppercase rounded-lg shadow-xl shadow-[#0055ff]/35 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              <Maximize2 className="w-5 h-5" />
              <span>RE-ENTER FULL SCREEN MODE</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
