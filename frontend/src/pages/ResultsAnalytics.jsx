import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import CodeEditor from '../components/CodeEditor';
import { BarChart3, Code2, Eye, Trophy, Clock, Download, Printer, Filter, CheckCircle2, AlertTriangle, FileText, X, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function ResultsAnalytics() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [roomData, setRoomData] = useState(null);

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
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerPrintReport = () => {
    window.print();
  };

  // Helper to extract or parse testResults array from submission
  const getSubmissionTestResults = (sub) => {
    if (Array.isArray(sub.testResults) && sub.testResults.length > 0) {
      return sub.testResults;
    }
    if (sub.rawOutput && (sub.rawOutput.includes('testCase') || sub.rawOutput.includes('passed'))) {
      try {
        const matches = sub.rawOutput.match(/\[.*\]/s);
        if (matches) {
          const parsed = JSON.parse(matches[0]);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
    }
    return [];
  };

  const renderTestcaseStatusBadge = (sub) => {
    const testResults = getSubmissionTestResults(sub);
    const passedCount = sub.passedCount !== undefined ? sub.passedCount : testResults.filter(t => t && t.passed).length;
    const totalCount = sub.totalCount !== undefined ? sub.totalCount : testResults.length;
    
    let verdict = sub.verdict || 'Pending';
    if (verdict === 'Accepted' && totalCount > 0 && passedCount < totalCount) {
      verdict = 'Wrong Answer';
    }

    if (verdict === 'Runtime Error') {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
          Runtime Error
        </span>
      );
    }

    if (verdict === 'Compilation Error') {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
          Compilation Error
        </span>
      );
    }

    if (verdict === 'Time Limit Exceeded') {
      return (
        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
          Time Limit Exceeded
        </span>
      );
    }

    if (totalCount > 0) {
      const is100 = passedCount === totalCount;
      return (
        <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
          is100 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
        }`}>
          {passedCount} / {totalCount} Testcases Passed {is100 ? '✓' : ''}
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
        {verdict}
      </span>
    );
  };

  // Render Pretty-Printed Individual Testcases Cards matching user screenshot
  const renderPrettyTestcaseResultsList = (sub) => {
    const testResults = getSubmissionTestResults(sub);
    const passedCount = testResults.filter(t => t && t.passed).length;
    const totalCount = testResults.length;
    
    let verdict = sub.verdict || 'Wrong Answer';
    if (verdict === 'Accepted' && totalCount > 0 && passedCount < totalCount) {
      verdict = 'Wrong Answer';
    }
    const isAccepted = verdict === 'Accepted' && passedCount === totalCount && totalCount > 0;

    if (testResults.length > 0) {
      return (
        <div className="space-y-3 font-mono">
          {/* Header Pill matching screenshot */}
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
              Testcase
            </span>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
              isAccepted 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              Test Result ({verdict}) • {passedCount}/{totalCount} Passed
            </span>
          </div>

          {/* List of Individual Testcase Cards matching user screenshot */}
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {testResults.map((tc, idx) => {
              // Sequential 1-based index numbering: Testcase 1, Testcase 2, etc.
              const indexNum = idx + 1;
              const passed = Boolean(tc.passed);
              const errorMsg = tc.error || '';
              const runtimeVal = tc.runtimeMs !== undefined ? tc.runtimeMs : (tc.runtime !== undefined ? tc.runtime : 0);
              const inputVal = tc.input !== undefined ? (typeof tc.input === 'object' ? JSON.stringify(tc.input) : String(tc.input)) : '';
              const expectedVal = tc.expected !== undefined ? String(tc.expected) : (tc.expectedOutput !== undefined ? String(tc.expectedOutput) : '');
              const actualVal = tc.output !== undefined ? String(tc.output) : (tc.actualOutput !== undefined ? String(tc.actualOutput) : '');

              return (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                    passed 
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950' 
                      : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center space-x-2">
                      {passed ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-bold border border-emerald-300">
                          ✓
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center text-[10px] font-bold border border-rose-300">
                          ✕
                        </span>
                      )}
                      <span className="text-[#111111] text-sm font-extrabold">Testcase {indexNum}</span>
                    </div>
                    <span className="text-[#555555] font-mono text-[11px] font-bold">{runtimeVal}ms</span>
                  </div>

                  {/* Testcase Input & Output Details for ALL Testcases */}
                  <div className="mt-2 pl-7 space-y-2 text-[11px] font-mono">
                    {/* Error Message if failed */}
                    {!passed && errorMsg && (
                      <div className="text-rose-700 font-bold bg-rose-100/80 p-2 rounded border border-rose-200 whitespace-pre-wrap mb-1">
                        Console / Runtime Error: '{errorMsg}'
                      </div>
                    )}

                    {inputVal && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase">Input:</div>
                        <pre className="font-mono text-xs whitespace-pre-wrap bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-white mt-0.5 select-text">
                          {inputVal.replace(/\\n/g, '\n')}
                        </pre>
                      </div>
                    )}

                    {expectedVal && (
                      <div>
                        <div className="text-[10px] font-bold text-emerald-800 uppercase">Expected:</div>
                        <pre className="font-mono text-xs whitespace-pre-wrap bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-emerald-400 font-bold mt-0.5 select-text">
                          {expectedVal.replace(/\\n/g, '\n')}
                        </pre>
                      </div>
                    )}

                    {actualVal && (
                      <div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase">Actual Output:</div>
                        <pre className={`font-mono text-xs whitespace-pre-wrap bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-bold mt-0.5 select-text ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {actualVal.replace(/\\n/g, '\n')}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raw Console Output Log if present */}
          {sub.rawOutput && !sub.rawOutput.includes('__RESULTS__') && (
            <div className="pt-2">
              <div className="text-[#555555] font-bold uppercase text-[10px] mb-1">Raw Console Output & Log:</div>
              <pre className="p-2.5 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg max-h-28 overflow-y-auto whitespace-pre-wrap">
                {sub.rawOutput}
              </pre>
            </div>
          )}
        </div>
      );
    }

    // Fallback for Raw Error / Output
    return (
      <div className="space-y-1.5 font-mono text-xs">
        <div className="text-[#555555] font-bold uppercase text-[11px]">Raw Console Output & Log:</div>
        <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-xs rounded-lg max-h-36 overflow-y-auto whitespace-pre-wrap">
          {sub.rawOutput || 'Execution completed.'}
        </pre>
      </div>
    );
  };

  if (loading || !roomData) {
    return <div className="max-w-7xl mx-auto px-4 py-8 text-[#111111] font-semibold">Loading exam results...</div>;
  }

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10 print:max-w-none print:p-0 print:m-0">
        
        {/* Clean Back Button directly below top navbar on left side */}
        <div className="flex items-center justify-between print:hidden">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-white/95 hover:bg-white text-[#111111] hover:text-[#0E52FF] border border-white/80 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-2 shadow-md transition-all active:scale-[0.98]"
            title="Go Back to Previous Page"
          >
            <ArrowLeft className="w-4 h-4 text-[#0E52FF]" />
            <span>Back</span>
          </button>
        </div>

        {/* Header Banner (Hidden when printing) */}
        <div className="relative rounded-xl p-8 bg-white/35 backdrop-blur-xl border border-white/70 shadow-[0_25px_60px_rgba(0,0,0,0.25)] text-[#111111] flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="inline-flex p-2.5 rounded-lg bg-white/95 text-[#0E52FF] shadow-sm border border-white">
                <BarChart3 className="w-6 h-6 text-[#0E52FF]" />
              </div>
              <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight">
                Exam Submissions & Testcase Results
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

        {/* Submissions Log Table in Cream Glass Card */}
        <div className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] space-y-4 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0E52FF]" />
              <span>Candidate Submissions & Testcase Results Log</span>
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
                  <th className="p-3">Real Testcase Results</th>
                  <th className="p-3">Runtime</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white font-medium">
                {submissions.map((sub) => {
                  const testResults = getSubmissionTestResults(sub);
                  const passedCount = sub.passedCount !== undefined ? sub.passedCount : testResults.filter(t => t && t.passed).length;
                  const totalCount = sub.totalCount !== undefined ? sub.totalCount : testResults.length;
                  let displayVerdict = sub.verdict || 'Pending';
                  if (displayVerdict === 'Accepted' && totalCount > 0 && passedCount < totalCount) {
                    displayVerdict = 'Wrong Answer';
                  }

                  return (
                    <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-[#111111]">{sub.studentName}</td>
                      <td className="p-3 font-mono text-[#0E52FF] font-bold">{sub.usn}</td>
                      <td className="p-3 font-semibold">{sub.questionTitle}</td>
                      <td className="p-3 uppercase font-mono text-[#555555] font-bold">{sub.language}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold uppercase ${
                          displayVerdict === 'Accepted' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          displayVerdict === 'Wrong Answer' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {displayVerdict}
                        </span>
                      </td>
                      <td className="p-3">
                        {renderTestcaseStatusBadge(sub)}
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

        {/* View Code & Pretty-Printed Testcase Modal (Hidden when printing) */}
        {viewCodeModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-xl max-w-3xl w-full border border-white shadow-2xl flex flex-col max-h-[85vh] text-[#111111]">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">
                    {viewCodeModal.studentName} ({viewCodeModal.usn})
                  </h3>
                  <p className="text-xs text-[#555555] font-mono mt-0.5">
                    Problem: <strong className="text-[#111111]">{viewCodeModal.questionTitle}</strong> • Language: <strong className="uppercase text-[#0E52FF]">{viewCodeModal.language}</strong> • Verdict: <strong className="text-rose-700 font-bold">{viewCodeModal.verdict}</strong>
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
              <div className="flex-1 overflow-hidden h-52 rounded-lg border border-slate-200">
                <CodeEditor
                  value={viewCodeModal.code}
                  language={viewCodeModal.language}
                  readOnly={true}
                />
              </div>

              {/* Pretty-Printed Testcases List matching User Screenshot */}
              <div className="mt-3 pt-3 border-t border-slate-200">
                {renderPrettyTestcaseResultsList(viewCodeModal)}
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
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#111111]">Candidate Testcase Results Breakdown</h3>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 uppercase font-mono font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 border-r border-slate-300">Candidate Name</th>
                      <th className="p-2.5 border-r border-slate-300">USN</th>
                      <th className="p-2.5 border-r border-slate-300">Question</th>
                      <th className="p-2.5 border-r border-slate-300">Language</th>
                      <th className="p-2.5 border-r border-slate-300">Verdict</th>
                      <th className="p-2.5">Testcase Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {submissions.map((sub) => (
                      <tr key={sub._id}>
                        <td className="p-2.5 font-bold border-r border-slate-200">{sub.studentName}</td>
                        <td className="p-2.5 border-r border-slate-200 text-[#0E52FF]">{sub.usn}</td>
                        <td className="p-2.5 border-r border-slate-200">{sub.questionTitle}</td>
                        <td className="p-2.5 uppercase border-r border-slate-200">{sub.language}</td>
                        <td className="p-2.5 border-r border-slate-200 font-bold">{sub.verdict}</td>
                        <td className="p-2.5 font-bold">{renderTestcaseStatusBadge(sub)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pretty-Printed Candidate Solution & Individual Testcases Log matching User Screenshot */}
              <div className="space-y-6 pt-4 border-t border-slate-200">
                <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-[#111111]">Pretty-Printed Code & Individual Testcases Log</h3>
                {submissions.map((sub, idx) => (
                  <div key={sub._id} className="p-5 rounded-lg border border-slate-300 bg-slate-50 space-y-4 font-mono text-xs page-break-inside-avoid">
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
                      <div className="text-[10px] font-bold text-[#555555] uppercase mb-2">Individual Testcases Execution Details:</div>
                      {renderPrettyTestcaseResultsList(sub)}
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
