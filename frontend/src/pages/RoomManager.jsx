import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { Plus, Monitor, Play, AlertTriangle, KeyRound, ArrowRight, Lock, RefreshCw, HelpCircle, Trash2 } from 'lucide-react';

export default function RoomManager() {
  const [rooms, setRooms] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [selectedPaperId, setSelectedPaperId] = useState('');
  const [warningLimit, setWarningLimit] = useState(3);
  const [tabSwitchLimit, setTabSwitchLimit] = useState(3);
  const [timeOverride, setTimeOverride] = useState('');
  const [sequentialLock, setSequentialLock] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const [rRes, pRes] = await Promise.all([
        axios.get('/api/rooms', authHeader),
        axios.get('/api/papers', authHeader)
      ]);
      setRooms(rRes.data.rooms || []);
      setPapers(pRes.data.papers || []);
      if (pRes.data.papers?.length > 0) {
        setSelectedPaperId(pRes.data.papers[0]._id);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm('Are you sure you want to DELETE this exam room? This will clear student sessions and free up storage space.')) return;
    try {
      await axios.delete(`/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        '/api/rooms',
        {
          paperId: selectedPaperId,
          warningLimit: Number(warningLimit),
          tabSwitchLimit: Number(tabSwitchLimit),
          timeLimitMinutesOverride: timeOverride ? Number(timeOverride) : null,
          sequentialLock: Boolean(sequentialLock)
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create room');
    }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] relative overflow-hidden select-none pb-12">
      
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

      {/* Contrast Shading Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-[#111111]/30 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight drop-shadow-sm">
              Live Exam Rooms
            </h1>
            <p className="text-sm text-[#111111] mt-1 font-semibold leading-relaxed">
              Launch short-code exam rooms and access real-time invigilation control monitors
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-[#0E52FF]/30 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Launch New Exam Room</span>
          </button>
        </div>

      {loading ? (
        <div className="text-[#111111] text-sm font-semibold">Loading exam rooms...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((r) => (
            <div key={r._id} className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="w-5 h-5 text-[#0E52FF]" />
                    <span className="font-mono text-2xl font-extrabold tracking-widest text-[#0E52FF]">{r.roomCode}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                    r.status === 'live' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    r.status === 'lobby' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {r.status}
                  </span>
                </div>

                <div className="text-sm font-extrabold text-[#111111] mb-3 font-['Playfair_Display',serif]">{r.paperId?.title || 'Exam Paper'}</div>
                
                <div className="p-3.5 rounded-lg bg-white/80 border border-white text-xs text-[#111111] space-y-1.5 font-mono shadow-sm">
                  <div className="flex justify-between">
                    <span>Warning Limit:</span>
                    <strong className="text-[#C51F02]">{r.warningLimit} max</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tab Switch Limit:</span>
                    <strong className="text-[#C51F02]">{r.tabSwitchLimit || 3} max</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <strong className="text-[#0E52FF]">{r.timeLimitMinutesOverride || r.paperId?.timeLimitMinutes || 60} mins</strong>
                  </div>
                  {r.sequentialLock && (
                    <div className="text-amber-800 font-bold flex items-center gap-1 pt-1 border-t border-slate-200">
                      <Lock className="w-3 h-3 text-amber-700" /> Sequential Lock Active
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center space-x-2">
                <Link
                  to={`/admin/monitor/${r._id}`}
                  className="px-4 py-2.5 bg-[#0E52FF] hover:bg-[#0642d9] text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all flex-1 justify-center shadow-md active:scale-[0.99]"
                >
                  <Monitor className="w-4 h-4" />
                  <span>Open Live Invigilator Monitor</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <button
                  onClick={() => handleDeleteRoom(r._id)}
                  className="p-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-lg transition-all shadow-sm"
                  title="Delete Exam Room & Free Storage Space"
                >
                  <Trash2 className="w-4 h-4 text-rose-700" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Launch Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Launch Exam Room & Set Security Controls</h2>
            
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Select Exam Paper</label>
                <select
                  value={selectedPaperId}
                  onChange={(e) => setSelectedPaperId(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                >
                  {papers.map((p) => (
                    <option key={p._id} value={p._id}>{p.title} ({p.timeLimitMinutes} min)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Warning Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={warningLimit}
                    onChange={(e) => setWarningLimit(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm font-bold text-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tab Switch Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tabSwitchLimit}
                    onChange={(e) => setTabSwitchLimit(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm font-bold text-amber-400"
                  />
                </div>
              </div>

              {/* Short Descriptive Note Box */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs leading-relaxed">
                <div className="flex items-start gap-2 text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-rose-400">Security Warnings:</strong> Recorded when student attempts blocked keyboard shortcuts (F12, DevTools, Ctrl+C/V) or exits full screen mode. Exceeding this auto-submits exam.
                  </div>
                </div>

                <div className="flex items-start gap-2 text-slate-300 pt-1.5 border-t border-slate-800">
                  <RefreshCw className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-400">Tab Switch Violations:</strong> Recorded when student switches browser tabs or loses window focus. Exceeding this auto-submits exam.
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Time Limit Override (Optional, Minutes)</label>
                <input
                  type="number"
                  placeholder="Leave empty to use paper default"
                  value={timeOverride}
                  onChange={(e) => setTimeOverride(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="seqLock"
                  checked={sequentialLock}
                  onChange={(e) => setSequentialLock(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="seqLock" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Require Sequential Navigation (Lock Next Question until Current Question Submitted)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl shadow-lg"
                >
                  Generate Room Code & Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </div>
  );
}
