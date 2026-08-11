import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { GradFlow } from 'gradflow';
import { Monitor, UserCheck, ShieldAlert, AlertTriangle, RefreshCw, BarChart3, UserX, RotateCcw, Clock, StopCircle, LogOut, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function LiveMonitor() {
  const { roomId } = useParams();
  const navigate = useNavigate();
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
    return <div className="max-w-7xl mx-auto px-4 py-8 text-[#111111] font-semibold">Loading live monitor...</div>;
  }

  const isExamEnded = roomData.status === 'ended' || roomData.status === 'completed' || roomData.status === 'closed';
  const waitingList = students.filter((s) => s.status === 'waiting');
  const activeList = students.filter((s) => s.status !== 'waiting');

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] relative overflow-hidden select-none pb-12">
      
      {/* Native GradFlow Animated Canvas Background matching Faculty/Admin Theme */}
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 mt-4 space-y-8 relative z-10">
        
        {/* Top Banner in Luminous Light Glass Card */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            {/* End Session for All / Exam Ended Status */}
            {isExamEnded ? (
              <div className="px-4 py-2 bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 shadow-sm cursor-not-allowed">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Exam Session Ended</span>
              </div>
            ) : (
              <button
                onClick={handleEndAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-md flex items-center space-x-2 transition-all active:scale-[0.99]"
                title="End session for all students immediately"
              >
                <StopCircle className="w-4 h-4 fill-white text-rose-600" />
                <span>End Session for All</span>
              </button>
            )}

            <Link
              to={`/admin/analytics/${roomId}`}
              className="px-4 py-2 bg-[#0E52FF] hover:bg-[#0642d9] text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 transition-all shadow-md active:scale-[0.99]"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Results & Charts</span>
            </Link>
          </div>
        </div>

        {/* Waiting Lobby Queue in Light Glass Card */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-700" />
              <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">
                Waiting Room Lobby ({waitingList.length})
              </h2>
            </div>
            {waitingList.length > 0 && !isExamEnded && (
              <button
                onClick={() => handleAdmit([])}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                <span>Admit All Students</span>
              </button>
            )}
          </div>

          {waitingList.length === 0 ? (
            <div className="p-3 bg-white/80 rounded-lg border border-slate-200 text-xs text-[#555555] font-semibold">
              No students currently in the waiting lobby.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {waitingList.map((s) => (
                <div key={s._id} className="p-3.5 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-[#111111]">{s.name}</div>
                    <div className="text-xs font-mono text-[#0E52FF] font-bold">{s.usn}</div>
                  </div>
                  {!isExamEnded && (
                    <button
                      onClick={() => handleAdmit([s._id])}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-sm transition-all"
                    >
                      Admit
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Exam Students Grid */}
        <div className="space-y-4">
          <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[#0E52FF]" />
            <span>Active Students & Exam Status ({activeList.length})</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeList.map((s) => {
              const isKicked = s.status === 'kicked' || 
                (roomData.warningLimit !== undefined && s.warningCount > roomData.warningLimit) || 
                (roomData.tabSwitchLimit !== undefined && (s.tabSwitchCount || 0) > roomData.tabSwitchLimit);

              return (
                <div key={s._id} className={`relative rounded-xl p-5 backdrop-blur-xl border shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4 transition-all ${
                  isKicked ? 'bg-rose-50/95 border-rose-300 ring-2 ring-rose-500/40' : 'bg-white/90 border-white/80'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#111111] text-base">{s.name}</div>
                      <div className="text-xs font-mono text-[#0E52FF] font-bold">{s.usn}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-extrabold uppercase tracking-wide ${
                      isKicked ? 'bg-rose-600 text-white border border-rose-700 shadow-sm animate-pulse' :
                      s.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      s.status === 'auto-submitted' || s.status === 'submitted' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' :
                      'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {isKicked ? 'SUSPENDED / AUTO-KICKED' : s.status}
                    </span>
                  </div>

                  {isKicked && (
                    <div className="p-2.5 rounded-lg bg-rose-600/10 border border-rose-500/30 text-rose-900 text-xs font-bold font-mono flex items-center space-x-1.5 shadow-xs">
                      <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>Student Automatically Suspended (Limits Exceeded)</span>
                    </div>
                  )}

                {/* Warning & Tab Switch Counters */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200 shadow-sm flex items-center justify-between">
                    <span className="text-[#555555] flex items-center gap-1 text-[11px] font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#C51F02]" /> Warnings:
                    </span>
                    <span className={`font-extrabold ${s.warningCount > 0 ? 'text-[#C51F02]' : 'text-[#111111]'}`}>
                      {s.warningCount} / {roomData.warningLimit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200 shadow-sm flex items-center justify-between">
                    <span className="text-[#555555] flex items-center gap-1 text-[11px] font-bold">
                      <RefreshCw className="w-3.5 h-3.5 text-amber-700" /> Switches:
                    </span>
                    <span className={`font-extrabold ${s.tabSwitchCount > 0 ? 'text-amber-700' : 'text-[#111111]'}`}>
                      {s.tabSwitchCount || 0}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenReopenModal(s)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#0E52FF] border border-[#0E52FF]/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1 transition-all shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#0E52FF]" />
                      <span>Reopen / Override</span>
                    </button>

                    {['active', 'admitted'].includes(s.status) && !isExamEnded && (
                      <button
                        onClick={() => handleEndStudent(s._id, s.usn)}
                        className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1 transition-all"
                        title="End Exam Session for this Student"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>End</span>
                      </button>
                    )}
                  </div>

                  {!isExamEnded && (
                    <button
                      onClick={() => handleKick(s._id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                      title="Force Exit Student (Kick)"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Mandatory Audit Reopen Modal */}
        {showReopenModal && targetStudent && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-xl p-7 rounded-xl max-w-md w-full border border-white shadow-2xl space-y-4 text-[#111111]">
              <h2 className="font-['Playfair_Display',serif] text-2xl font-extrabold text-[#111111]">
                Reopen Student Session
              </h2>
              <p className="text-xs text-[#313131] font-semibold">
                Reopening session for <strong className="text-[#0E52FF]">{targetStudent.name}</strong> ({targetStudent.usn}). Reason is logged to audit trail.
              </p>

              <form onSubmit={handleSubmitReopen} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-1">
                    Audit Reason (Mandatory)
                  </label>
                  <textarea
                    rows="3"
                    required
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    placeholder="e.g. System crash / Power failure / Approved extra time..."
                    className="w-full bg-white border border-[#E5E0D8] rounded-lg p-3 text-xs text-[#111111] font-mono font-bold focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-1">
                    Extra Time Allowed (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={extraMinutes}
                    onChange={(e) => setExtraMinutes(e.target.value)}
                    className="w-full bg-white border border-[#E5E0D8] rounded-lg p-3 text-xs text-[#111111] font-mono font-bold focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowReopenModal(false)}
                    className="px-4 py-2 bg-slate-100 text-[#313131] text-xs font-mono font-bold rounded-lg hover:bg-slate-200 uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0E52FF] hover:bg-[#0642d9] text-white text-xs font-mono font-bold rounded-lg shadow-md uppercase tracking-wider"
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
