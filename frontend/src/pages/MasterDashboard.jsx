import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { ShieldCheck, Users, Database, Activity, UserCheck, UserX, AlertCircle, FileText, CheckCircle2, Edit, Key, Cpu, Radio, Sparkles, Play, RefreshCw, Gauge, Zap, Server, HardDrive, Layers, CheckSquare } from 'lucide-react';

export default function MasterDashboard() {
  const [users, setUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit User Modal State
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'faculty', status: 'approved' });

  // Interactive Concurrency & Stress Simulation State
  const [studentInputCount, setStudentInputCount] = useState(60);
  const [selectedScenario, setSelectedScenario] = useState('burst_submission');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    fetchMasterData();
    const interval = setInterval(fetchMasterData, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchMasterData = async () => {
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const [uRes, hRes, aRes] = await Promise.all([
        axios.get('/api/master/users', authHeader),
        axios.get('/api/master/health', authHeader),
        axios.get('/api/master/audit-logs', authHeader)
      ]);

      setUsers(uRes.data.users || []);
      setHealth(hRes.data);
      setAuditLogs(aRes.data.logs || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTrafficSimulation = async (e) => {
    if (e) e.preventDefault();
    setSimulating(true);
    setSimResult(null);

    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const res = await axios.post(
        '/api/master/simulate-load',
        { studentCount: studentInputCount, scenario: selectedScenario },
        authHeader
      );
      setSimResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Simulation execution failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      await axios.put(
        `/api/master/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleOpenEditUser = (user) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role || 'faculty',
      status: user.status || 'approved'
    });
  };

  const handleSaveUserCredentials = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      await axios.put(
        `/api/master/users/${editUser._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setEditUser(null);
      fetchMasterData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user credentials');
    }
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-[#111111] font-semibold">Loading Master Control Panel...</div>;
  }

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeSocketsCount = health?.activeSockets || 0;

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

      {/* Ambient Contrast Shading Overlay */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-[#111111]/30 pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Master Control Top Banner */}
        <div className="relative rounded-xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="inline-flex p-2.5 rounded-lg bg-white/95 text-[#0E52FF] shadow-sm border border-white">
                <ShieldCheck className="w-6 h-6 text-[#0E52FF]" />
              </div>
              <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
                Master Flow Regulator & Stress Simulator
              </h1>
            </div>
            <p className="text-sm text-[#111111] font-semibold leading-relaxed max-w-3xl">
              Simulate worst-case concurrent candidate traffic (code submissions, WebSocket broadcasts, RAM overhead), verify process handling metrics, and manage faculty access credentials.
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center space-x-2 px-4 py-2.5 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 font-mono font-bold text-xs uppercase tracking-wider shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>High-Concurrency Engine Ready</span>
          </div>
        </div>

        {/* Worst-Case Concurrency & Candidate Stress Simulator Form */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-[#0E52FF]" />
              <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">
                Candidate Load & Worst-Case Execution Simulator
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-[#555555]">Simulate candidate traffic before live exam launch</span>
          </div>

          <form onSubmit={handleRunTrafficSimulation} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                Simulated Candidate Count (N)
              </label>
              <input
                type="number"
                min="1"
                max="2000"
                required
                value={studentInputCount}
                onChange={(e) => setStudentInputCount(e.target.value)}
                placeholder="e.g. 60"
                className="w-full px-4 py-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-sm focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#111111] uppercase tracking-wider mb-2">
                Worst-Case Traffic Burst Scenario
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
              >
                <option value="burst_submission">100% Simultaneous Code Submissions (Execution Load)</option>
                <option value="burst_warning">100% Simultaneous Fullscreen Exits & Warning Alerts</option>
                <option value="burst_join">100% Simultaneous Room Join & Socket Handshake</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="py-3 px-6 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-xl shadow-[#0E52FF]/30 flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {simulating ? (
                <>
                  <RefreshCw className="w-4 h-4 text-white animate-spin" />
                  <span>SIMULATING WORST-CASE LOAD...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span>RUN WORST-CASE CONCURRENCY SIMULATION</span>
                </>
              )}
            </button>
          </form>

          {/* Simulation Output Telemetry Cards */}
          {simResult && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className={`p-4 rounded-lg border font-mono text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm ${
                simResult.isCrashProof 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                  : 'bg-amber-100 border-amber-300 text-amber-900'
              }`}>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm uppercase">Server Resilience Verdict: {simResult.verdict}</span>
                    <p className="text-xs text-emerald-800 font-sans font-semibold mt-0.5">{simResult.recommendations}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white rounded border border-emerald-300 text-xs font-bold text-emerald-900 text-center">
                  Simulated Candidates: {simResult.studentCount}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="p-4 rounded-lg bg-white border border-slate-200 text-[#111111] space-y-1 shadow-sm font-mono">
                  <div className="text-[10px] font-bold text-[#555555] uppercase">Total Code Execution Time</div>
                  <div className="text-xl font-extrabold text-[#0E52FF]">{(simResult.metrics?.estimatedTotalExecutionMs / 1000).toFixed(2)} sec</div>
                  <div className="text-[10px] text-[#313131] font-semibold">{simResult.metrics?.avgQueueTimePerStudentMs}ms avg queue / candidate</div>
                </div>

                <div className="p-4 rounded-lg bg-white border border-slate-200 text-[#111111] space-y-1 shadow-sm font-mono">
                  <div className="text-[10px] font-bold text-[#555555] uppercase">RAM Allocation vs Free Cap</div>
                  <div className="text-xl font-extrabold text-purple-700">{simResult.metrics?.totalRamRequiredMb} MB RAM</div>
                  <div className="text-[10px] text-[#313131] font-semibold">Heap: {simResult.metrics?.currentHeapUsedMb}MB / Cap: {simResult.metrics?.freeTierRamCapMb}MB</div>
                </div>

                <div className="p-4 rounded-lg bg-white border border-slate-200 text-[#111111] space-y-1 shadow-sm font-mono">
                  <div className="text-[10px] font-bold text-[#555555] uppercase">WebSocket Packet Rate</div>
                  <div className="text-xl font-extrabold text-emerald-700">{simResult.metrics?.packetsPerSec} Packets/sec</div>
                  <div className="text-[10px] text-[#313131] font-semibold">{simResult.metrics?.bandwidthKbps} KB/sec Broadcast Overhead</div>
                </div>

                <div className="p-4 rounded-lg bg-white border border-slate-200 text-[#111111] space-y-1 shadow-sm font-mono">
                  <div className="text-[10px] font-bold text-[#555555] uppercase">Atlas M0 DB Free Buffer</div>
                  <div className="text-xl font-extrabold text-amber-800">{simResult.metrics?.remainingDbMb} MB Free</div>
                  <div className="text-[10px] text-[#313131] font-semibold">Used: {simResult.metrics?.currentDbMb}MB (+{simResult.metrics?.estNewDbMb}MB)</div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Measuring Mechanisms & System Flow Telemetry Grid */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#313131]">Socket Stream Flow</span>
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-700"><Radio className="w-5 h-5 animate-pulse" /></div>
              </div>
              <div>
                <div className="font-mono text-3xl font-extrabold text-[#111111] tracking-tight">{activeSocketsCount} Streams</div>
                <div className="text-xs text-emerald-700 font-bold mt-1">Live active WebSocket clients</div>
              </div>
            </div>

            <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#313131]">Queue Rate Regulator</span>
                <div className="p-2 rounded bg-purple-500/10 text-purple-700"><Cpu className="w-5 h-5" /></div>
              </div>
              <div>
                <div className="font-mono text-3xl font-extrabold text-[#111111] tracking-tight">{health.redisQueue?.concurrency || 2} Workers</div>
                <div className="text-xs text-purple-700 font-bold mt-1">Parallel execution channels</div>
              </div>
            </div>

            <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#313131]">Database Throughput</span>
                <div className="p-2 rounded bg-[#0E52FF]/10 text-[#0E52FF]"><Database className="w-5 h-5" /></div>
              </div>
              <div>
                <div className="font-mono text-3xl font-extrabold text-[#111111] tracking-tight">{health.database?.dataSizeMb || '0.00'} MB</div>
                <div className="text-xs text-[#0E52FF] font-bold mt-1">{health.database?.objectsCount || 0} active objects</div>
              </div>
            </div>

            <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#313131]">Engine Uptime Telemetry</span>
                <div className="p-2 rounded bg-amber-500/10 text-amber-800"><Activity className="w-5 h-5" /></div>
              </div>
              <div>
                <div className="font-mono text-3xl font-extrabold text-[#111111] tracking-tight">{Math.floor(health.system?.uptime / 60 || 0)} mins</div>
                <div className="text-xs text-amber-800 font-bold mt-1">Node {health.system?.nodeVersion} Engine</div>
              </div>
            </div>

          </div>
        )}

        {/* Pending Registrations Section */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-700" />
              <span>Pending Faculty Registrations ({pendingUsers.length})</span>
            </h2>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="p-4 bg-white/80 rounded-lg border border-slate-200 text-xs text-[#555555] font-semibold text-center">
              ✓ No pending faculty registration requests. All accounts verified!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div key={u._id} className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#111111] text-sm">{u.name}</div>
                    <div className="text-xs text-[#555555] font-mono mt-0.5">{u.email} • Registered {new Date(u.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUpdateUserStatus(u._id, 'approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-mono font-bold uppercase tracking-wider shadow-sm flex items-center space-x-1"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Approve Account</span>
                    </button>
                    <button
                      onClick={() => handleUpdateUserStatus(u._id, 'rejected')}
                      className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registered Credentials & User Management Table */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4">
          <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0E52FF]" />
            <span>User Accounts & Faculty Credentials Management</span>
          </h2>

          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-[#111111]">
              <thead className="bg-[#FAF8F5] text-[#111111] uppercase font-mono font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-[#111111]">{u.name}</td>
                    <td className="p-3 font-mono text-[#0E52FF] font-bold">{u.email}</td>
                    <td className="p-3 capitalize font-bold">{u.role}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold uppercase ${
                        u.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        u.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleOpenEditUser(u)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-[#0E52FF] border border-[#0E52FF]/30 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm transition-all"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#0E52FF]" />
                        <span>Edit Credentials</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Audit Trail Table */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4">
          <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-700" />
            <span>Security Audit Trail & Exam Operations Log</span>
          </h2>

          <div className="overflow-x-auto max-h-72 rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-[#111111]">
              <thead className="bg-[#FAF8F5] text-[#111111] uppercase font-mono font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Actor</th>
                  <th className="p-2.5">Action</th>
                  <th className="p-2.5">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-mono text-xs">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50">
                    <td className="p-2.5 text-[#555555]">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-2.5 text-[#0E52FF] font-bold">{log.actorId?.name || log.actorType}</td>
                    <td className="p-2.5 font-extrabold text-[#111111]">{log.action}</td>
                    <td className="p-2.5 text-[#555555]">{log.targetId || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit User Credentials Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-xl p-7 rounded-xl max-w-md w-full border border-white shadow-2xl space-y-5 text-[#111111]">
              <h2 className="font-['Playfair_Display',serif] text-2xl font-extrabold text-[#111111]">
                Edit Faculty Credentials & Status
              </h2>

              <form onSubmit={handleSaveUserCredentials} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                    >
                      <option value="faculty">Faculty</option>
                      <option value="master">Master</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full p-3 bg-white border border-[#E5E0D8] rounded-lg text-[#111111] font-mono font-bold text-xs focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="px-4 py-2 bg-slate-100 text-[#313131] text-xs font-mono font-bold rounded-lg hover:bg-slate-200 uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0E52FF] hover:bg-[#0642d9] text-white text-xs font-mono font-bold rounded-lg shadow-md uppercase tracking-wider"
                  >
                    Save Changes
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
