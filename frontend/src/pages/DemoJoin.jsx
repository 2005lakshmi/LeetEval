import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { GradFlow } from 'gradflow';
import { ArrowRight, Sparkles, Play, ShieldCheck, Users } from 'lucide-react';

export default function DemoJoin() {
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem('leeteval_demo_name') || '');
  const [error, setError] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      return setError('Please enter your full name to proceed.');
    }

    localStorage.setItem('leeteval_demo_name', name.trim());
    navigate('/demo/exam');
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Native GradFlow Animated Canvas Background */}
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

      {/* Ambient Shading Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-[#111111]/30 pointer-events-none z-0" />

      {/* Small Bottom-Left Live Online Counter Pill */}
      <div className="fixed bottom-4 left-4 z-30 flex items-center space-x-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-xs font-mono font-bold text-emerald-400 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>{onlineCount} online</span>
      </div>

      <div className="w-full max-w-md relative z-10 my-8">
        
        {/* Header Section */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex p-3 rounded-xl bg-white/90 border border-white text-[#0E52FF] shadow-2xl shadow-[#0E52FF]/30 backdrop-blur-md">
            <Sparkles className="w-8 h-8 text-[#0E52FF] animate-pulse" />
          </div>
          
          <div className="inline-block px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider rounded-full backdrop-blur-md">
            ✨ Interactive Live Demo
          </div>

          <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl font-extrabold tracking-tight text-[#FFFFFF] drop-shadow-xl">
            LeetEval Demo Room
          </h1>
          
          <p className="text-base text-white/90 max-w-sm mx-auto leading-relaxed drop-shadow font-medium">
            Experience our LeetCode-style coding assessment engine with instant multi-language testcase evaluation & proctoring.
          </p>
        </div>

        {/* Highly Transparent Cream Glassmorphism Form Card */}
        <div className="relative rounded-xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.25)] text-[#111111] overflow-hidden">
          
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-900 text-sm flex items-center space-x-3 backdrop-blur-md">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-rose-700" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {/* Student Name */}
            <div>
              <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/20 transition-all text-base font-semibold shadow-sm"
              />
            </div>

            {/* Features Badge */}
            <div className="p-3 bg-white/40 rounded-lg border border-white/60 text-xs font-medium space-y-1.5 text-slate-800">
              <div className="flex items-center space-x-2 text-[#0E52FF] font-bold">
                <Play className="w-3.5 h-3.5" />
                <span>What's inside the Demo Exam?</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 font-mono">
                <li>Python, JS, C, C++, Java code runners</li>
                <li>LeetCode UI testcase result cards</li>
                <li>Full anti-cheat proctoring simulation</li>
                <li>Problem-wise code submission scorecard</li>
              </ul>
            </div>

            {/* Single Solid Color Submit Button */}
            <button
              type="submit"
              className="w-full py-4 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-base tracking-wider uppercase rounded-lg shadow-xl shadow-[#0E52FF]/35 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] mt-2"
            >
              <span>ENTER DEMO ROOM</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
