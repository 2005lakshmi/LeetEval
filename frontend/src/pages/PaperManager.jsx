import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GradFlow } from 'gradflow';
import { Plus, FileText, CheckCircle2, ShieldAlert, Trash2, Clock, Shuffle } from 'lucide-react';

export default function PaperManager() {
  const [papers, setPapers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [title, setTitle] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(60);
  const [orderingMode, setOrderingMode] = useState('fixed');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [error, setError] = useState('');

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

  const handleCreatePaper = async (e) => {
    e.preventDefault();
    setError('');

    if (selectedQuestionIds.length === 0) {
      return setError('Please select at least one question');
    }

    try {
      await axios.post(
        '/api/papers',
        { title, questionIds: selectedQuestionIds, orderingMode, timeLimitMinutes },
        { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }
      );
      setShowCreateModal(false);
      setTitle('');
      setSelectedQuestionIds([]);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create paper');
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['Playfair_Display',serif] text-3xl sm:text-4xl font-extrabold text-[#111111] tracking-tight drop-shadow-sm">
              Exam Papers
            </h1>
            <p className="text-sm text-[#111111] mt-1 font-semibold leading-relaxed">Assemble verified questions into structured exam papers with time limits</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-[#0E52FF] hover:bg-[#0642d9] text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-[#0E52FF]/30 flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Assemble New Paper</span>
          </button>
        </div>

      {/* Papers Grid */}
      {loading ? (
        <div className="text-[#111111] text-sm font-semibold">Loading exam papers...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {papers.map((p) => (
            <div key={p._id} className="relative rounded-xl p-6 bg-white/90 backdrop-blur-xl border border-white/80 shadow-[0_15px_35px_rgba(0,0,0,0.12)] text-[#111111] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-['Playfair_Display',serif] text-xl font-extrabold text-[#111111]">{p.title}</h3>
                  <button
                    onClick={() => handleDeletePaper(p._id)}
                    className="p-1.5 text-rose-600 hover:text-rose-800 rounded-lg hover:bg-rose-100 transition-all"
                    title="Delete Paper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-3 text-xs text-[#313131] font-semibold mb-4">
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

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-end">
                <button
                  onClick={() => handleDeletePaper(p._id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Paper Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-800 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Assemble Exam Paper</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePaper} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Paper Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mid-Semester Coding Exam - CS201"
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Question Ordering</label>
                  <select
                    value={orderingMode}
                    onChange={(e) => setOrderingMode(e.target.value)}
                    className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm"
                  >
                    <option value="fixed">Fixed Order</option>
                    <option value="random">Randomized Order</option>
                    <option value="odd-even">Odd-Even Variant</option>
                  </select>
                </div>
              </div>

              {/* Select Verified Questions */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                  Select Verified Questions
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {questions.map((q) => {
                    const isSelected = selectedQuestionIds.includes(q._id);
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleQuestionSelect(q)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded border-slate-800 text-indigo-600 focus:ring-0"
                          />
                          <span className="font-medium">{q.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {q.referenceSolutionVerified ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold">Verified</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold">Unverified</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl"
                >
                  Create Paper
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
