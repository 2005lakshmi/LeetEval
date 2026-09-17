import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import FramerLiquidBackground from '../components/FramerLiquidBackground';

export default function DemoJoin() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [demoInfo, setDemoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchDemoInfo();
  }, [slug]);

  const fetchDemoInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/student/demo/${slug || 'demo'}`);
      setDemoInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load demo room details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinDemo = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setJoining(true);
    setError(null);

    try {
      const res = await axios.post(`/api/student/demo/${slug || 'demo'}/join`, { name: name.trim() });
      const { sessionId, resumeToken } = res.data;

      if (resumeToken) {
        localStorage.setItem(`leeteval_resume_${sessionId}`, resumeToken);
      }

      // Enter standard live coding exam workspace!
      navigate(`/student/exam/${sessionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enter demo test room');
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] flex items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* Framer Animated Liquid Background Component */}
      <FramerLiquidBackground />

      <div className="w-full max-w-md relative z-10 my-8">
        
        {/* Header Section */}
        <div className="text-center mb-8 space-y-3">
          <h1 className="font-['Playfair_Display',serif] text-5xl sm:text-6xl font-extrabold tracking-tight text-[#FFFFFF] drop-shadow-xl">
            LeetEval
          </h1>
        </div>

        {/* Highly Transparent Cream Glassmorphism Card */}
        <div className="relative rounded-xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.25)] text-[#111111] overflow-hidden">
          
          {loading ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-8 h-8 mx-auto rounded-full border-3 border-[#0E52FF] border-t-transparent animate-spin" />
              <p className="text-sm font-bold font-mono text-[#111111]">Loading LeetEval Assessment Portal...</p>
            </div>
          ) : error && !demoInfo ? (
            <div className="py-4 text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
              <h2 className="text-xl font-extrabold text-[#111111]">Demo Link Unavailable</h2>
              <p className="text-sm font-semibold leading-relaxed text-[#333333]">{error}</p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg transition-all active:scale-[0.99] mt-2"
              >
                Return to Homepage
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-900 text-sm flex items-center space-x-3 backdrop-blur-md font-bold">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-rose-700" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleJoinDemo} className="space-y-5 relative z-10">
                {/* Student Name Input */}
                <div>
                  <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/20 transition-all text-base font-semibold shadow-sm"
                  />
                </div>

                {/* Enter Room Submit Button */}
                <button
                  type="submit"
                  disabled={joining}
                  className="w-full py-4 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-base tracking-wider uppercase rounded-lg shadow-xl shadow-[#0E52FF]/35 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2 active:scale-[0.99]"
                >
                  <span>{joining ? 'ENTERING ROOM...' : 'ENTER ROOM & START TEST'}</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </button>
              </form>
            </>
          )}

        </div>

      </div>

      {/* Floating Bottom-Left Online Indicator Badge */}
      {demoInfo && (
        <div className="fixed bottom-4 left-4 z-20">
          <div className="px-3.5 py-1.5 rounded-lg bg-white/40 backdrop-blur-md border border-white/70 text-[#111111] font-mono text-xs font-extrabold shadow-sm flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{demoInfo?.onlineCount || 0} online</span>
          </div>
        </div>
      )}

    </div>
  );
}
