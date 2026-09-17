import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { ShieldCheck, Play, Search, Eye, X, Users, AlertCircle, FileCode, CheckCircle2, Clock, Terminal } from 'lucide-react';

export default function DemoJoin() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [demoInfo, setDemoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);

  // Result Lookup State
  const [lookupSerial, setLookupSerial] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedQuestionCode, setSelectedQuestionCode] = useState(null);

  useEffect(() => {
    fetchDemoInfo();
  }, [slug]);

  const fetchDemoInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/student/demo/${slug}`);
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
      const res = await axios.post(`/api/student/demo/${slug}/join`, { name: name.trim() });
      const { sessionId, resumeToken } = res.data;

      if (resumeToken) {
        localStorage.setItem(`leeteval_resume_${sessionId}`, resumeToken);
      }

      // Directly enter standard live coding exam screen!
      navigate(`/student/exam/${sessionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to enter demo test');
      setJoining(false);
    }
  };

  const handleLookupResult = async (e) => {
    if (e) e.preventDefault();
    if (!lookupSerial.trim()) return;

    setLookingUp(true);
    setLookupError(null);
    setResultData(null);

    try {
      const res = await axios.get(`/api/student/demo/${slug}/result/${encodeURIComponent(lookupSerial.trim())}`);
      setResultData(res.data);
      setShowResultModal(true);
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Result not found for this Serial ID');
    } finally {
      setLookingUp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span>Loading Demo Assessment Portal...</span>
        </div>
      </div>
    );
  }

  if (error && !demoInfo) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#161b22] border border-rose-500/30 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Demo Link Unavailable</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-mono font-bold"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] relative flex flex-col justify-between overflow-hidden select-none">
      
      {/* Native GradFlow Background */}
      <GradFlow
        config={{
          color1: { r: 14, g: 82, b: 255 },
          color2: { r: 130, g: 220, b: 255 },
          color3: { r: 15, g: 23, b: 42 },
          speed: 0.35,
          scale: 2.5,
          type: 'animated',
          noise: 0.4
        }}
        className="fixed inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Overlay Shading */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#090d16]/80 via-transparent to-[#090d16]/60 pointer-events-none z-0" />

      {/* Main Content Area */}
      <div className="relative z-10 max-w-xl w-full mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
        
        <div className="bg-[#121826]/90 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-8 sm:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.6)] space-y-7">
          
          {/* Header & Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400 mb-1">
              <ShieldCheck className="w-8 h-8 text-[#0E52FF]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-['Playfair_Display',serif]">
              {demoInfo?.paperTitle || 'Demo Coding Exam'}
            </h1>
            <p className="text-xs font-mono text-slate-400">
              Interactive LeetEval Demo Environment • Instant Access
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Join Demo Form */}
          <form onSubmit={handleJoinDemo} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                Enter Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-3.5 bg-[#1a2234] border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-[#0E52FF] focus:ring-2 focus:ring-[#0E52FF]/30 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={joining}
              className="w-full py-4 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl shadow-xl shadow-[#0E52FF]/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {joining ? (
                <span>Entering Room...</span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Enter Room & Start Test</span>
                </>
              )}
            </button>
          </form>

          {/* View Result by Serial ID Section */}
          <div className="pt-5 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="font-bold uppercase tracking-wider">Already took test? View Result:</span>
            </div>

            <form onSubmit={handleLookupResult} className="flex space-x-2">
              <input
                type="text"
                value={lookupSerial}
                onChange={(e) => setLookupSerial(e.target.value)}
                placeholder="Enter Serial ID (e.g. 1 or #1)"
                className="flex-1 px-3 py-2 bg-[#161d2d] border border-slate-700/80 rounded-lg text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#0E52FF]"
              />
              <button
                type="submit"
                disabled={lookingUp}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 transition-all"
              >
                <Search className="w-3.5 h-3.5 text-blue-400" />
                <span>{lookingUp ? 'Finding...' : 'View Result'}</span>
              </button>
            </form>

            {lookupError && (
              <div className="text-[11px] font-mono text-rose-400 flex items-center space-x-1">
                <AlertCircle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Floating Bottom Left Online Indicator */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center space-x-2 bg-[#121826]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-bold">{demoInfo?.onlineCount || 0} online</span>
        </div>
        <div className="text-[11px] text-slate-500 hidden sm:block">
          LeetEval • Master Demo Engine
        </div>
      </div>

      {/* Student Result View Modal */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-text">
          <div className="bg-[#121826] border border-slate-700 p-6 rounded-2xl max-w-2xl w-full text-white space-y-5 max-h-[90vh] flex flex-col shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5 font-mono">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-extrabold text-white">
                  Demo Score & Exam Results
                </h3>
              </div>
              <button
                onClick={() => { setShowResultModal(false); setSelectedQuestionCode(null); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Info Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#1a2234] border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Student Name</div>
                <div className="text-sm font-extrabold text-white truncate">{resultData.name}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#1a2234] border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Assigned Serial ID</div>
                <div className="text-sm font-extrabold text-blue-400">{resultData.serialId}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#1a2234] border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Exam Status</div>
                <div className="text-sm font-extrabold text-emerald-400 capitalize">{resultData.status}</div>
              </div>
            </div>

            {/* Problem-wise breakdown */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-mono text-xs">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Problem-wise Submissions:</div>
              {resultData.questions?.map((q, idx) => (
                <div key={q.questionId || idx} className="p-3.5 rounded-xl bg-[#161d2d] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{idx + 1}. {q.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-400">{q.difficulty}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      q.verdict === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      q.verdict.includes('Error') || q.verdict.includes('Wrong') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {q.verdict}
                    </span>
                  </div>

                  {q.code ? (
                    <div>
                      <button
                        onClick={() => setSelectedQuestionCode(selectedQuestionCode === q.questionId ? null : q.questionId)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1"
                      >
                        <FileCode className="w-3.5 h-3.5 text-blue-400" />
                        <span>{selectedQuestionCode === q.questionId ? 'Hide Submitted Code' : 'View Submitted Code'}</span>
                      </button>
                      {selectedQuestionCode === q.questionId && (
                        <pre className="mt-2 p-3 bg-[#0d1117] border border-slate-800 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-48 select-text">
                          {q.code}
                        </pre>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">No code submitted for this question</div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-slate-800 pt-3">
              <button
                onClick={() => { setShowResultModal(false); setSelectedQuestionCode(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-bold rounded-lg uppercase tracking-wider"
              >
                Close Results Window
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
