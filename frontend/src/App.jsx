import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import Navbar from './components/Navbar';
import StudentJoin from './pages/StudentJoin';
import StudentWaitingRoom from './pages/StudentWaitingRoom';
import StudentExam from './pages/StudentExam';

import AdminLogin from './pages/AdminLogin';
import AdminRegister from './pages/AdminRegister';
import AdminDashboard from './pages/AdminDashboard';
import QuestionBank from './pages/QuestionBank';
import PaperManager from './pages/PaperManager';
import RoomManager from './pages/RoomManager';
import LiveMonitor from './pages/LiveMonitor';
import ResultsAnalytics from './pages/ResultsAnalytics';
import MasterDashboard from './pages/MasterDashboard';

if (import.meta.env.VITE_API_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentAdmin();
  }, []);

  const checkCurrentAdmin = async () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data.user);
      } catch (err) {
        localStorage.removeItem('adminToken');
      }
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setUser(null);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400">Loading LeetEval Platform...</div>;
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      
      <Routes>
        {/* Student Entry Routes */}
        <Route path="/" element={<StudentJoin />} />
        <Route path="/student/join" element={<StudentJoin />} />
        <Route path="/student/waiting/:sessionId" element={<StudentWaitingRoom />} />
        <Route path="/student/exam/:sessionId" element={<StudentExam />} />

        {/* Faculty & Admin Auth Routes */}
        <Route path="/admin/login" element={<AdminLogin onLoginSuccess={setUser} />} />
        <Route path="/admin/register" element={<AdminRegister />} />

        {/* Protected Faculty & Admin Portal Routes */}
        <Route
          path="/admin/dashboard"
          element={user ? <AdminDashboard user={user} /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/questions"
          element={user ? <QuestionBank /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/papers"
          element={user ? <PaperManager /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/rooms"
          element={user ? <RoomManager /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/monitor/:roomId"
          element={user ? <LiveMonitor /> : <Navigate to="/admin/login" />}
        />
        <Route
          path="/admin/analytics/:roomId"
          element={user ? <ResultsAnalytics /> : <Navigate to="/admin/login" />}
        />

        {/* Protected Master Superuser Route */}
        <Route
          path="/admin/master"
          element={user && user.role === 'master' ? <MasterDashboard /> : <Navigate to="/admin/dashboard" />}
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
