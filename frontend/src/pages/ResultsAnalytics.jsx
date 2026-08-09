import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CodeEditor from '../components/CodeEditor';
import { BarChart3, Code2, Eye, Trophy, Clock } from 'lucide-react';

export default function ResultsAnalytics() {
  const { roomId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [chartData, setChartData] = useState([]);
  const [viewCodeModal, setViewCodeModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [roomId]);

  const fetchAnalyticsData = async () => {
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const [rRes, sRes] = await Promise.all([
        axios.get(`/api/rooms/${roomId}`, authHeader),
        axios.get(`/api/submissions/room/${roomId}`, authHeader)
      ]);

      setRoomData(rRes.data.room);
      setSubmissions(sRes.data.submissions || []);

      const qList = rRes.data.room?.paperId?.questionIds || [];
      if (qList.length > 0) {
        setSelectedQuestionId(qList[0]._id);
        fetchChartForQuestion(qList[0]._id);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChartForQuestion = async (qId) => {
    try {
      const res = await axios.get(
        `/api/submissions/analytics/question/${qId}/room/${roomId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setChartData(res.data.chartData || []);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    }
  };

  const handleSelectQuestion = (qId) => {
    setSelectedQuestionId(qId);
    fetchChartForQuestion(qId);
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="glass-panel p-3 rounded-xl border border-slate-700 text-xs shadow-xl space-y-1">
          <div className="font-bold text-white">{data.studentName} ({data.usn})</div>
          <div className="text-indigo-400 font-mono">Runtime: {data.runtimeMs} ms</div>
          <div className="text-slate-400 capitalize">Lang: {data.language}</div>
        </div>
      );
    }
    return null;
  };

  if (loading || !roomData) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-slate-400">Loading analytics...</div>;
  }

  const questions = roomData.paperId?.questionIds || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Results & Runtime Performance Analytics</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Exam Room: <strong className="text-white font-mono">{roomData.roomCode}</strong> • Paper: <strong className="text-white">{roomData.paperId?.title}</strong>
          </p>
        </div>
      </div>

      {/* Question Filter Tabs */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Accepted Runtime Distribution (ms)</h2>
          
          <div className="flex space-x-2">
            {questions.map((q) => (
              <button
                key={q._id}
                onClick={() => handleSelectQuestion(q._id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedQuestionId === q._id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {q.title}
              </button>
            ))}
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-72 w-full pt-4">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No accepted submissions recorded yet for this question.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="studentName" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="ms" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="runtimeMs" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Submissions Data Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white">Submissions Log</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Student Name</th>
                <th className="p-3">USN</th>
                <th className="p-3">Question</th>
                <th className="p-3">Language</th>
                <th className="p-3">Verdict</th>
                <th className="p-3">Runtime</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {submissions.map((sub) => (
                <tr key={sub._id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-semibold text-white">{sub.studentName}</td>
                  <td className="p-3 font-mono text-indigo-400">{sub.usn}</td>
                  <td className="p-3">{sub.questionTitle}</td>
                  <td className="p-3 uppercase font-mono text-slate-400">{sub.language}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      sub.verdict === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {sub.verdict}
                    </span>
                  </td>
                  <td className="p-3 font-mono">{sub.totalRuntimeMs} ms</td>
                  <td className="p-3">
                    <button
                      onClick={() => setViewCodeModal(sub)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>View Code</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Code Modal */}
      {viewCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full border border-slate-800 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{viewCodeModal.studentName} ({viewCodeModal.usn})</h3>
                <p className="text-xs text-slate-400">{viewCodeModal.questionTitle} • {viewCodeModal.language}</p>
              </div>
              <button
                onClick={() => setViewCodeModal(null)}
                className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-hidden h-80">
              <CodeEditor
                value={viewCodeModal.code}
                language={viewCodeModal.language}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
