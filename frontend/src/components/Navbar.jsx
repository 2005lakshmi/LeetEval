import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code2, ShieldAlert, FileText, Monitor, BarChart3, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link to="/admin/dashboard" className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Code2 className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                Leet<span className="text-indigo-500">Eval</span>
              </span>
            </Link>

            {user.role === 'master' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Master Superuser
              </span>
            )}
            {user.role === 'faculty' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Faculty Admin
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/admin/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin/dashboard') ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Dashboard
            </Link>

            <Link
              to="/admin/questions"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin/questions') ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Question Bank
            </Link>

            <Link
              to="/admin/papers"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin/papers') ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Exam Papers
            </Link>

            <Link
              to="/admin/rooms"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/admin/rooms') ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Live Rooms
            </Link>

            {user.role === 'master' && (
              <Link
                to="/admin/master"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/admin/master') ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-950/40'
                }`}
              >
                Superuser Panel
              </Link>
            )}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-slate-200">{user.name}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
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
