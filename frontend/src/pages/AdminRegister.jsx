import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AdminRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/register', formData);
      setSuccessMsg(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration request failed.');
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
          <h1 className="font-['Playfair_Display',serif] text-4xl sm:text-5xl font-extrabold tracking-tight text-[#FFFFFF] drop-shadow-xl">
            Faculty Registration
          </h1>
          
          <p className="text-base text-white/90 max-w-sm mx-auto leading-relaxed drop-shadow font-medium">
            Request an administrator account (pending Master approval)
          </p>
        </div>

        {/* Highly Transparent Cream Glassmorphism Form Card */}
        <div className="relative rounded-xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.25)] text-[#111111] overflow-hidden">
          
          {successMsg ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
              <h3 className="text-xl font-extrabold text-[#111111]">Registration Submitted!</h3>
              <p className="text-sm font-semibold text-[#111111]/90 leading-relaxed">{successMsg}</p>
              <Link
                to="/admin/login"
                className="w-full py-4 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-base tracking-wider uppercase rounded-lg shadow-xl shadow-[#0E52FF]/35 flex items-center justify-center space-x-2 transition-all mt-4 active:scale-[0.99]"
              >
                <span>BACK TO LOGIN</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-900 text-sm flex items-center space-x-3 backdrop-blur-md">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 text-rose-700" />
                  <span className="font-bold">{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Prof. Alan Turing"
                  className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/20 transition-all text-base shadow-sm font-semibold"
                />
              </div>

              {/* Institutional Email */}
              <div>
                <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                  Institutional Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="faculty@university.edu"
                  className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/20 transition-all text-base shadow-sm font-semibold"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-extrabold text-[#111111] uppercase tracking-wider mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 bg-white/90 border border-[#E5E0D8] rounded-lg text-[#111111] placeholder-[#777777] focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/20 transition-all text-base shadow-sm font-semibold"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-base tracking-wider uppercase rounded-lg shadow-xl shadow-[#0E52FF]/35 flex items-center justify-center space-x-2 transition-all disabled:opacity-50 mt-2 active:scale-[0.99]"
              >
                <span>{loading ? 'SUBMITTING...' : 'SUBMIT FACULTY REGISTRATION'}</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </button>

              
              <div className="text-center text-xs font-bold text-[#111111] mt-6"> 
                Already registered?{' '} 
                <Link to="/admin/login" className="text-[#0E52FF] font-extrabold underline hover:text-[#0642d9]"> Log in </Link> 
                <br /> 
                <i>Drop a message to{' '}
                  <a 
                    href="https://wa.me." 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[#0E52FF] hover:text-[#0642d9] underline transition-colors font-extrabold"
                  >
                    8310664557
                  </a>
                </i> 
              </div>

              {/* <div className="text-center text-xs font-bold text-[#111111] mt-6">
                Already registered?{' '}
                <Link to="/admin/login" className="text-[#0E52FF] font-extrabold underline hover:text-[#0642d9]">
                  Log in
                </Link>
<<<<<<< HEAD
                <br />
                <span className="mt-2 block italic text-[#444444]">
                  Drop a message to{' '}
                  <a
                    href="https://wa.me/918310664557"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0E52FF] hover:text-[#0642d9] underline transition-colors font-extrabold"
                  >
                    8310664557
                  </a>
                </span>
=======
                br
                <i>Drop a message to 8310664557</i>
>>>>>>> c8ef366ca014f93cfc8cf8ed9bd26373075d9e56
              </div>
            </form>
          )}
        </div> */}

      </div>
    </div>
  );
}
