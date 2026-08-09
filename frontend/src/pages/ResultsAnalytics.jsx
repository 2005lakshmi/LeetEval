import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GradFlow } from 'gradflow';
import CodeEditor from '../components/CodeEditor';
import { BarChart3, Code2, Eye, Trophy, Clock, Download, Printer, Filter, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';

export default function ResultsAnalytics() {
  const { roomId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState('');
  const [chartData, setChartData] = useState([]);
  const [filter100PercentOnly, setFilter100PercentOnly] = useState(false);

  const [viewCodeModal, setViewCodeModal] = useState(null);
  const [showPrintReportModal, setShowPrintReportModal] = useState(false);
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

  const handleTriggerPrintReport = () => {
    window.print();
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs shadow-xl space-y-1 text-[#111111] font-mono">
          <div className="font-bold text-[#111111]">{data.studentName} ({data.usn})</div>
          <div className="text-[#0E52FF] font-bold">Passed Testcases: {data.passedCount} / {data.totalCount}</div>
          <div className="text-[#555555]">Verdict: {data.verdict}</div>
          <div className="text-[#555555]">Language: {data.language}</div>
        </div>
      );
    }
    return null;
  };

  if (loading || !roomData) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-[#111111] font-semibold">Loading analytics & results...</div>;
  }

  const questions = roomData.paperId?.questionIds || [];
  
  // Filter bar chart for 100% testcase completers if toggle active
  const displayedChartData = filter100PercentOnly
    ? chartData.filter((sub) => sub.passedCount > 0 && sub.passedCount === sub.totalCount)
    : chartData;

  return (
    <div className="min-h-screen bg-[#111111] text-[#FFFFFF] font-['Source_Sans_3',sans-serif] relative overflow-hidden select-none pb-12 print:bg-white print:text-black">
      
      {/* Native GradFlow Animated Canvas Background (Hidden when printing) */}
      <div className="print:hidden">
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
        <div className="fixed inset-0 bg-gradient-to-t from-[#111111]/40 via-transparent to-[#111111]/30 pointer-events-none z-0" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10 print:max-w-none print:p-0 print:m-0">
        
        {/* Header Banner (Hidden when printing) */}
        <div className="relative rounded-xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="inline-flex p-2.5 rounded-lg bg-white/95 text-[#0E52FF] shadow-sm border border-white">
                <BarChart3 className="w-6 h-6 text-[#0E52FF]" />
              </div>
              <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
                Results & Testcases Performance Analytics
              </h1>
            </div>
            <p className="text-sm text-[#111111] font-semibold leading-relaxed max-w-3xl">
              Exam Room: <strong className="text-[#0E52FF] font-mono">{roomData.roomCode}</strong> • Paper: <strong className="text-[#111111]">{roomData.paperId?.title}</strong>
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center space-x-3">
            <button
              onClick={() => setShowPrintReportModal(true)}
              className="px-5 py-2.5 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-xl shadow-[#0E52FF]/30 flex items-center space-x-2 transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4 text-white" />
              <span>DOWNLOAD / PRINT FULL REPORT</span>
            </button>
          </div>
        </div>

        {/* Real Testcases Passed Bar Chart */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-6 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-600" />
                <span>Candidate Passed Testcases Chart</span>
              </h2>
              <p className="text-xs text-[#555555] font-semibold mt-0.5">
                Bar chart displays the exact number of passed testcases per candidate for the selected problem.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setFilter100PercentOnly(!filter100PercentOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all shadow-sm border ${
                  filter100PercentOnly
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-white text-[#313131] border-slate-200'
                }`}
              >
                {filter100PercentOnly ? 'Showing 100% Passed Only ✓' : 'Filter 100% Passed Candidates'}
              </button>

              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                {questions.map((q) => (
                  <button
                    key={q._id}
                    onClick={() => handleSelectQuestion(q._id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all shadow-sm ${
                      selectedQuestionId === q._id
                        ? 'bg-[#0E52FF] text-white'
                        : 'bg-white text-[#313131] border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {q.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="h-72 w-full pt-4 bg-white/80 p-4 rounded-lg border border-slate-100 shadow-inner">
            {displayedChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#555555] font-mono font-semibold">
                No submissions recorded yet for this question.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="studentName" stroke="#334155" fontSize={11} fontWeight="bold" />
                  <YAxis stroke="#334155" fontSize={11} allowDecimals={false} label={{ value: 'Passed Testcases', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '11px', fontWeight: 'bold', fill: '#334155' } }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="passedCount" fill="#0E52FF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Submissions Log Table in Cream Glass Card */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0E52FF]" />
              <span>Raw Candidate Submissions & Testcase Results Log</span>
            </h2>
            <span className="text-xs font-mono font-bold text-[#555555]">Total Submissions: {submissions.length}</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs text-[#111111]">
              <thead className="bg-[#FAF8F5] text-[#111111] uppercase font-mono font-extrabold border-b border-slate-200">
                <tr>
                  <th className="p-3">Candidate Name</th>
                  <th className="p-3">USN</th>
                  <th className="p-3">Question</th>
                  <th className="p-3">Language</th>
                  <th className="p-3">Verdict</th>
                  <th className="p-3">Real Testcases Passed</th>
                  <th className="p-3">Runtime</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {submissions.map((sub) => {
                  const passedCount = sub.passedCount !== undefined ? sub.passedCount : (Array.isArray(sub.testResults) ? sub.testResults.filter(t => t && t.passed).length : 0);
                  const totalCount = sub.totalCount !== undefined ? sub.totalCount : (Array.isArray(sub.testResults) ? sub.testResults.length : 0);
                  const is100Percent = passedCount > 0 && passedCount === totalCount;

                  return (
                    <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-[#111111]">{sub.studentName}</td>
                      <td className="p-3 font-mono text-[#0E52FF] font-bold">{sub.usn}</td>
                      <td className="p-3 font-semibold">{sub.questionTitle}</td>
                      <td className="p-3 uppercase font-mono text-[#555555] font-bold">{sub.language}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold uppercase ${
                          is100Percent ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          sub.verdict === 'Wrong Answer' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {sub.verdict}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          is100Percent ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          passedCount > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {passedCount} / {totalCount} Passed {is100Percent ? '✓' : ''}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#111111]">{sub.totalRuntimeMs} ms</td>
                      <td className="p-3">
                        <button
                          onClick={() => setViewCodeModal(sub)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-[#0E52FF] border border-[#0E52FF]/30 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0E52FF]" />
                          <span>View Code</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* View Code & Console Output Modal (Hidden when printing) */}
        {viewCodeModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-xl max-w-3xl w-full border border-white shadow-2xl flex flex-col max-h-[85vh] text-[#111111]">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">
                    {viewCodeModal.studentName} ({viewCodeModal.usn})
                  </h3>
                  <p className="text-xs text-[#555555] font-mono mt-0.5">
                    Problem: <strong className="text-[#111111]">{viewCodeModal.questionTitle}</strong> • Language: <strong className="uppercase text-[#0E52FF]">{viewCodeModal.language}</strong> • Verdict: <strong className="text-emerald-700">{viewCodeModal.verdict}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setViewCodeModal(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Code Editor Preview */}
              <div className="flex-1 overflow-hidden h-64 rounded-lg border border-slate-200">
                <CodeEditor
                  value={viewCodeModal.code}
                  language={viewCodeModal.language}
                  readOnly={true}
                />
              </div>

              {/* Console Raw Output */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="text-xs font-mono font-bold uppercase text-[#555555] mb-1">Raw Console Output & Execution Details:</div>
                <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {viewCodeModal.rawOutput || 'Execution completed with no console errors.'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* On-The-Fly Printable Exam Results Report Modal (Rendered Cleanly for Print/Download) */}
        {showPrintReportModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
            <div className="bg-white p-8 rounded-xl max-w-4xl w-full text-[#111111] shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:w-full print:p-0">
              
              {/* Report Header (Print & Screen) */}
              <div className="flex items-center justify-between border-b-2 border-[#111111] pb-4">
                <div>
                  <div className="text-xs font-mono font-bold text-[#0E52FF] uppercase tracking-wider">OFFICIAL EXAM ASSESSMENT REPORT</div>
                  <h1 className="font-['Playfair_Display',serif] text-3xl font-extrabold text-[#111111]">
                    {roomData.paperId?.title || 'Exam Assessment Report'}
                  </h1>
                  <p className="text-xs font-mono text-[#555555] mt-1">
                    Room Code: <strong>{roomData.roomCode}</strong> • Report Date: <strong>{new Date().toLocaleDateString()}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2 print:hidden">
                  <button
                    onClick={handleTriggerPrintReport}
                    className="px-4 py-2 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center space-x-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>PRINT / SAVE AS PDF</span>
                  </button>
                  <button
                    onClick={() => setShowPrintReportModal(false)}
                    className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Candidates Summary Table */}
              <div className="space-y-2">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#111111]">Candidate Raw Testcase Results</h3>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 uppercase font-mono font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 border-r border-slate-300">Candidate Name</th>
                      <th className="p-2.5 border-r border-slate-300">USN</th>
                      <th className="p-2.5 border-r border-slate-300">Question</th>
                      <th className="p-2.5 border-r border-slate-300">Language</th>
                      <th className="p-2.5 border-r border-slate-300">Verdict</th>
                      <th className="p-2.5">Real Passed Testcases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {submissions.map((sub) => {
                      const passedCount = sub.passedCount !== undefined ? sub.passedCount : (Array.isArray(sub.testResults) ? sub.testResults.filter(t => t && t.passed).length : 0);
                      const totalCount = sub.totalCount !== undefined ? sub.totalCount : (Array.isArray(sub.testResults) ? sub.testResults.length : 0);
                      return (
                        <tr key={sub._id}>
                          <td className="p-2.5 font-bold border-r border-slate-200">{sub.studentName}</td>
                          <td className="p-2.5 border-r border-slate-200 text-[#0E52FF]">{sub.usn}</td>
                          <td className="p-2.5 border-r border-slate-200">{sub.questionTitle}</td>
                          <td className="p-2.5 uppercase border-r border-slate-200">{sub.language}</td>
                          <td className="p-2.5 border-r border-slate-200 font-bold">{sub.verdict}</td>
                          <td className="p-2.5 font-bold">{passedCount} / {totalCount} Passed</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pretty-Printed Candidate Solution & Console Output Log */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#111111]">Pretty-Printed Code & Console Execution Log</h3>
                {submissions.map((sub, idx) => (
                  <div key={sub._id} className="p-4 rounded-lg border border-slate-300 bg-slate-50 space-y-2 font-mono text-xs page-break-inside-avoid">
                    <div className="flex justify-between items-center font-bold border-b border-slate-200 pb-2">
                      <span>{idx + 1}. Candidate: {sub.studentName} ({sub.usn})</span>
                      <span className="text-[#0E52FF]">{sub.questionTitle} [{sub.language.toUpperCase()}]</span>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#555555] uppercase mb-1">Submitted Source Code:</div>
                      <pre className="p-3 bg-[#111111] text-white font-mono text-xs rounded-lg overflow-x-auto whitespace-pre">
                        {sub.code}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-[#555555] uppercase mb-1">Console Output Log:</div>
                      <pre className="p-2.5 bg-slate-200 text-slate-900 font-mono text-xs rounded border border-slate-300">
                        {sub.rawOutput || 'Program executed cleanly.'}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
