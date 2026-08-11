import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { Plus, FileText, CheckCircle2, ShieldAlert, Trash2, Clock, Shuffle, Code2, CheckSquare, Edit, Edit3, X } from 'lucide-react';

export default function PaperManager() {
  const [papers, setPapers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPaper, setEditingPaper] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [orderingMode, setOrderingMode] = useState('fixed');
  const [allowedLanguages, setAllowedLanguages] = useState(['python', 'cpp', 'c', 'java', 'javascript']);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [error, setError] = useState('');

  const allLangOptions = [
    { id: 'python', label: 'Python 3', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'cpp', label: 'C++', color: 'text-purple-700 bg-purple-50 border-purple-200' },
    { id: 'c', label: 'C Language', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'java', label: 'Java', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: 'javascript', label: 'JavaScript', color: 'text-amber-600 bg-amber-50 border-amber-200' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const authHeader = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      const [pRes, qRes] = await Promise.all([
        axios.get('/api/papers', authHeader),
        axios.get('/api/questions', authHeader)
      ]);
      setPapers(pRes.data.papers || []);
      setQuestions(qRes.data.questions || []);
    } catch (err) {
      console.error('Error fetching papers/questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setTitle('');
    setTimeLimitMinutes(60);
    setOrderingMode('fixed');
    setAllowedLanguages(['python', 'cpp', 'c', 'java', 'javascript']);
    setSelectedQuestionIds([]);
    setError('');
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (paper) => {
    setEditingPaper(paper);
    setTitle(paper.title || '');
    setTimeLimitMinutes(paper.timeLimitMinutes || 60);
    setOrderingMode(paper.orderingMode || 'fixed');
    setAllowedLanguages(paper.allowedLanguages && paper.allowedLanguages.length > 0 ? paper.allowedLanguages : ['python', 'cpp', 'c', 'java', 'javascript']);
    setSelectedQuestionIds((paper.questions || paper.questionIds || []).map(q => q._id || q));
    setError('');
  };

  const handleCreatePaper = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedQuestionIds.length === 0) {
      return setError('Please select at least one question');
    }

    if (allowedLanguages.length === 0) {
      return setError('Please select at least one allowed programming language for students');
    }

    try {
      await axios.post(
        '/api/papers',
        { title, questionIds: selectedQuestionIds, orderingMode, timeLimitMinutes, allowedLanguages },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create paper');
    }
  };

  const handleSaveEditPaper = async (e) => {
    e.preventDefault();
    if (!editingPaper) return;
    setError('');

    if (selectedQuestionIds.length === 0) {
      return setError('Please select at least one question');
    }

    if (allowedLanguages.length === 0) {
      return setError('Please select at least one allowed programming language for students');
    }

    try {
      await axios.put(
        `/api/papers/${editingPaper._id}`,
        { title, questionIds: selectedQuestionIds, orderingMode, timeLimitMinutes, allowedLanguages },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setEditingPaper(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update paper');
    }
  };

  const toggleLangOption = (langId) => {
    if (allowedLanguages.includes(langId)) {
      if (allowedLanguages.length === 1) {
        alert('At least one programming language must be allowed for the exam paper!');
        return;
      }
      setAllowedLanguages(allowedLanguages.filter(l => l !== langId));
    } else {
      setAllowedLanguages([...allowedLanguages, langId]);
    }
  };

  const toggleQuestionSelect = (q) => {
    if (!q.referenceSolutionVerified) {
      alert(`Question "${q.title}" must be verified using the Reference Solution Gate before adding to a paper!`);
      return;
    }

    if (selectedQuestionIds.includes(q._id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q._id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, q._id]);
    }
  };

  const handleDeletePaper = async (id) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    try {
      await axios.delete(`/api/papers/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      fetchData();
    } catch (err) {
      alert('Failed to delete paper');
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
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#FFFFFF] tracking-tight drop-shadow-sm">
              Exam Papers Management
            </h1>
            <p className="text-sm text-[#FFFFFF]/70 mt-1 font-semibold leading-relaxed">Assemble, edit, and configure exam papers, time limits, and allowed programming languages</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-[#0E52FF]/30 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Assemble New Paper</span>
          </button>
        </div>

      {/* Papers Grid */}
      {loading ? (
        <div className="text-[#FFFFFF] text-sm font-semibold">Loading exam papers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {papers.map((p) => {
            const paperLangs = p.allowedLanguages && p.allowedLanguages.length > 0 ? p.allowedLanguages : ['python', 'cpp', 'c', 'java', 'javascript'];
            return (
              <div key={p._id} className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">{p.title}</h3>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="px-3 py-1 bg-white hover:bg-slate-100 text-[#0E52FF] border border-[#0E52FF]/30 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1 shadow-sm transition-all"
                        title="Edit Exam Paper"
                      >
                        <Edit className="w-3.5 h-3.5 text-[#0E52FF]" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePaper(p._id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-[#313131] font-semibold mb-3">
                    <span className="flex items-center space-x-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-[#0E52FF]" />
                      <span>{p.timeLimitMinutes} minutes</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1 font-mono">
                      <Shuffle className="w-3.5 h-3.5 text-purple-700" />
                      <span className="capitalize">{p.orderingMode} Order</span>
                    </span>
                  </div>

                  {/* Allowed Languages Badges */}
                  <div className="mb-4 space-y-1">
                    <div className="text-[10px] text-slate-500 font-extrabold font-mono uppercase tracking-wider">Allowed Programming Languages:</div>
                    <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                      {paperLangs.map((langKey) => {
                        const opt = allLangOptions.find(o => o.id === langKey) || { label: langKey.toUpperCase(), color: 'bg-slate-100 text-slate-700 border-slate-200' };
                        return (
                          <span key={langKey} className={`px-2 py-0.5 rounded border font-bold uppercase ${opt.color}`}>
                            {opt.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Questions Inset Box */}
                  <div className="p-3.5 rounded-lg bg-white/80 border border-white text-xs text-[#111111] space-y-1.5 font-mono shadow-sm">
                    <div className="text-[10px] text-[#555555] font-extrabold uppercase tracking-wider mb-1">Questions Included ({p.questions?.length || p.questionIds?.length || 0}):</div>
                    {(p.questions || p.questionIds)?.map((q, idx) => {
                      const diff = q.difficulty || 'Easy';
                      return (
                        <div key={q._id || idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-100 last:border-0">
                          <span className="truncate font-bold text-[#111111] max-w-[220px]">{idx + 1}. {q.title || 'Question'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase ${
                            diff === 'Easy' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            diff === 'Medium' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {diff}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end space-x-2 font-mono text-xs">
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg uppercase tracking-wider flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#0E52FF]" />
                    <span>Edit Settings</span>
                  </button>
                  <button
                    onClick={() => handleDeletePaper(p._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Paper Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start sm:items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24 overflow-y-auto">
          <div className="bg-white/95 backdrop-blur-xl p-6 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-white shadow-2xl text-[#111111] space-y-4 my-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-['Playfair_Display',serif] text-2xl font-extrabold text-[#111111]">Assemble Exam Paper</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close Modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePaper} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Paper Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Semester Coding Exam - CS201"
                  className="w-full p-3 bg-white border border-[#E5E0D8] rounded-xl text-[#111111] font-mono text-xs font-bold focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-xl text-[#111111] font-mono text-xs font-bold focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Question Ordering</label>
                  <select
                    value={orderingMode}
                    onChange={(e) => setOrderingMode(e.target.value)}
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-xl text-[#111111] font-mono text-xs font-bold focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  >
                    <option value="fixed">Fixed Order</option>
                    <option value="random">Randomized Order</option>
                    <option value="odd-even">Odd-Even Variant</option>
                  </select>
                </div>
              </div>

              {/* Select Allowed Programming Languages */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase">
                  Allowed Programming Languages (Select allowed for students):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {allLangOptions.map((lang) => {
                    const isChecked = allowedLanguages.includes(lang.id);
                    return (
                      <label
                        key={lang.id}
                        onClick={() => toggleLangOption(lang.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center space-x-2 transition-all select-none ${
                          isChecked 
                            ? 'bg-[#0E52FF]/10 border-[#0E52FF] text-[#0E52FF] font-bold shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[#0E52FF] focus:ring-0"
                        />
                        <span className="text-xs">{lang.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Select Verified Questions */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase">
                  Select Verified Questions:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {questions.map((q) => {
                    const isSelected = selectedQuestionIds.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleQuestionSelect(q)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#0E52FF]/10 border-[#0E52FF] text-[#0E52FF] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-[#0E52FF] focus:ring-0"
                          />
                          <span className="font-bold">{q.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {q.referenceSolutionVerified ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Verified</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">Unverified</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg hover:bg-slate-200 uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0E52FF] hover:bg-[#0642d9] text-white text-xs font-mono font-bold rounded-lg shadow-md uppercase tracking-wider"
                >
                  Create Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Paper Modal */}
      {editingPaper && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start sm:items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24 overflow-y-auto">
          <div className="bg-[#FFFFFF]/95 backdrop-blur-xl p-6 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-white shadow-2xl text-[#111111] space-y-4 my-auto relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="font-['Playfair_Display',serif] text-2xl font-extrabold text-[#111111]">Edit Exam Paper Settings</h2>
              <button
                type="button"
                onClick={() => setEditingPaper(null)}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                title="Close Modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEditPaper} className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Paper Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Semester Coding Exam - CS201"
                  className="w-full p-3 bg-white border border-[#E5E0D8] rounded-xl text-[#111111] font-mono text-xs font-bold focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-xl text-[#111111] font-mono text-xs font-bold focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold text-[#111111] uppercase mb-1">Question Ordering</label>
                  <select
                    value={orderingMode}
                    onChange={(e) => setOrderingMode(e.target.value)}
                    className="w-full p-3 bg-white border border-[#E5E0D8] rounded-xl text-[#111111] font-mono text-xs font-bold focus:ring-2 focus:ring-[#0E52FF] focus:outline-none"
                  >
                    <option value="fixed">Fixed Order</option>
                    <option value="random">Randomized Order</option>
                    <option value="odd-even">Odd-Even Variant</option>
                  </select>
                </div>
              </div>

              {/* Select Allowed Programming Languages */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase">
                  Allowed Programming Languages (Select allowed for students):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {allLangOptions.map((lang) => {
                    const isChecked = allowedLanguages.includes(lang.id);
                    return (
                      <label
                        key={lang.id}
                        onClick={() => toggleLangOption(lang.id)}
                        className={`p-2.5 rounded-lg border cursor-pointer flex items-center space-x-2 transition-all select-none ${
                          isChecked 
                            ? 'bg-[#0E52FF]/10 border-[#0E52FF] text-[#0E52FF] font-bold shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-[#0E52FF] focus:ring-0"
                        />
                        <span className="text-xs">{lang.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Select Verified Questions */}
              <div className="space-y-2">
                <label className="block text-xs font-mono font-bold text-[#111111] uppercase">
                  Select Verified Questions:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {questions.map((q) => {
                    const isSelected = selectedQuestionIds.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleQuestionSelect(q)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-[#0E52FF]/10 border-[#0E52FF] text-[#0E52FF] font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-[#0E52FF] focus:ring-0"
                          />
                          <span className="font-bold">{q.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {q.referenceSolutionVerified ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Verified</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">Unverified</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingPaper(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg hover:bg-slate-200 uppercase tracking-wider"
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
