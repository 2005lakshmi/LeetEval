import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { GradFlow } from 'gradflow';
import { Monitor, UserCheck, ShieldAlert, AlertTriangle, RefreshCw, BarChart3, UserX, RotateCcw, Clock, StopCircle, LogOut } from 'lucide-react';

export default function LiveMonitor() {
  const { roomId } = useParams();
  const [roomData, setRoomData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showReopenModal, setShowReopenModal] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [reopenReason, setReopenReason] = useState('');
  const [extraMinutes, setExtraMinutes] = useState(0);

  useEffect(() => {
    fetchRoomDetails();
    const interval = setInterval(fetchRoomDetails, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  useEffect(() => {
    const socket = io(window.location.origin);
    socket.emit('admin_join_room', { roomId });

    socket.on('student_waiting_update', () => fetchRoomDetails());
    socket.on('student_warning_alert', (data) => {
      setStudents((prev) =>
        prev.map((s) => {
          if (String(s._id) === String(data.sessionId)) {
            return {
              ...s,
              warningCount: data.warningCount,
              tabSwitchCount: data.tabSwitchCount,
              status: data.status || (data.isKicked ? 'kicked' : s.status)
            };
          }
          return s;
        })
      );
    });
    socket.on('student_status_changed', (data) => {
      setStudents((prev) =>
        prev.map((s) => {
          if (String(s._id) === String(data.sessionId)) {
            return {
              ...s,
              status: data.status || s.status,
              warningCount: data.warningCount !== undefined ? data.warningCount : s.warningCount,
              tabSwitchCount: data.tabSwitchCount !== undefined ? data.tabSwitchCount : s.tabSwitchCount
            };
          }
          return s;
        })
      );
    });
    socket.on('student_session_updated', () => fetchRoomDetails());

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      const res = await axios.get(`/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setRoomData(res.data.room);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error fetching room monitor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdmit = async (sessionIds = []) => {
    try {
      await axios.post(
        `/api/rooms/${roomId}/admit`,
        { sessionIds },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      fetchRoomDetails();
    } catch (err) {
      alert('Failed to admit student(s)');
    }
  };

  const handleEndAll = async () => {
    if (!confirm('Are you sure you want to END the exam session for ALL students? This will auto-submit all active exams immediately.')) return;
    try {
      await axios.post(
        `/api/rooms/${roomId}/end-all`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      fetchRoomDetails();
    } catch (err) {
      alert('Failed to end session for all students');
    }
  };

  const handleEndStudent = async (studentId, usn) => {
    if (!confirm(`Are you sure you want to END the exam session for student ${usn}? Their current code will be submitted.`)) return;
    try {
      await axios.post(
        `/api/rooms/${roomId}/end-student/${studentId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      fetchRoomDetails();
    } catch (err) {
      alert('Failed to end student session');
    }
  };

  const handleKick = async (sessionId) => {
    if (!confirm('Are you sure you want to force-exit (kick) this student?')) return;
    try {
      await axios.post(
        `/api/rooms/${roomId}/kick/${sessionId}`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      fetchRoomDetails();
    } catch (err) {
      alert('Failed to kick student');
    }
  };

  const handleOpenReopenModal = (student) => {
    setTargetStudent(student);
    setReopenReason('');
    setExtraMinutes(0);
    setShowReopenModal(true);
  };

  const handleSubmitReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      return alert('Mandatory reason string required for audit trail!');
    }

    try {
      await axios.post(
        `/api/rooms/${roomId}/reopen/${targetStudent._id}`,
        { reason: reopenReason, timeAddedMinutes: Number(extraMinutes) },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setShowReopenModal(false);
      fetchRoomDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reopen session');
    }
  };

  if (loading || !roomData) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-slate-400">Loading live monitor...</div>;
  }

  const waitingList = students.filter((s) => s.status === 'waiting');
  const activeList = students.filter((s) => s.status !== 'waiting');

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Top Banner in Cream Glass Card */}
        <div className="rounded-lg p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-[#111111] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="font-['Playfair_Display',serif] text-3xl font-extrabold text-[#111111]">Live Exam Monitor</h1>
              <span className="font-mono text-xl font-extrabold px-3 py-1 bg-[#0E52FF]/10 text-[#0E52FF] border border-[#0E52FF]/30 rounded-lg">
                {roomData.roomCode}
              </span>
            </div>
            <p className="text-xs text-[#313131] mt-1 font-semibold">
              Paper: <strong className="text-[#111111]">{roomData.paperId?.title}</strong> • Warning Limit: <strong className="text-[#C51F02]">{roomData.warningLimit}</strong> • Tab Switch Limit: <strong className="text-[#C51F02]">{roomData.tabSwitchLimit || 3}</strong>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleEndAll}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-lg flex items-center space-x-2 transition-all"
              title="End session for all students immediately"
            >
              <StopCircle className="w-4 h-4 fill-white text-rose-600" />
              <span>End Session for All</span>
            </button>

            <Link
              to={`/admin/analytics/${roomId}`}
              className="px-4 py-2 bg-[#0E52FF] hover:bg-[#0642d9] text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Results & Charts</span>
            </Link>
          </div>
        </div>

      {/* Waiting Lobby Queue */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Waiting Room Lobby ({waitingList.length})</h2>
          </div>
          {waitingList.length > 0 && (
            <button
              onClick={() => handleAdmit([])}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Admit All Students</span>
            </button>
          )}
        </div>

        {waitingList.length === 0 ? (
          <p className="text-xs text-slate-500">No students currently in the waiting lobby.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {waitingList.map((s) => (
              <div key={s._id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{s.name}</div>
                  <div className="text-xs font-mono text-indigo-400">{s.usn}</div>
                </div>
                <button
                  onClick={() => handleAdmit([s._id])}
                  className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-md text-xs font-semibold transition-colors"
                >
                  Admit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Exam Students Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Monitor className="w-5 h-5 text-indigo-400" />
          <span>Active Students & Exam Status ({activeList.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeList.map((s) => (
            <div key={s._id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{s.name}</div>
                  <div className="text-xs font-mono text-slate-400">{s.usn}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  s.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' :
                  s.status === 'auto-submitted' || s.status === 'submitted' ? 'bg-rose-500/20 text-rose-300' :
                  s.status === 'kicked' ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {s.status}
                </span>
              </div>

              {/* Warning & Tab Switch Counters */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Warnings:
                  </span>
                  <span className={`font-bold ${s.warningCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {s.warningCount} / {roomData.warningLimit}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Tab Switches:
                  </span>
                  <span className={`font-bold ${s.tabSwitchCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {s.tabSwitchCount || 0}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenReopenModal(s)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reopen / Override</span>
                  </button>

                  {['active', 'admitted'].includes(s.status) && (
                    <button
                      onClick={() => handleEndStudent(s._id, s.usn)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center space-x-1 transition-all"
                      title="End Exam Session for this Student"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>End Session</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleKick(s._id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Force Exit Student (Kick)"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mandatory Audit Reopen Modal */}
      {showReopenModal && targetStudent && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Reopen Student Session</h2>
            <p className="text-xs text-slate-400 mb-4">
              Reopening session for <strong className="text-indigo-400">{targetStudent.name}</strong> ({targetStudent.usn}). Reason is logged to audit trail.
            </p>

            <form onSubmit={handleSubmitReopen} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Audit Reason (Mandatory)</label>
                <textarea
                  rows="3"
                  required
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. System crash / Power failure / Approved extra time..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Extra Time Allowed (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={extraMinutes}
                  onChange={(e) => setExtraMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl"
                >
                  Confirm Reopen Session
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
