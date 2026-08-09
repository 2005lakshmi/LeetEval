import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { FileCode, FileText, Monitor, ArrowRight, Sparkles } from 'lucide-react';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState({ questions: 0, papers: 0, rooms: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const [qRes, pRes, rRes] = await Promise.all([
        axios.get('/api/questions', authHeader),
        axios.get('/api/papers', authHeader),
        axios.get('/api/rooms', authHeader)
      ]);
      setStats({
        questions: qRes.data.questions?.length || 0,
        papers: pRes.data.papers?.length || 0,
        rooms: rRes.data.rooms?.length || 0
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] relative overflow-hidden select-none pb-12">
      
      {/* Native GradFlow Animated Canvas Background matching Join Exam Portal */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Welcome Banner matching Join Exam Portal Card Aesthetics */}
        <div className="relative rounded-xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex p-3 rounded-xl bg-white/95 text-[#0E52FF] shadow-lg mb-4 border border-white">
                <Sparkles className="w-6 h-6 text-[#0E52FF] animate-pulse" />
              </div>
              <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
                Welcome back, {user?.name || 'Faculty Admin'}!
              </h1>
              <p className="text-[#313131] mt-2 max-w-2xl text-base leading-relaxed font-semibold">
                Manage your question bank, assemble verified test papers, launch high-concurrency exam rooms, and monitor student sessions in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Overview Stat Cards matching Join Exam Portal Aesthetics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="relative rounded-xl p-6 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#313131]">Question Bank</span>
              <div className="p-3 rounded-lg bg-white/90 text-[#0E52FF] shadow-sm border border-white">
                <FileCode className="w-6 h-6" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/90 border border-white text-left shadow-sm flex items-center justify-between">
              <div>
                <div className="font-mono text-4xl font-extrabold text-[#111111] tracking-tight">{stats.questions}</div>
                <p className="text-xs text-[#0E52FF] mt-1 font-bold">Verified problem templates</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-xl p-6 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#313131]">Exam Papers</span>
              <div className="p-3 rounded-lg bg-white/90 text-emerald-700 shadow-sm border border-white">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/90 border border-white text-left shadow-sm flex items-center justify-between">
              <div>
                <div className="font-mono text-4xl font-extrabold text-[#111111] tracking-tight">{stats.papers}</div>
                <p className="text-xs text-emerald-700 mt-1 font-bold">Ready for live rooms</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-xl p-6 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#313131]">Active Rooms</span>
              <div className="p-3 rounded-lg bg-white/90 text-purple-700 shadow-sm border border-white">
                <Monitor className="w-6 h-6" />
              </div>
            </div>
            <div className="p-4 rounded-lg bg-white/90 border border-white text-left shadow-sm flex items-center justify-between">
              <div>
                <div className="font-mono text-4xl font-extrabold text-[#111111] tracking-tight">{stats.rooms}</div>
                <p className="text-xs text-purple-700 mt-1 font-bold">Real-time socket monitoring</p>
              </div>
            </div>
          </div>

        </div>

        {/* Quick Action Navigation Grid matching Join Exam Portal Card Aesthetics */}
        <h2 className="font-['Playfair_Display',serif] text-2xl font-extrabold text-white tracking-tight drop-shadow-lg">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Link to="/admin/questions" className="relative rounded-xl p-6 bg-white/35 backdrop-blur-xl border border-white/70 hover:border-[#0E52FF] shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] group transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-white/90 text-[#0E52FF] group-hover:bg-[#0E52FF] group-hover:text-white transition-all shadow-sm border border-white">
                <FileCode className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-[#313131] group-hover:text-[#0E52FF] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">Manage Questions</h3>
            <p className="text-xs text-[#313131] mt-2 leading-relaxed font-semibold">Author questions, set boilerplate per language, and run the reference solution verification gate.</p>
          </Link>

          <Link to="/admin/papers" className="relative rounded-xl p-6 bg-white/35 backdrop-blur-xl border border-white/70 hover:border-emerald-600 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] group transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-white/90 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm border border-white">
                <FileText className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-[#313131] group-hover:text-emerald-700 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">Exam Papers</h3>
            <p className="text-xs text-[#313131] mt-2 leading-relaxed font-semibold">Combine verified questions into structured exam papers with custom ordering & time limits.</p>
          </Link>

          <Link to="/admin/rooms" className="relative rounded-xl p-6 bg-white/35 backdrop-blur-xl border border-white/70 hover:border-purple-600 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] group transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-white/90 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm border border-white">
                <Monitor className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-[#313131] group-hover:text-purple-700 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">Live Exam Rooms</h3>
            <p className="text-xs text-[#313131] mt-2 leading-relaxed font-semibold">Generate short room codes, manage waiting room admissions, and monitor live exam anti-cheat counters.</p>
          </Link>

        </div>

      </div>
    </div>
  );
}
