import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { GradFlow } from 'gradflow';
import { Clock, CheckCircle2, User, KeyRound, Maximize2, AlertTriangle, RefreshCw, ShieldAlert, Sparkles, ArrowRight, Play, Users } from 'lucide-react';

export default function DemoWaitingRoom() {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState('');
  const [paperData, setPaperData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlineCount, setOnlineCount] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const name = localStorage.getItem('leeteval_demo_name') || 'Demo Student';
    setStudentName(name);

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
      setPaperData(res.data);
    } catch (err) {
      console.error('[Demo Waiting Fetch Error]:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const handleStartDemoExam = () => {
    requestFullscreen();
    navigate('/demo/exam');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center text-slate-400 font-mono">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-[#0E52FF]" />
        <span>Joining Demo Waiting Lobby...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Animated GradFlow Canvas Background */}
      <GradFlow
        config={{
          color1: { r: 255, g: 247, b: 0 },
          color2: { r: 197, g: 31, b: 2 },
          color3: { r: 20, g: 5, b: 5 },
          speed: 0.9,
          scale: 2,
          type: 'animated',
          noise: 0.5
        }}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Ambient Contrast Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/60 via-transparent to-[#111111]/30 pointer-events-none z-0" />

      {/* Small Bottom-Left Live Online Counter Pill */}
      <div className="fixed bottom-4 left-4 z-30 flex items-center space-x-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-xs font-mono font-bold text-emerald-400 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{onlineCount} online</span>
      </div>

      <div className="w-full max-w-lg relative z-10 my-8">
        
        {/* Header Section */}
        <div className="text-center mb-6 space-y-3">
          <div className="inline-flex p-3 rounded-xl bg-white/90 border border-white text-rose-600 shadow-2xl backdrop-blur-md animate-bounce">
            <CheckCircle2 className="w-8 h-8 text-rose-600" />
          </div>
          
          <div className="inline-block px-3.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
            ✓ Demo Session Approved
          </div>

          <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl font-extrabold tracking-tight text-[#FFFFFF] drop-shadow-xl">
            Demo Exam Waiting Lobby
          </h1>
          
          <p className="text-base text-white/90 max-w-md mx-auto leading-relaxed drop-shadow font-medium">
            You are ready to begin the coding evaluation demo!
          </p>
        </div>

        {/* Cream Glassmorphism Lobby Card */}
        <div className="relative rounded-xl p-6 sm:p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.3)] text-[#111111] space-y-6 overflow-hidden">
          
          {/* Exam Paper Details */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/60 border border-white/80 space-y-2">
              <div className="text-xs font-extrabold text-[#111111] uppercase tracking-wider font-mono">Exam Paper Allocated:</div>
              <div className="text-xl font-extrabold text-[#111111] font-['Playfair_Display',serif]">
                {paperData?.title || 'LeetEval Interactive Demo Assessment'}
              </div>
              <div className="flex items-center space-x-4 text-xs font-mono font-bold text-slate-700 pt-1">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-[#0E52FF]" />
                  <span>Time Limit: {paperData?.timeLimitMinutes || 30} Mins</span>
                </span>
                <span className="flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Questions: {paperData?.questions?.length || 2}</span>
                </span>
              </div>
            </div>

            {/* Student Info Card */}
            <div className="p-4 rounded-xl bg-white/60 border border-white/80 space-y-2">
              <div className="text-xs font-extrabold text-[#111111] uppercase tracking-wider font-mono">Student Details:</div>
              <div className="flex items-center justify-between text-sm font-bold text-[#111111]">
                <span className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-[#0E52FF]" />
                  <span>{studentName}</span>
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-[#0E52FF]/10 text-[#0E52FF] border border-[#0E52FF]/30">
                  DEMO_STUDENT
                </span>
              </div>
            </div>
          </div>

          {/* Anti-Cheat Instructions */}
          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-950 font-medium space-y-2">
            <div className="flex items-center space-x-2 font-bold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-800" />
              <span>Exam Proctoring Security Notice:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-900 font-mono">
              <li>Fullscreen mode will be enabled automatically.</li>
              <li>Tab switching and window blur will trigger anti-cheat warnings.</li>
              <li>Live code runner evaluates your solutions instantly.</li>
            </ul>
          </div>

          {/* Fullscreen Button Banner */}
          {!isFullscreen && (
            <button
              onClick={requestFullscreen}
              className="w-full py-2.5 px-4 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 rounded-lg text-xs font-mono font-bold flex items-center justify-center space-x-2 transition-all"
            >
              <Maximize2 className="w-4 h-4" />
              <span>CLICK TO ENABLE FULLSCREEN MODE</span>
            </button>
          )}

          {/* Start Exam Action Button */}
          <button
            onClick={handleStartDemoExam}
            className="w-full py-4 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-base tracking-wider uppercase rounded-lg shadow-xl shadow-[#0E52FF]/35 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
          >
            <span>START DEMO EXAM WORKSPACE</span>
            <ArrowRight className="w-5 h-5 ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
}
