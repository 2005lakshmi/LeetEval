import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code2, ShieldAlert, FileText, Monitor, BarChart3, LogOut, UserCheck, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  // Never render Admin Navbar on Student pages or Join screen (Fixes multi-tab session bleed)
  if (location.pathname.startsWith('/student') || location.pathname === '/join') {
    return null;
  }

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-white/80 bg-white/95 backdrop-blur-xl sticky top-0 z-40 text-[#111111] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Back Button */}
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <Link to="/admin/dashboard" className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-[#0E52FF]/10 text-[#0E52FF] border border-[#0E52FF]/20 shadow-sm">
                  <Code2 className="w-5 h-5 text-[#0E52FF]" />
                </div>
                <span className="text-xl font-bold tracking-tight text-[#111111] font-['Playfair_Display',serif]">
                  Leet<span className="text-[#0E52FF]">Eval</span>
                </span>
              </Link>
              
              {/* Clean Back Button directly below LeetEval Logo */}
              <button
                onClick={() => navigate(-1)}
                className="mt-0.5 inline-flex items-center space-x-1 text-xs font-mono font-bold text-[#313131] hover:text-[#0E52FF] transition-colors self-start"
                title="Go Back to Previous Page"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#0E52FF]" />
                <span>Back</span>
              </button>
            </div>

            {user.role === 'master' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Master Superuser</span>
              </span>
            )}
            {user.role === 'faculty' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                Faculty Admin
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 font-mono text-xs font-bold uppercase tracking-wider">
            <Link
              to="/admin/dashboard"
              className={`px-3.5 py-2 rounded-lg transition-all ${
                isActive('/admin/dashboard') ? 'bg-[#0E52FF] text-white shadow-sm' : 'text-[#313131] hover:text-[#111111] hover:bg-slate-100'
              }`}
            >
              Dashboard
            </Link>

            <Link
              to="/admin/questions"
              className={`px-3.5 py-2 rounded-lg transition-all ${
                isActive('/admin/questions') ? 'bg-[#0E52FF] text-white shadow-sm' : 'text-[#313131] hover:text-[#111111] hover:bg-slate-100'
              }`}
            >
              Question Bank
            </Link>

            <Link
              to="/admin/papers"
              className={`px-3.5 py-2 rounded-lg transition-all ${
                isActive('/admin/papers') ? 'bg-[#0E52FF] text-white shadow-sm' : 'text-[#313131] hover:text-[#111111] hover:bg-slate-100'
              }`}
            >
              Exam Papers
            </Link>

            <Link
              to="/admin/rooms"
              className={`px-3.5 py-2 rounded-lg transition-all ${
                isActive('/admin/rooms') ? 'bg-[#0E52FF] text-white shadow-sm' : 'text-[#313131] hover:text-[#111111] hover:bg-slate-100'
              }`}
            >
              Live Rooms
            </Link>

            {user.role === 'master' && (
              <Link
                to="/admin/master"
                className={`px-3.5 py-2 rounded-lg transition-all ${
                  isActive('/admin/master') ? 'bg-purple-700 text-white shadow-sm' : 'text-purple-900 hover:bg-purple-100'
                }`}
              >
                Superuser Panel
              </Link>
            )}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-[#111111]">{user.name}</div>
              <div className="text-xs font-mono text-[#0E52FF] font-semibold">{user.email}</div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-[#555555] hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors border border-transparent hover:border-rose-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
