import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { GradFlow } from 'gradflow';
import { Clock, CheckCircle2, User, KeyRound, Maximize2, AlertTriangle, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

export default function StudentWaitingRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentInfo = location.state || {};

  const [admitted, setAdmitted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const requestFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    let socket = null;

    // 1. Socket Listener for instant admittance
    try {
      socket = io(window.location.origin);

      socket.on('connect', () => {
        socket.emit('join_waiting_room', {
          roomId: studentInfo.roomId,
          usn: studentInfo.usn,
          name: studentInfo.name
        });
      });

      socket.on('student_admitted', ({ sessionId: admittedId, resumeToken }) => {
        if (resumeToken) {
          localStorage.setItem(`resume_token_${sessionId}`, resumeToken);
        }
        setAdmitted(true);
      });
    } catch (err) {
      console.log('[Socket Error]:', err.message);
    }

    // 2. Fallback REST Status Polling every 2.5 seconds
    const checkStatus = async () => {
      try {
        const res = await axios.get(`/api/student/session-status/${sessionId}`);
        if (['admitted', 'active'].includes(res.data.status)) {
          if (res.data.resumeToken) {
            localStorage.setItem(`resume_token_${sessionId}`, res.data.resumeToken);
          }
          setAdmitted(true);
        }
      } catch (err) {
        console.log('[Status Poll Error]:', err.message);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2500);

    return () => {
      if (socket) socket.disconnect();
      clearInterval(interval);
    };
  }, [sessionId, studentInfo]);

  const handleStartExam = () => {
    requestFullscreen();
    navigate(`/student/exam/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Dynamic GradFlow Background: Default Blue when waiting, Fiery Red/Yellow when Admitted! */}
      {admitted ? (
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
      ) : (
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
      )}

      {/* Contrast Shading Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/50 via-transparent to-[#111111]/40 pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10 my-8">
        
        {admitted ? (
          /* ADMITTED STATE: Fiery Warning / Rules Info Gate Page */
          <>
            <div className="text-center mb-8 space-y-3">
              <div className="inline-flex p-3.5 rounded-2xl bg-white/95 border border-white text-[#C51F02] shadow-2xl shadow-rose-900/40 backdrop-blur-md">
                <Sparkles className="w-8 h-8 text-[#C51F02] animate-pulse" />
              </div>
              
              <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-xl">
                Admitted by Faculty
              </h1>
              
              <p className="text-base text-white/90 max-w-sm mx-auto leading-relaxed drop-shadow font-medium">
                Review the strict assessment proctoring rules before entering full screen mode
              </p>
            </div>

            <div className="relative rounded-2xl p-8 bg-white/40 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] space-y-6">
              {/* Pre-Exam Anti-Cheat Guidelines Card in Inset Light Glass */}
              <div className="p-5 rounded-xl bg-white/90 border border-white text-left text-xs space-y-4 shadow-sm text-[#111111]">
                
                <div className="flex items-start gap-2.5 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-[#C51F02] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#C51F02] block mb-1 uppercase tracking-wider font-extrabold text-xs">What causes Security Warnings?</strong>
                    <ul className="list-disc pl-4 space-y-1 text-[#222222] font-medium">
                      <li>Exiting Full Screen Mode</li>
                      <li>Forbidden Shortcuts: <code className="bg-rose-100 text-[#C51F02] px-1 py-0.5 rounded font-mono font-bold">F12</code>, <code className="bg-rose-100 text-[#C51F02] px-1 py-0.5 rounded font-mono font-bold">Ctrl+C/V/X/U/S</code></li>
                      <li>Opening Developer Tools / Inspect Element</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-amber-900 pt-3 border-t border-slate-200">
                  <RefreshCw className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-800 block mb-1 uppercase tracking-wider font-extrabold text-xs">What causes Tab Switch Violations?</strong>
                    <ul className="list-disc pl-4 space-y-1 text-[#222222] font-medium">
                      <li>Switching to another browser tab or window</li>
                      <li>Minimizing the browser window</li>
                      <li>Clicking outside the browser (losing window focus)</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[#C51F02] text-xs font-bold text-center font-mono">
                  ⛔ Exceeding the permitted Warning or Tab Switch limits will automatically kick you off the exam!
                </div>
              </div>

              <button
                onClick={handleStartExam}
                className="w-full py-4 px-6 bg-[#C51F02] hover:bg-[#a61700] text-white font-mono font-bold text-base tracking-wider uppercase rounded-xl shadow-xl shadow-rose-900/40 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
              >
                <Maximize2 className="w-5 h-5" />
                <span>ENTER FULL SCREEN MODE & START EXAM</span>
              </button>
            </div>
          </>
        ) : (
          /* WAITING LOBBY STATE: Theme Matching Uploaded Screenshot */
          <>
            <div className="text-center mb-8 space-y-3">
              <div className="inline-flex p-3.5 rounded-2xl bg-white/95 border border-white text-[#0E52FF] shadow-2xl shadow-[#0E52FF]/30 backdrop-blur-md">
                <Sparkles className="w-8 h-8 text-[#0E52FF] animate-pulse" />
              </div>
              
              <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-xl">
                Waiting Room Lobby
              </h1>
              
              <p className="text-base text-white/90 max-w-sm mx-auto leading-relaxed drop-shadow font-medium">
                Your request has been registered. Please wait while the exam invigilator admits you.
              </p>
            </div>

            <div className="relative rounded-2xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] space-y-6">
              
              {/* Student Info Inset Box */}
              <div className="p-5 rounded-xl bg-white/90 border border-white text-left space-y-2 text-sm shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#555555] font-semibold">Name:</span>
                  <span className="font-bold text-[#111111]">{studentInfo.name || 'Student'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#555555] font-semibold">USN:</span>
                  <span className="font-mono font-bold text-[#0E52FF] uppercase">{studentInfo.usn || 'N/A'}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-950 text-xs text-left leading-relaxed font-semibold">
                <div className="font-extrabold flex items-center gap-1.5 mb-1 text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-800" /> Exam Rules Notice:
                </div>
                Once admitted by faculty, full screen mode is required immediately. Exits and tab switches will trigger anti-cheat warnings and risk auto-termination.
              </div>
            </div>
          </>
        )}

      </div>

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

          <div className="relative z-10 bg-white/40 backdrop-blur-xl p-8 rounded-lg max-w-md w-full text-center border border-white/70 shadow-2xl space-y-5 text-[#111111]">
            <div className="p-3.5 rounded-lg bg-white/95 text-[#0055ff] inline-flex shadow-xl">
              <ShieldAlert className="w-10 h-10 text-[#0055ff]" />
            </div>
            <h2 className="font-['Playfair_Display',serif] text-2xl sm:text-3xl font-extrabold text-[#111111]">Full Screen Mode Required</h2>
            <p className="text-xs text-[#313131] font-semibold leading-relaxed">
              This proctored assessment portal requires full screen mode at all times. Please enter full screen mode to continue.
            </p>
            <button
              onClick={requestFullscreen}
              className="w-full py-4 bg-[#0055ff] hover:bg-[#0044cc] text-white font-mono font-bold text-sm tracking-wider uppercase rounded-lg shadow-xl shadow-[#0055ff]/35 flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
            >
              <Maximize2 className="w-5 h-5" />
              <span>ENTER FULL SCREEN MODE</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
