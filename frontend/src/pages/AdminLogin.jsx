import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { email: formData.email.trim(), password: formData.password });
      const { token, user } = response.data;
      localStorage.setItem('adminToken', token);
      onLoginSuccess(user);
      navigate(user.role === 'master' ? '/admin/master' : '/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
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

      {/* Ambient Contrast Shading Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-[#111111]/30 pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10 my-8">
        
        {/* Top Header matching Join Exam Portal */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex p-3.5 rounded-2xl bg-white/95 border border-white text-[#0E52FF] shadow-2xl shadow-[#0E52FF]/30 backdrop-blur-md">
            <Sparkles className="w-8 h-8 text-[#0E52FF] animate-pulse" />
          </div>
          
          <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-xl">
            Faculty & Admin Portal
          </h1>
          
          <p className="text-base text-white/90 max-w-sm mx-auto leading-relaxed drop-shadow font-medium">
            Log in to manage questions, assemble papers, and launch live exam rooms
          </p>
        </div>

        {/* Luminous Semi-Transparent Glass Container Card matching Join Exam Portal */}
        <div className="relative rounded-2xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] space-y-6">
          
          {error && (
            <div className="p-4 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[#C51F02] text-xs font-bold flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#C51F02]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="faculty@institution.edu"
                className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-sm placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#0E52FF] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                PASSWORD
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-sm placeholder-[#888888] focus:outline-none focus:ring-2 focus:ring-[#0E52FF] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-base tracking-wider uppercase rounded-lg shadow-xl shadow-[#0E52FF]/35 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="text-center text-xs text-[#313131] font-semibold pt-2">
            Don't have a faculty account?{' '}
            <Link to="/admin/register" className="text-[#0E52FF] font-bold hover:underline">
              Request Registration
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
