import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function StudentJoin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roomCode: '',
    name: '',
    usn: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.roomCode || !formData.name || !formData.usn) {
      return setError('Please fill in all fields');
    }

    setLoading(true);
    try {
      const storedToken = localStorage.getItem(`resume_${formData.roomCode.toUpperCase()}_${formData.usn.toUpperCase()}`);

      const response = await axios.post('/api/student/join', {
        roomCode: formData.roomCode,
        name: formData.name,
        usn: formData.usn,
        resumeToken: storedToken
      });

      const { sessionId, status, resumeToken } = response.data;

      if (resumeToken) {
        localStorage.setItem(`resume_${formData.roomCode.toUpperCase()}_${formData.usn.toUpperCase()}`, resumeToken);
      }

      // Always navigate to waiting room lobby first
      navigate(`/student/waiting/${sessionId}`, { 
        state: { name: formData.name, usn: formData.usn, roomCode: formData.roomCode, roomId: response.data.roomId } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join test room. Please check room code.');
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

      {/* Ambient Shading Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-[#111111]/30 pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10 my-8">
        
        {/* Header Section */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex p-3 rounded-xl bg-white/90 border border-white text-[#0E52FF] shadow-2xl shadow-[#0E52FF]/30 backdrop-blur-md">
            <Sparkles className="w-8 h-8 text-[#0E52FF] animate-pulse" />
          </div>
          
          <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl font-extrabold tracking-tight text-[#FFFFFF] drop-shadow-xl">
            Join Exam Portal
          </h1>
          
          <p className="text-base text-white/90 max-w-sm mx-auto leading-relaxed drop-shadow font-medium">
            Enter your room details to sit for the coding evaluation
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
            {/* Room Code - Clean Input Box (No Icon) */}
            <div>
              <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                Room Code
              </label>
              <input
                type="text"
                required
                value={formData.roomCode}
                onChange={(e) => setFormData({ ...formData, roomCode: e.target.value.toUpperCase() })}
                placeholder="E.G. MX7K2"
                className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] font-mono tracking-widest uppercase placeholder-[#777777] focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/20 transition-all text-base shadow-sm font-bold"
              />
            </div>

            {/* Student Name - Clean Input Box (No Icon) */}
            <div>
              <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/20 transition-all text-base font-semibold shadow-sm"
              />
            </div>

            {/* USN / Student ID - Clean Input Box (No Icon) */}
            <div>
              <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                USN / Student ID
              </label>
              <input
                type="text"
                required
                value={formData.usn}
                onChange={(e) => setFormData({ ...formData, usn: e.target.value.toUpperCase() })}
                placeholder="E.G. 1CS21CS001"
                className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] font-mono tracking-wider uppercase placeholder-[#777777] focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/20 transition-all text-base shadow-sm font-bold"
              />
            </div>

            {/* Single Solid Color Submit Button (Bolded with Monospace Font of Room Code) */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-base tracking-wider uppercase rounded-lg shadow-xl shadow-[#0E52FF]/35 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2 active:scale-[0.99]"
            >
              <span>{loading ? 'ENTERING WAITING ROOM...' : 'JOIN EXAM WAITING LOBBY'}</span>
              <ArrowRight className="w-5 h-5 ml-1" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
