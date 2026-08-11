import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import CodeEditor from '../components/CodeEditor';
import { generateHarnessAiPrompt } from '../utils/harnessPromptGenerator';
import { Plus, CheckCircle2, XCircle, Play, ShieldAlert, Code2, Trash2, Eye, DownloadCloud, Sparkles, Pencil, X, Scissors, Check, Terminal, Maximize2, Minimize2, Save, Copy, FileText } from 'lucide-react';

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);

  // LeetCode Importer State
  const [leetcodeInput, setLeetcodeInput] = useState('');
  const [importing, setImporting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    descriptionHtml: '',
    difficulty: 'Easy',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    boilerplate: {
      python: 'def solution(input_val):\n    # Write your solution here\n    pass\n',
      javascript: 'function solution(input_val) {\n    // Write your solution here\n    return null;\n}\nmodule.exports = { solution };\n',
      java: 'public class Solution {\n    public Object solution(Object input) {\n        return null;\n    }\n}\n',
      c: '#include <stdio.h>\n\nint solution(int input) {\n    // Write your solution here\n    return 0;\n}\n',
      cpp: '#include <iostream>\nusing namespace std;\n\nint solution(int input) {\n    // Write your solution here\n    return 0;\n}\n'
    },
    harnessCode: {
      python: '',
      javascript: '',
      java: '',
      c: '',
      cpp: ''
    },
    sampleTestcases: [{ input: '', expectedOutput: '' }],
    hiddenTestcases: [{ input: '', expectedOutput: '' }]
  });

  const [activeBoilerplateLang, setActiveBoilerplateLang] = useState('python');

  // Verify State
  const [verifyLang, setVerifyLang] = useState('python');
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResults, setVerifyResults] = useState(null);
  const [showHarnessPreview, setShowHarnessPreview] = useState(false);
  const [replacementRegionMarked, setReplacementRegionMarked] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await axios.get('/api/questions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setQuestions(res.data.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAiPrompt = (targetQuestion) => {
    const q = targetQuestion || formData;
    const text = generateHarnessAiPrompt(q);
    setAiPromptText(text);
    setShowPromptModal(true);
    setCopiedPrompt(false);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 3500);
      }
    } catch (err) {
      console.error('Auto copy error:', err);
    }
  };

  const handleCopyPromptToClipboard = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(aiPromptText);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 3500);
      } else {
        alert('Please select and copy the text manually from the box below.');
      }
    } catch (err) {
      alert('Failed to copy. Please select and copy text manually.');
    }
  };

  const handleImportLeetCode = async (e) => {
    e.preventDefault();
    if (!leetcodeInput.trim()) return;

    setImporting(true);
    try {
      const res = await axios.post(
        '/api/questions/import-leetcode',
        { urlOrSlug: leetcodeInput },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      
      const importedQ = res.data.question;
      setEditingQuestionId(null);
      setFormData({
        title: importedQ.title,
        descriptionHtml: importedQ.descriptionHtml,
        difficulty: importedQ.difficulty,
        timeLimitMs: 2000,
        memoryLimitMb: 256,
        boilerplate: importedQ.boilerplate,
        harnessCode: importedQ.harnessCode || { python: '', javascript: '', java: '', c: '', cpp: '' },
        sampleTestcases: importedQ.sampleTestcases.length > 0 ? importedQ.sampleTestcases : [{ input: '', expectedOutput: '' }],
        hiddenTestcases: importedQ.hiddenTestcases.length > 0 ? importedQ.hiddenTestcases : [{ input: '', expectedOutput: '' }]
      });

      setShowImportModal(false);
      setShowCreateModal(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to import from LeetCode');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenCreateNew = () => {
    setEditingQuestionId(null);
    setFormData({
      title: '',
      descriptionHtml: '',
      difficulty: 'Easy',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      boilerplate: {
        python: 'def solution(input_val):\n    # Write your solution here\n    pass\n',
        javascript: 'function solution(input_val) {\n    // Write your solution here\n    return null;\n}\nmodule.exports = { solution };\n',
        java: 'public class Solution {\n    public Object solution(Object input) {\n        return null;\n    }\n}\n',
        c: '#include <stdio.h>\n\nint solution(int input) {\n    return 0;\n}\n',
        cpp: '#include <iostream>\nusing namespace std;\n\nint solution(int input) {\n    return 0;\n}\n'
      },
      harnessCode: { python: '', javascript: '', java: '', c: '', cpp: '' },
      sampleTestcases: [{ input: '', expectedOutput: '' }],
      hiddenTestcases: [{ input: '', expectedOutput: '' }]
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (q) => {
    setEditingQuestionId(q._id);
    setFormData({
      title: q.title,
      descriptionHtml: q.descriptionHtml,
      difficulty: q.difficulty,
      timeLimitMs: q.timeLimitMs || 2000,
      memoryLimitMb: q.memoryLimitMb || 256,
      boilerplate: {
        python: q.boilerplate?.python || 'def solution(input_val):\n    pass\n',
        javascript: q.boilerplate?.javascript || 'function solution(input_val) {\n    return null;\n}\nmodule.exports = { solution };\n',
        java: q.boilerplate?.java || 'public class Solution {\n    public Object solution(Object input) {\n        return null;\n    }\n}\n',
        c: q.boilerplate?.c || '#include <stdio.h>\n\nint solution(int input) {\n    return 0;\n}\n',
        cpp: q.boilerplate?.cpp || '#include <iostream>\nusing namespace std;\n\nint solution(int input) {\n    return 0;\n}\n'
      },
      harnessCode: q.harnessCode || { python: '', javascript: '', java: '', c: '', cpp: '' },
      sampleTestcases: q.sampleTestcases?.length > 0 ? q.sampleTestcases : [{ input: '', expectedOutput: '' }],
      hiddenTestcases: q.hiddenTestcases?.length > 0 ? q.hiddenTestcases : [{ input: '', expectedOutput: '' }]
    });
    setShowCreateModal(true);
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    try {
      const cleanSampleTestcases = (formData.sampleTestcases || []).filter(
        (tc) => (tc.input && tc.input.trim() !== '') || (tc.expectedOutput && tc.expectedOutput.trim() !== '')
      );

      const payload = {
        ...formData,
        sampleTestcases: cleanSampleTestcases
      };

      if (editingQuestionId) {
        await axios.put(`/api/questions/${editingQuestionId}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
      } else {
        await axios.post('/api/questions', payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
        });
      }
      setShowCreateModal(false);
      setEditingQuestionId(null);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question');
    }
  };

  const handleSaveHarnessCode = async () => {
    if (!selectedQuestion || !selectedQuestion._id) {
      alert('No saved question selected to attach harness code to. Please save the question first.');
      return;
    }
    try {
      const updatedHarness = {
        ...(selectedQuestion.harnessCode || {}),
        [verifyLang]: verifyCode
      };
      const res = await axios.put(
        `/api/questions/${selectedQuestion._id}`,
        {
          harnessCode: updatedHarness,
          referenceSolutionVerified: true
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      if (res.data && res.data.question) {
        setSelectedQuestion(res.data.question);
      } else {
        setSelectedQuestion((prev) => prev ? ({
          ...prev,
          referenceSolutionVerified: true,
          harnessCode: updatedHarness
        }) : prev);
      }
      fetchQuestions();
      alert(`Test harness code for ${verifyLang.toUpperCase()} saved successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save harness code');
    }
  };

  const handleOpenVerify = (q) => {
    if (!q || !q._id) return;
    setSelectedQuestion(q);
    setVerifyLang('python');
    const initialCode = q.harnessCode?.python || q.boilerplate?.python || 'def solution(input_val):\n    return input_val\n';
    setVerifyCode(initialCode);
    setVerifyResults(null);
    setReplacementRegionMarked(false);
    setShowVerifyModal(true);
  };

  const handleRunVerification = async () => {
    if (!selectedQuestion || !selectedQuestion._id) {
      alert('Please save the question first before running reference solution verification.');
      return;
    }
    setVerifying(true);
    setVerifyResults(null);

    try {
      const res = await axios.post(
        `/api/questions/${selectedQuestion._id}/verify`,
        { referenceCode: verifyCode, language: verifyLang },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setVerifyResults(res.data);
      if (res.data && res.data.question) {
        setSelectedQuestion(res.data.question);
      } else if (res.data?.verified || res.data?.verdict === 'Accepted') {
        setSelectedQuestion((prev) => prev ? ({
          ...prev,
          referenceSolutionVerified: true,
          harnessCode: {
            ...(prev.harnessCode || {}),
            [verifyLang]: verifyCode
          }
        }) : prev);
      }
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification execution failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleManualVerification = async () => {
    if (!selectedQuestion || !selectedQuestion._id) return;
    try {
      const newStatus = !selectedQuestion.referenceSolutionVerified;
      const res = await axios.put(
        `/api/questions/${selectedQuestion._id}`,
        { referenceSolutionVerified: newStatus },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      if (res.data && res.data.question) {
        setSelectedQuestion(res.data.question);
      } else {
        setSelectedQuestion((prev) => prev ? ({ ...prev, referenceSolutionVerified: newStatus }) : prev);
      }
      fetchQuestions();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  const handleMarkStudentReplacementRegion = () => {
    const selectedText = window.getSelection()?.toString();
    if (selectedText && selectedText.trim().length > 0) {
      const updatedCode = verifyCode.replace(selectedText, '\n{{STUDENT_CODE}}\n');
      setVerifyCode(updatedCode);
      setReplacementRegionMarked(true);
      alert('Selected text block marked! When students submit their code during exams, it will replace this exact region.');
    } else {
      // If no text selected, insert tag at current position
      setVerifyCode(verifyCode + '\n{{STUDENT_CODE}}\n');
      setReplacementRegionMarked(true);
      alert('{{STUDENT_CODE}} marker inserted into code editor. Student code will replace this block during submission.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await axios.delete(`/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchQuestions();
    } catch (err) {
      alert('Failed to delete question');
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 mt-4 space-y-6 relative z-10">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight drop-shadow-sm">
              Question Bank
            </h1>
            <p className="text-sm text-[#111111] mt-1 font-semibold leading-relaxed">
              Author & edit problem templates, import from LeetCode, and run reference solution verification
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-[#FFA116] font-mono font-bold text-xs uppercase tracking-wider rounded-lg border border-[#FFA116]/40 flex items-center space-x-2 transition-all shadow-md shadow-[#FFA116]/10"
            >
              <DownloadCloud className="w-4 h-4 text-[#FFA116]" />
              <span>Import LeetCode Question</span>
            </button>

            <button
              onClick={handleOpenCreateNew}
              className="px-4 py-2.5 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-[#0E52FF]/30 flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Question</span>
            </button>
          </div>
        </div>

      {/* Import from LeetCode Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-[#FFA116]" />
                <h2 className="text-xl font-bold text-white">Import from LeetCode</h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Paste a LeetCode problem title slug or URL to auto-extract problem statement & boilerplate</p>

            <form onSubmit={handleImportLeetCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">LeetCode Problem Title Slug or URL</label>
                <input
                  type="text"
                  required
                  value={leetcodeInput}
                  onChange={(e) => setLeetcodeInput(e.target.value)}
                  placeholder="e.g. 4sum OR https://leetcode.com/problems/4sum/"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-2 bg-[#FFA116] hover:bg-[#e59010] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg flex items-center space-x-2 transition-all shadow-md disabled:opacity-50"
                >
                  <DownloadCloud className="w-4 h-4 text-black" />
                  <span>{importing ? 'Fetching LeetCode...' : 'Fetch & Load'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Questions Grid */}
      {loading ? (
        <div className="text-[#111111] text-sm font-semibold">Loading questions...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(questions || []).filter(q => q && q._id).map((q) => (
            <div key={q._id} className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold font-mono uppercase ${
                    q.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {q.difficulty}
                  </span>

                  {/* Verification Badge */}
                  {q.referenceSolutionVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Verified for Paper</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                      <span>Verification Needed</span>
                    </span>
                  )}
                </div>

                <h3 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111] mb-2">{q.title}</h3>
                <p className="text-xs text-[#313131] font-semibold line-clamp-2 mb-4">
                  {q.descriptionHtml.replace(/<[^>]*>?/gm, '')}
                </p>

                <div className="p-3 rounded-lg bg-white/80 border border-white text-xs text-[#111111] font-mono shadow-sm flex items-center justify-between">
                  <span>Testcases: <strong>{q.sampleTestcases?.length || 0}</strong></span>
                  <span className="text-[#0E52FF] font-bold">Time Limit: {q.timeLimitMs}ms</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  onClick={() => handleOpenVerify(q)}
                  className="px-3.5 py-2 rounded-lg bg-[#FFA116] hover:bg-[#e59010] text-black font-mono font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 transition-all active:scale-[0.99]"
                >
                  <Play className="w-3.5 h-3.5 text-black fill-black" />
                  <span>Verify Reference Solution</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenAiPrompt(q)}
                    className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-lg transition-colors flex items-center space-x-1 font-mono text-xs font-bold"
                    title="Generate & Copy AI Prompt for 5-Language Harness Code"
                  >
                    <Copy className="w-4 h-4 text-amber-700" />
                    <span className="hidden sm:inline">AI Prompt</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-1.5 text-slate-600 hover:text-[#0E52FF] hover:bg-[#0E52FF]/10 rounded-lg transition-colors"
                    title="Edit Question Details & Boilerplates"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(q._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Question Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start sm:items-center justify-center p-4 sm:p-6 pt-16 sm:pt-6 overflow-y-auto">
          <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full max-h-[88vh] overflow-y-auto border border-slate-800 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-white">
                  {editingQuestionId ? 'Edit Question' : 'Create Question'}
                </h2>
                <button
                  type="button"
                  onClick={() => handleOpenAiPrompt(formData)}
                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold rounded-lg flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Generate & Copy AI Prompt for 5-Language Harness Code"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy AI Harness Prompt</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Reverse Linked List"
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">Description (HTML / Text)</label>
                  <span className="text-[11px] text-amber-400 font-mono font-semibold">HTML tags & line breaks supported (e.g. &lt;pre&gt;***&#10;***&#10;***&lt;/pre&gt;)</span>
                </div>
                <textarea
                  rows="5"
                  required
                  value={formData.descriptionHtml}
                  onChange={(e) => setFormData({ ...formData, descriptionHtml: e.target.value })}
                  placeholder="<p>Given an integer n, print a square pattern...</p> or plain text with line breaks (\n)"
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm font-mono whitespace-pre-wrap focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Time Limit (ms)</label>
                  <input
                    type="number"
                    value={formData.timeLimitMs}
                    onChange={(e) => setFormData({ ...formData, timeLimitMs: Number(e.target.value) })}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>
              </div>

              {/* Language Starter Code Boilerplates */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Starter Code Boilerplates (Per Programming Language)
                </label>

                <div className="flex space-x-1 border-b border-slate-800 bg-slate-950 p-1 rounded-t-xl overflow-x-auto">
                  {['python', 'javascript', 'java', 'c', 'cpp'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveBoilerplateLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
                        activeBoilerplateLang === lang
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {lang === 'cpp' ? 'C++' : lang}
                    </button>
                  ))}
                </div>
                <div className="h-44 border border-t-0 border-slate-800 rounded-b-xl overflow-hidden">
                  <CodeEditor
                    value={formData.boilerplate?.[activeBoilerplateLang] || ''}
                    onChange={(newCode) => {
                      setFormData({
                        ...formData,
                        boilerplate: {
                          ...formData.boilerplate,
                          [activeBoilerplateLang]: newCode
                        }
                      });
                    }}
                    language={activeBoilerplateLang}
                  />
                </div>
              </div>

              {/* Sample Testcases Form */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300 uppercase">
                    Sample Testcases (Visible to students)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        sampleTestcases: [...formData.sampleTestcases, { input: '', expectedOutput: '' }]
                      });
                    }}
                    className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Sample Testcase</span>
                  </button>
                </div>

                {formData.sampleTestcases.map((tc, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500 w-6">#{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Input e.g. [2,7,11,15], 9"
                      value={tc.input}
                      onChange={(e) => {
                        const updated = [...formData.sampleTestcases];
                        updated[idx].input = e.target.value;
                        setFormData({ ...formData, sampleTestcases: updated });
                      }}
                      className="flex-1 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Expected Output e.g. [0,1]"
                      value={tc.expectedOutput}
                      onChange={(e) => {
                        const updated = [...formData.sampleTestcases];
                        updated[idx].expectedOutput = e.target.value;
                        setFormData({ ...formData, sampleTestcases: updated });
                      }}
                      className="flex-1 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                    {formData.sampleTestcases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.sampleTestcases.filter((_, i) => i !== idx);
                          setFormData({ ...formData, sampleTestcases: updated });
                        }}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Remove Testcase"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl"
                >
                  {editingQuestionId ? 'Update Question' : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reference Solution Verification Gate Modal */}
      {showVerifyModal && selectedQuestion && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVerifyModal(false);
          }}
        >
          <div className="glass-panel p-6 rounded-2xl max-w-4xl w-full border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] relative overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 sticky top-0 bg-slate-950/95 z-20 backdrop-blur-md pt-1">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-indigo-400" />
                  <span>Verify Reference Solution & Mark Student Replacement</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Testing: <strong className="text-slate-200">{selectedQuestion.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowVerifyModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Close Modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Top Execution Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl mb-4">
              <div className="flex items-center space-x-3">
                <label className="text-xs font-semibold text-slate-300 uppercase">Target Language:</label>
                <select
                  value={verifyLang}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setVerifyLang(newLang);
                    const existingCode = selectedQuestion?.harnessCode?.[newLang] || selectedQuestion?.boilerplate?.[newLang] || '';
                    setVerifyCode(existingCode);
                  }}
                  className="bg-slate-950 border border-slate-800 text-xs text-white font-semibold rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="java">Java</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenAiPrompt(selectedQuestion || formData)}
                  className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold rounded-xl flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Generate & Copy AI Prompt for 5-Language Harness Code"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Copy AI Harness Prompt</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunVerification}
                  disabled={verifying}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4 text-white fill-white" />
                  <span>{verifying ? 'Executing Code...' : 'Run & Execute Reference Code'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveHarnessCode}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center space-x-1.5 transition-all"
                  title="Save current test harness code & mark solution verified"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>Save Harness Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkStudentReplacementRegion}
                  className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all"
                  title="Highlight code in editor and click to mark region replaced by student code"
                >
                  <Scissors className="w-3.5 h-3.5 text-purple-400" />
                  <span>Mark Selection for Replacement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowHarnessPreview(!showHarnessPreview)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{showHarnessPreview ? 'Hide Preview' : 'View Substituted Code'}</span>
                </button>
              </div>
            </div>

            {/* Selection Confirmation Notification Banner */}
            {replacementRegionMarked && (
              <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-3 text-xs text-purple-300 flex items-center space-x-2 font-mono">
                <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Replacement region marked with <code>&#123;&#123;STUDENT_CODE&#125;&#125;</code>! Student submissions will replace this region.</span>
              </div>
            )}

            {/* Substituted Code Preview */}
            {showHarnessPreview && (
              <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-xl mb-3 text-xs font-mono text-indigo-300 max-h-40 overflow-y-auto">
                <div className="text-slate-400 mb-1 font-sans text-[11px]">
                  <strong>Student Code Substitution View:</strong> The marked region is deleted and replaced by student submitted code during exam grading:
                </div>
                <pre className="text-[11px] leading-relaxed">
{verifyLang === 'python' && `import time, json, inspect
# --- {{STUDENT_CODE}} ---
${verifyCode}
# --- END STUDENT CODE ---
test_cases = ${JSON.stringify(selectedQuestion.sampleTestcases || [])}
# Execution loop computes runtime & outputs __RESULTS__ JSON`}
{verifyLang === 'javascript' && `// --- {{STUDENT_CODE}} ---
${verifyCode}
const testCases = ${JSON.stringify(selectedQuestion.sampleTestcases || [])};
// Execution loop computes runtime & outputs __RESULTS__ JSON`}
{verifyLang === 'java' && `public class Main {
    // --- {{STUDENT_CODE}} ---
    ${verifyCode}
    public static void main(String[] args) {
        // Runs sol.solution(inputs) & outputs __RESULTS__ JSON
    }
}`}
{verifyLang === 'c' || verifyLang === 'cpp' ? `// --- {{STUDENT_CODE}} ---
${verifyCode}
int main() {
    // Runs solution(inputs) & outputs __RESULTS__ JSON
}` : ''}
                </pre>
              </div>
            )}

            {/* Code Editor (Scrollable & Vertically Resizable) */}
            <div className="mb-4 relative border border-slate-800 rounded-xl overflow-auto resize-y min-h-[350px] max-h-[75vh] bg-slate-950 flex flex-col shadow-inner">
              <div className="flex-1 overflow-auto">
                <CodeEditor
                  value={verifyCode}
                  onChange={setVerifyCode}
                  language={verifyLang}
                />
              </div>
            </div>

            {/* Console Terminal Output Box (Dynamic Height & Resizable) */}
            {verifyResults && (
              <div className={`p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4 font-mono transition-all duration-200 resize-y overflow-auto ${
                isConsoleExpanded ? 'max-h-[85vh] min-h-[380px]' : 'max-h-96 min-h-[200px]'
              }`}>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 sticky top-0 bg-slate-950/95 backdrop-blur z-10">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Raw Console Output (stdout / stderr)</span>
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsConsoleExpanded(!isConsoleExpanded)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold rounded-lg border border-slate-700 flex items-center space-x-1 transition-all"
                      title={isConsoleExpanded ? "Collapse Console Height" : "Expand Console to View Full Output"}
                    >
                      {isConsoleExpanded ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Collapse Window</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Expand Full Output</span>
                        </>
                      )}
                    </button>

                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      verifyResults.verdict === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {verifyResults.verdict}
                    </span>
                  </div>
                </div>

                {/* Raw Console Text Output */}
                <pre className="text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap font-mono bg-slate-900/90 p-3 rounded-lg border border-slate-800 mb-3 select-text">
                  {verifyResults.rawOutput || 'Execution completed with no text output.'}
                </pre>

                {/* Parsed Testcases Summary (if available) */}
                {verifyResults.testResults?.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Parsed Testcases Summary:</span>
                    {verifyResults.testResults.map((r, i) => (
                      <div key={i} className="text-xs font-mono py-1.5 px-2 bg-slate-900/60 rounded border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {r.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                          <span>Testcase {r.testIndex || i + 1}: <strong className={r.passed ? "text-emerald-400" : "text-rose-400"}>{r.passed ? 'PASSED' : 'FAILED'}</strong></span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                          {r.output !== undefined && <span>Output: <strong className="text-slate-200">{r.output || 'None'}</strong></span>}
                          <span>Runtime: {r.runtimeMs}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Bar Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-auto sticky bottom-0 bg-slate-950/95 z-20 backdrop-blur-md pb-1">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all"
                >
                  Close & Return
                </button>

                <button
                  type="button"
                  onClick={handleToggleManualVerification}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition-all ${
                    selectedQuestion?.referenceSolutionVerified
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  }`}
                  title="Click to toggle Faculty verification approval status"
                >
                  {selectedQuestion?.referenceSolutionVerified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  )}
                  <span>{selectedQuestion?.referenceSolutionVerified ? 'Verified by Faculty ✓' : 'Mark as Verified by Faculty'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleRunVerification}
                disabled={verifying}
                className="px-6 py-2.5 bg-[#FFA116] hover:bg-[#e59010] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center space-x-2 transition-all disabled:opacity-50 active:scale-[0.99]"
              >
                <Play className="w-4 h-4 text-black fill-black" />
                <span>{verifying ? 'Executing Reference Code...' : 'Run & Execute Reference Code'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI Harness Generation Prompt Modal */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl max-w-3xl w-full border border-white shadow-2xl space-y-4 text-[#111111] max-h-[90vh] flex flex-col font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2 font-mono">
                <Sparkles className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-extrabold text-[#111111]">
                  AI Harness Generation Prompt
                </h3>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-900">
              <span>{copiedPrompt ? '✓ Copied to clipboard! Ready to paste in ChatGPT / Gemini / Claude.' : 'Click below to copy prompt text for AI harness generation.'}</span>
              <button
                onClick={handleCopyPromptToClipboard}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm flex items-center space-x-1.5 transition-all"
              >
                <Copy className="w-4 h-4 text-white" />
                <span>{copiedPrompt ? 'COPIED!' : 'COPY PROMPT'}</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col h-96">
              <label className="block text-xs font-mono font-bold text-slate-500 uppercase mb-1">Generated Prompt Content (Contains question details + 4sum.txt template context):</label>
              <textarea
                readOnly
                value={aiPromptText}
                className="w-full flex-1 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed resize-none select-text"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-mono font-bold rounded-lg shadow-md uppercase tracking-wider"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
