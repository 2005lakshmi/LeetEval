import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import CodeEditor from '../components/CodeEditor';
import { ShieldCheck, Users, Database, Activity, UserCheck, UserX, AlertCircle, FileText, CheckCircle2, Edit, Key, Cpu, Radio, Sparkles, Play, RefreshCw, Gauge, Zap, Server, HardDrive, Layers, CheckSquare, Trash2, Clock, Code, PieChart, Maximize2, Minimize2, Terminal, Eye, X, Copy, GripHorizontal } from 'lucide-react';

export default function MasterDashboard() {
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearingQueue, setClearingQueue] = useState(false);

  // Edit User Modal State
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'faculty', status: 'approved' });

  // Maximize Language Code Modal State
  const [expandedLanguage, setExpandedLanguage] = useState(null); // 'c' | 'python' | 'java' | 'cpp' | 'js' | null
  const [selectedBenchmarkLog, setSelectedBenchmarkLog] = useState(null);

  // Floating Minimizable / Maximizable Draggable Terminal Console State
  const [showFloatingTerminal, setShowFloatingTerminal] = useState(false);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  
  // Draggable position state
  const [terminalPos, setTerminalPos] = useState({ 
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 620) : 100, 
    y: typeof window !== 'undefined' ? Math.max(20, window.innerHeight - 380) : 100 
  });
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Interactive Concurrency & Stress Simulation State
  const [studentInputCount, setStudentInputCount] = useState(60);
  const [selectedScenario, setSelectedScenario] = useState('burst_submission');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  // Interactive Multi-Language Benchmark Stress Simulator State
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchResult, setBenchResult] = useState(null);
  const [benchForm, setBenchForm] = useState({
    cCount: 5,
    pythonCount: 15,
    javaCount: 5,
    cppCount: 5,
    jsCount: 0,
    cCode: '#include <stdio.h>\nint main() {\n  printf("OK\\n");\n  return 0;\n}',
    pythonCode: 'print("OK")',
    javaCode: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("OK");\n  }\n}',
    cppCode: '#include <iostream>\nusing namespace std;\nint main() {\n  cout << "OK" << endl;\n  return 0;\n}',
    jsCode: 'console.log("OK");'
  });

  useEffect(() => {
    fetchMasterData();
    const interval = setInterval(fetchMasterData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Draggable Terminal Global Event Listeners
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingTerminal) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 250, e.clientX - dragOffset.current.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, e.clientY - dragOffset.current.y));
      setTerminalPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingTerminal(false);
    };

    if (isDraggingTerminal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingTerminal]);

  const handleTerminalMouseDown = (e) => {
    if (isTerminalMaximized) return;
    setIsDraggingTerminal(true);
    dragOffset.current = {
      x: e.clientX - terminalPos.x,
      y: e.clientY - terminalPos.y
    };
  };

  const fetchMasterData = async () => {
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const [uRes, hRes, aRes] = await Promise.all([
        axios.get('/api/master/users', authHeader),
        axios.get('/api/master/health', authHeader),
        axios.get('/api/master/audit-logs', authHeader)
      ]);

      setUsers(uRes.data.users || []);
      setHealth(hRes.data);
      setAuditLogs(aRes.data.logs || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearQueue = async () => {
    if (!window.confirm('Emergency Clear Queue: Are you sure you want to flush all pending & active execution jobs in the queue?')) return;
    setClearingQueue(true);
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const res = await axios.post('/api/master/clear-queue', {}, authHeader);
      alert(res.data.message || 'Execution queue emergency flushed.');
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to clear queue');
    } finally {
      setClearingQueue(false);
    }
  };

  const handleRunTrafficSimulation = async (e) => {
    if (e) e.preventDefault();
    setSimulating(true);
    setSimResult(null);

    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const res = await axios.post(
        '/api/master/simulate-load',
        { studentCount: studentInputCount, scenario: selectedScenario },
        authHeader
      );
      setSimResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Simulation execution failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleRunMultiLangBenchmark = async (e) => {
    if (e) e.preventDefault();
    setBenchmarking(true);
    setBenchResult(null);
    setShowFloatingTerminal(true);
    setIsTerminalMinimized(false);
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] ▶ Initializing multi-language stress benchmark simulation...`,
      `[${new Date().toLocaleTimeString()}] ▶ Dispatching C (${benchForm.cCount}), Python (${benchForm.pythonCount}), Java (${benchForm.javaCount}), C++ (${benchForm.cppCount}), JS (${benchForm.jsCount}) executions to worker pool...`
    ]);

    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const res = await axios.post('/api/master/benchmark-simulate', benchForm, authHeader);
      setBenchResult(res.data);

      const logs = (res.data.executionLogs || []).map(
        (l) => `[${new Date().toLocaleTimeString()}] ▶ RUN #${l.index} [${l.language.toUpperCase()}] -> Verdict: ${l.verdict} | Latency: ${l.latencyMs}ms | Output: "${(l.rawOutput || '').trim().replace(/\n/g, ' ')}"`
      );
      const metrics = res.data.metrics || {};
      const summary = `[${new Date().toLocaleTimeString()}] ✔ BENCHMARK COMPLETE: ${res.data.totalExecutions} jobs. Min: ${metrics.minWaitingMs}ms, Max: ${metrics.maxWaitingMs}ms, Avg: ${metrics.avgWaitingMs}ms, Throughput: ${metrics.throughputPerSec}/sec, RAM Delta: ${metrics.memoryDeltaMb}MB`;

      setTerminalLogs((prev) => [...prev, ...logs, summary]);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Multi-language benchmark failed';
      setTerminalLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ❌ ERROR: ${errMsg}`]);
      alert(errMsg);
    } finally {
      setBenchmarking(false);
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      await axios.put(
        `/api/master/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleOpenEditUser = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role || 'faculty',
      status: user.status || 'approved'
    });
  };

  const handleSaveUserCredentials = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      await axios.put(
        `/api/master/users/${editUser._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setEditUser(null);
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user credentials');
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-[#111111] font-semibold">Loading Master Control Panel...</div>;
  }

  const activeSocketsCount = health?.activeSockets || 0;

  // RAM Allocation Math
  const heapUsedMb = Math.round((health?.system?.memoryUsage?.heapUsed || 0) / 1024 / 1024);
  const rssMb = Math.round((health?.system?.memoryUsage?.rss || 0) / 1024 / 1024);
  const freeCapMb = 512; // Render Free Tier Limit
  const freeRamMb = Math.max(0, freeCapMb - rssMb);
  const ramUsedPct = Math.min(100, Math.round((rssMb / freeCapMb) * 100));

  // SVG Pie Chart Calculation
  const strokeDashoffset = 283 - (283 * ramUsedPct) / 100;

  const langConfigs = {
    c: { title: 'C Language Benchmark', color: 'text-[#0E52FF]', codeKey: 'cCode', countKey: 'cCount', editorLang: 'cpp' },
    python: { title: 'Python Benchmark', color: 'text-amber-700', codeKey: 'pythonCode', countKey: 'pythonCount', editorLang: 'python' },
    java: { title: 'Java Benchmark', color: 'text-rose-700', codeKey: 'javaCode', countKey: 'javaCount', editorLang: 'java' },
    cpp: { title: 'C++ Benchmark', color: 'text-purple-700', codeKey: 'cppCode', countKey: 'cppCount', editorLang: 'cpp' },
    js: { title: 'JavaScript Benchmark', color: 'text-amber-600', codeKey: 'jsCode', countKey: 'jsCount', editorLang: 'javascript' }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] relative overflow-hidden select-none pb-12">
      
      {/* Native GradFlow Animated Canvas Background matching Faculty/Admin Theme */}
      <GradFlow
        config={{
          color1: { r: 14, g: 82, b: 255 },
          color2: { r: 130, g: 220, b: 255 },
          color3: { r: 255, g: 255, b: 255 },
          speed: 0.4,
          scale: 2.2,
          type: 'animated',
          noise: 0.5
        }}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Ambient Contrast Shading Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-[#111111]/30 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 mt-4 space-y-8 relative z-10">
        
        {/* Master Control Top Banner */}
        <div className="relative rounded-xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="inline-flex p-2.5 rounded-lg bg-white/95 text-[#0E52FF] shadow-sm border border-white">
                <ShieldCheck className="w-6 h-6 text-[#0E52FF]" />
              </div>
              <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
                Master Telemetry, Queue Controls & Benchmark Simulator
              </h1>
            </div>
            <p className="text-sm text-[#111111] font-semibold leading-relaxed max-w-3xl">
              Monitor live server RAM allocation pie charts, track queue workloads, execute emergency queue flushes, and simulate multi-language code execution latency before student exams.
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 font-mono font-bold text-xs uppercase tracking-wider shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>High-Concurrency Engine Active</span>
          </div>
        </div>

        {/* Live Server RAM Allocation Pie Chart & Queue Dashboard Telemetry Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Server RAM Usage Pie Chart Card */}
          <div className="rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <PieChart className="w-5 h-5 text-[#0E52FF]" />
                <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">
                  Live Render RAM Allocation
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-[#0E52FF]">{rssMb} MB / {freeCapMb} MB</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              {/* Circular Gauge Pie Chart */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" stroke="#E5E0D8" strokeWidth="10" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke={ramUsedPct > 80 ? '#e11d48' : '#0E52FF'}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray="283"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold font-mono text-[#111111]">{ramUsedPct}%</span>
                  <span className="text-[10px] font-mono font-bold text-[#555555] uppercase">RAM USED</span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs w-full sm:w-auto">
                <div className="flex items-center justify-between space-x-4 p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="flex items-center space-x-2 text-slate-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0E52FF]"></span>
                    <span>Node.js Process RSS:</span>
                  </span>
                  <span className="font-extrabold text-[#0E52FF]">{rssMb} MB</span>
                </div>
                <div className="flex items-center justify-between space-x-4 p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="flex items-center space-x-2 text-slate-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>V8 Heap Used:</span>
                  </span>
                  <span className="font-extrabold text-emerald-700">{heapUsedMb} MB</span>
                </div>
                <div className="flex items-center justify-between space-x-4 p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="flex items-center space-x-2 text-slate-700 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Free Container RAM:</span>
                  </span>
                  <span className="font-extrabold text-amber-800">{freeRamMb} MB</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Queue Telemetry & Emergency Clear Queue Card */}
          <div className="rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-700" />
                <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">
                  Execution Queue Telemetry
                </h2>
              </div>
              <span className="text-xs font-mono font-bold text-purple-700 uppercase">{health?.queueMetrics?.mode || 'Active'}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-[#555555] uppercase">Active Workers</div>
                <div className="text-2xl font-extrabold text-[#0E52FF]">{health?.queueMetrics?.active || 0}</div>
                <div className="text-[10px] text-slate-500">Executing code</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-[#555555] uppercase">Queued Submissions</div>
                <div className="text-2xl font-extrabold text-amber-700">{health?.queueMetrics?.waiting || 0}</div>
                <div className="text-[10px] text-slate-500">Waiting in line</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs font-mono text-[#555555]">
                WebSocket Concurrency: <strong className="text-[#111111]">{activeSocketsCount} active sockets</strong>
              </div>
              <button
                onClick={handleClearQueue}
                disabled={clearingQueue}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center space-x-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 text-white" />
                <span>{clearingQueue ? 'FLUSHING QUEUE...' : 'CLEAR QUEUE (EMERGENCY)'}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Interactive Multi-Language Stress & Benchmark Simulator */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#0E52FF]" />
              <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">
                Multi-Language Stress & Execution Latency Benchmark Simulator
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#555555]">Test platform throughput & response time before exams</span>
          </div>

          <form onSubmit={handleRunMultiLangBenchmark} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              
              {/* C Code Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 relative group shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-extrabold text-[#0E52FF] uppercase">C Language Benchmark</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedLanguage('c')}
                      className="p-1.5 text-slate-500 hover:text-[#0E52FF] hover:bg-slate-100 rounded transition-colors"
                      title="Maximize Editor Modal"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Runs:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={benchForm.cCount}
                        onChange={(e) => setBenchForm({ ...benchForm, cCount: e.target.value })}
                        className="w-16 p-1 bg-white border border-[#E5E0D8] rounded text-center text-xs font-bold font-mono focus:ring-2 focus:ring-[#0E52FF]"
                      />
                    </div>
                  </div>
                </div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">C Code Editor:</label>
                <div className="h-44 rounded-lg overflow-hidden border border-slate-200">
                  <CodeEditor
                    value={benchForm.cCode}
                    onChange={(val) => setBenchForm({ ...benchForm, cCode: val })}
                    language="cpp"
                  />
                </div>
              </div>

              {/* Python Code Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 relative group shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-extrabold text-amber-700 uppercase">Python Benchmark</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedLanguage('python')}
                      className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-slate-100 rounded transition-colors"
                      title="Maximize Editor Modal"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Runs:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={benchForm.pythonCount}
                        onChange={(e) => setBenchForm({ ...benchForm, pythonCount: e.target.value })}
                        className="w-16 p-1 bg-white border border-[#E5E0D8] rounded text-center text-xs font-bold font-mono focus:ring-2 focus:ring-[#0E52FF]"
                      />
                    </div>
                  </div>
                </div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Python Code Editor:</label>
                <div className="h-44 rounded-lg overflow-hidden border border-slate-200">
                  <CodeEditor
                    value={benchForm.pythonCode}
                    onChange={(val) => setBenchForm({ ...benchForm, pythonCode: val })}
                    language="python"
                  />
                </div>
              </div>

              {/* Java Code Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 relative group shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-extrabold text-rose-700 uppercase">Java Benchmark</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedLanguage('java')}
                      className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded transition-colors"
                      title="Maximize Editor Modal"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Runs:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={benchForm.javaCount}
                        onChange={(e) => setBenchForm({ ...benchForm, javaCount: e.target.value })}
                        className="w-16 p-1 bg-white border border-[#E5E0D8] rounded text-center text-xs font-bold font-mono focus:ring-2 focus:ring-[#0E52FF]"
                      />
                    </div>
                  </div>
                </div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">Java Code Editor:</label>
                <div className="h-44 rounded-lg overflow-hidden border border-slate-200">
                  <CodeEditor
                    value={benchForm.javaCode}
                    onChange={(val) => setBenchForm({ ...benchForm, javaCode: val })}
                    language="java"
                  />
                </div>
              </div>

              {/* C++ Code Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 relative group shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-extrabold text-purple-700 uppercase">C++ Benchmark</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedLanguage('cpp')}
                      className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-slate-100 rounded transition-colors"
                      title="Maximize Editor Modal"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Runs:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={benchForm.cppCount}
                        onChange={(e) => setBenchForm({ ...benchForm, cppCount: e.target.value })}
                        className="w-16 p-1 bg-white border border-[#E5E0D8] rounded text-center text-xs font-bold font-mono focus:ring-2 focus:ring-[#0E52FF]"
                      />
                    </div>
                  </div>
                </div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">C++ Code Editor:</label>
                <div className="h-44 rounded-lg overflow-hidden border border-slate-200">
                  <CodeEditor
                    value={benchForm.cppCode}
                    onChange={(val) => setBenchForm({ ...benchForm, cppCode: val })}
                    language="cpp"
                  />
                </div>
              </div>

              {/* JavaScript Code Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 relative group shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-extrabold text-amber-600 uppercase">JavaScript Benchmark</span>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setExpandedLanguage('js')}
                      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                      title="Maximize Editor Modal"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Runs:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={benchForm.jsCount}
                        onChange={(e) => setBenchForm({ ...benchForm, jsCount: e.target.value })}
                        className="w-16 p-1 bg-white border border-[#E5E0D8] rounded text-center text-xs font-bold font-mono focus:ring-2 focus:ring-[#0E52FF]"
                      />
                    </div>
                  </div>
                </div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase">JS Code Editor:</label>
                <div className="h-44 rounded-lg overflow-hidden border border-slate-200">
                  <CodeEditor
                    value={benchForm.jsCode}
                    onChange={(val) => setBenchForm({ ...benchForm, jsCode: val })}
                    language="javascript"
                  />
                </div>
              </div>

            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={benchmarking}
                className="py-3 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-xl shadow-[#0E52FF]/30 flex items-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {benchmarking ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-white animate-spin" />
                    <span>STRESS BENCHMARKING WORKER POOL...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-white fill-white" />
                    <span>RUN RANDOMIZED MULTI-LANGUAGE BENCHMARK</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Benchmark Results Telemetry Cards & Console Output Logs */}
          {benchResult && (
            <div className="pt-4 border-t border-slate-200 space-y-4 font-mono">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1 shadow-sm">
                  <div className="text-[10px] font-bold uppercase text-emerald-800">Minimum Latency</div>
                  <div className="text-2xl font-extrabold text-emerald-700">{benchResult.metrics?.minWaitingMs} ms</div>
                  <div className="text-[10px] font-bold">Fastest single execution</div>
                </div>

                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 space-y-1 shadow-sm">
                  <div className="text-[10px] font-bold uppercase text-rose-800">Maximum Latency</div>
                  <div className="text-2xl font-extrabold text-rose-700">{benchResult.metrics?.maxWaitingMs} ms</div>
                  <div className="text-[10px] font-bold">Worst-case single execution</div>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-950 space-y-1 shadow-sm">
                  <div className="text-[10px] font-bold uppercase text-blue-800">Average Waiting Time</div>
                  <div className="text-2xl font-extrabold text-[#0E52FF]">{benchResult.metrics?.avgWaitingMs} ms</div>
                  <div className="text-[10px] font-bold">Mean execution response</div>
                </div>

                <div className="p-4 rounded-lg bg-purple-50 border border-purple-200 text-purple-950 space-y-1 shadow-sm">
                  <div className="text-[10px] font-bold uppercase text-purple-800">Throughput Rate</div>
                  <div className="text-2xl font-extrabold text-purple-700">{benchResult.metrics?.throughputPerSec} / sec</div>
                  <div className="text-[10px] font-bold">RAM Delta: {benchResult.metrics?.memoryDeltaMb} MB</div>
                </div>

              </div>

              {/* Execution Log Table with Console Output Action */}
              <div className="overflow-x-auto max-h-64 rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full text-left text-xs text-[#111111]">
                  <thead className="bg-[#FAF8F5] uppercase font-mono font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Run #</th>
                      <th className="p-2.5">Language</th>
                      <th className="p-2.5">Verdict</th>
                      <th className="p-2.5">Latency</th>
                      <th className="p-2.5">Console Output</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-mono text-xs">
                    {benchResult.executionLogs?.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold">{log.index}</td>
                        <td className="p-2.5 uppercase font-bold text-[#0E52FF]">{log.language}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.verdict === 'Accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {log.verdict}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-[#111111]">{log.latencyMs} ms</td>
                        <td className="p-2.5">
                          <button
                            onClick={() => setSelectedBenchmarkLog(log)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-[#0E52FF] border border-[#0E52FF]/30 rounded text-[10px] font-mono font-bold uppercase flex items-center space-x-1 shadow-sm"
                          >
                            <Terminal className="w-3 h-3 text-[#0E52FF]" />
                            <span>View Console Log</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Maximize Language Code Modal */}
        {expandedLanguage && langConfigs[expandedLanguage] && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl max-w-4xl w-full border border-white shadow-2xl space-y-4 text-[#111111] max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2 font-mono">
                  <Code className="w-5 h-5 text-[#0E52FF]" />
                  <h3 className={`text-lg font-extrabold uppercase ${langConfigs[expandedLanguage].color}`}>
                    {langConfigs[expandedLanguage].title} (Expanded Code Editor)
                  </h3>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 font-mono text-xs">
                    <span className="text-slate-500 font-bold uppercase">Runs:</span>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={benchForm[langConfigs[expandedLanguage].countKey]}
                      onChange={(e) => setBenchForm({ ...benchForm, [langConfigs[expandedLanguage].countKey]: e.target.value })}
                      className="w-16 p-1 bg-white border border-[#E5E0D8] rounded text-center font-bold focus:ring-2 focus:ring-[#0E52FF]"
                    />
                  </div>
                  <button
                    onClick={() => setExpandedLanguage(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 flex items-center space-x-1 font-mono text-xs font-bold uppercase"
                  >
                    <Minimize2 className="w-4 h-4" />
                    <span>Minimize</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col h-96">
                <label className="block text-xs font-mono font-bold text-slate-500 uppercase mb-2">Source Code Editor:</label>
                <div className="flex-1 rounded-xl overflow-hidden border border-slate-200">
                  <CodeEditor
                    value={benchForm[langConfigs[expandedLanguage].codeKey]}
                    onChange={(val) => setBenchForm({ ...benchForm, [langConfigs[expandedLanguage].codeKey]: val })}
                    language={langConfigs[expandedLanguage].editorLang}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setExpandedLanguage(null)}
                  className="px-5 py-2.5 bg-[#0E52FF] hover:bg-[#0642d9] text-white text-xs font-mono font-bold rounded-lg shadow-md uppercase tracking-wider"
                >
                  Done & Minimize Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Benchmark Log Console Output Modal */}
        {selectedBenchmarkLog && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl max-w-2xl w-full border border-white shadow-2xl space-y-4 text-[#111111]">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2 font-mono">
                  <Terminal className="w-5 h-5 text-[#0E52FF]" />
                  <h3 className="text-lg font-extrabold text-[#111111]">
                    Run #{selectedBenchmarkLog.index} [{selectedBenchmarkLog.language.toUpperCase()}] Console Output
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBenchmarkLog(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 font-mono">
                <div className="flex items-center justify-between text-xs">
                  <span>Verdict: <strong className="text-emerald-700">{selectedBenchmarkLog.verdict}</strong></span>
                  <span>Latency: <strong className="text-[#0E52FF]">{selectedBenchmarkLog.latencyMs} ms</strong></span>
                </div>
                <div className="text-xs font-bold uppercase text-slate-500">Raw Console Log & Stdout:</div>
                <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl max-h-64 overflow-y-auto whitespace-pre-wrap select-text">
                  {selectedBenchmarkLog.rawOutput || 'Execution completed with no console output.'}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedBenchmarkLog(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-mono font-bold rounded-lg shadow-md uppercase tracking-wider"
                >
                  Close Console Modal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Minimizable / Maximizable Draggable Terminal Console Window */}
        {showFloatingTerminal && (
          <div 
            style={
              isTerminalMaximized 
                ? {} 
                : { left: `${terminalPos.x}px`, top: `${terminalPos.y}px` }
            }
            className={`fixed z-50 shadow-[0_25px_60px_rgba(0,0,0,0.5)] rounded-2xl border border-slate-700 overflow-hidden bg-[#141414] text-[#00b8a3] font-mono select-text transition-all duration-150 ${
              isTerminalMaximized 
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-4xl h-[70vh] max-h-[600px]' 
                : isTerminalMinimized 
                  ? 'w-96 h-11' 
                  : 'w-[580px] h-[340px]'
            }`}
          >
            {/* Terminal Top Window Bar (Draggable Drag Handle) */}
            <div 
              onMouseDown={handleTerminalMouseDown}
              className={`h-11 bg-[#222222] border-b border-slate-700 px-4 flex items-center justify-between select-none ${
                isTerminalMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
              }`}
            >
              <div className="flex items-center space-x-2">
                <GripHorizontal className="w-4 h-4 text-slate-500 mr-1" />
                <Terminal className="w-4 h-4 text-[#00b8a3]" />
                <span className="font-bold text-xs text-white uppercase tracking-wider">Live Execution Floating Terminal</span>
                {benchmarking && (
                  <span className="flex items-center space-x-1 text-[10px] text-amber-400 font-bold">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>RUNNING...</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1.5" onMouseDown={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsTerminalMinimized(!isTerminalMinimized)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title={isTerminalMinimized ? 'Restore Terminal' : 'Minimize Terminal'}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setIsTerminalMaximized(!isTerminalMaximized);
                    setIsTerminalMinimized(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title={isTerminalMaximized ? 'Restore Window Size' : 'Maximize Window'}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowFloatingTerminal(false)}
                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded transition-colors"
                  title="Close Floating Terminal"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Terminal Body Console Output */}
            {!isTerminalMinimized && (
              <div className="p-4 overflow-y-auto h-[calc(100%-44px)] text-xs space-y-1.5 leading-relaxed select-text font-mono">
                {terminalLogs.length === 0 ? (
                  <div className="text-slate-500 italic">No executions logged yet...</div>
                ) : (
                  terminalLogs.map((logStr, idx) => (
                    <div 
                      key={idx} 
                      className={
                        logStr.includes('✔ BENCHMARK COMPLETE') ? 'text-emerald-400 font-extrabold pt-2 border-t border-slate-800' :
                        logStr.includes('❌ ERROR') ? 'text-rose-400 font-bold' :
                        'text-slate-200'
                      }
                    >
                      {logStr}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Registered Credentials & User Management Table */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4">
          <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0E52FF]" />
            <span>User Accounts & Faculty Credentials Management</span>
          </h2>

          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-[#111111]">
              <thead className="bg-[#FAF8F5] text-[#111111] uppercase font-mono font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-[#111111]">{u.name}</td>
                    <td className="p-3 font-mono text-[#0E52FF] font-bold">{u.email}</td>
                    <td className="p-3 capitalize font-bold">{u.role}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold uppercase ${
                        u.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        u.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-[#0E52FF] border border-[#0E52FF]/30 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm transition-all"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#0E52FF]" />
                        <span>Edit Credentials</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit Trail Table */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4">
          <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-700" />
            <span>Security Audit Trail & Exam Operations Log</span>
          </h2>

          <div className="overflow-x-auto max-h-72 rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-[#111111]">
              <thead className="bg-[#FAF8F5] text-[#111111] uppercase font-mono font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Actor</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-xs">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-[#555555]">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-2.5 text-[#0E52FF] font-bold">{log.actorId?.name || log.actorType}</td>
                    <td className="p-2.5 font-extrabold text-[#111111]">{log.action}</td>
                    <td className="p-2.5 text-[#555555]">{log.targetId || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Credentials Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-xl p-7 rounded-xl max-w-md w-full border border-white shadow-2xl space-y-5 text-[#111111]">
              <h2 className="font-['Playfair_Display',serif] text-2xl font-extrabold text-[#111111]">
                Edit Faculty Credentials & Status
              </h2>

              <form onSubmit={handleSaveUserCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                    >
                      <option value="faculty">Faculty</option>
                      <option value="master">Master</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="px-4 py-2 bg-slate-100 text-[#313131] text-xs font-mono font-bold rounded-lg hover:bg-slate-200 uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0E52FF] hover:bg-[#0642d9] text-white text-xs font-mono font-bold rounded-lg shadow-md uppercase tracking-wider"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
