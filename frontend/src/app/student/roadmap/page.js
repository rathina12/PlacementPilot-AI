"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, ProgressBar } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Target, Zap, CheckCircle, Circle, Code2, Video, Award, BookOpen } from "lucide-react";

const CAT_CONFIG = {
  coding:    { icon: Code2,  color: "text-purple-600 bg-purple-50", label: "Coding" },
  skill:     { icon: Zap,    color: "text-blue-600 bg-blue-50",     label: "Skill" },
  career:    { icon: Target, color: "text-green-600 bg-green-50",   label: "Career" },
  interview: { icon: Video,  color: "text-orange-600 bg-orange-50", label: "Interview" },
};
const PRIORITY_COLOR = { 1: "text-red-600 bg-red-50", 2: "text-yellow-600 bg-yellow-50", 3: "text-gray-500 bg-gray-100" };
const PRIORITY_LABEL = { 1: "High", 2: "Medium", 3: "Low" };

export default function RoadmapPage() {
  const [recs,       setRecs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter,     setFilter]     = useState("all");

  useEffect(() => { fetchRecs(); }, []);

  const fetchRecs = async () => {
    setLoading(true);
    try { const r = await studentsAPI.getRecommendations(); setRecs(r.data || []); }
    catch (_) {}
    setLoading(false);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      await studentsAPI.generateRecs();
      toast.success("Roadmap generated!");
      await fetchRecs();
    } catch (err) { toast.error(err.response?.data?.detail || "Generation failed"); }
    setGenerating(false);
  };

  const markDone = async (id) => {
    try {
      await studentsAPI.completeRec(id);
      setRecs(p => p.map(r => r.id === id ? { ...r, is_completed: true } : r));
      toast.success("Marked complete ✓");
    } catch (_) {}
  };

  const filtered = filter === "all" ? recs
    : filter === "pending" ? recs.filter(r => !r.is_completed)
    : recs.filter(r => r.category === filter);

  const done = recs.filter(r => r.is_completed).length;
  const pct  = recs.length > 0 ? Math.round((done / recs.length) * 100) : 0;

  return (
    <DashboardLayout requiredRole="student">
      <div className="flex items-start justify-between mb-6">
        <SectionHeader title="AI Learning Roadmap" subtitle="Personalised recommendations for your career goals" />
        <button onClick={generate} disabled={generating} className="btn-primary">
          {generating ? <><LoadingSpinner size={14} />Generating...</> : <><Zap size={14} />Generate Roadmap</>}
        </button>
      </div>

      {recs.length > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900">Overall Progress</p>
              <p className="text-sm text-gray-500">{done} of {recs.length} completed</p>
            </div>
            <span className="text-2xl font-bold text-indigo-600">{pct}%</span>
          </div>
          <ProgressBar value={pct} showLabel={false} />
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {["all", "pending", "coding", "skill", "career", "interview"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              filter === f ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}>
            {f === "all" ? "All" : f === "pending" ? "Pending" : CAT_CONFIG[f]?.label || f}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><LoadingSpinner size={32} /></div>
      : recs.length === 0 ? (
        <div className="card text-center py-16">
          <Target size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">No roadmap yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Sync your LeetCode & GitHub profiles first, then generate your roadmap</p>
          <button onClick={generate} disabled={generating} className="btn-primary inline-flex">
            {generating ? <><LoadingSpinner size={14} />Generating...</> : <><Zap size={14} />Generate My Roadmap</>}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(rec => {
            const cfg  = CAT_CONFIG[rec.category] || CAT_CONFIG.skill;
            const Icon = cfg.icon;
            return (
              <div key={rec.id} className={`card flex items-start gap-4 transition-opacity ${rec.is_completed ? "opacity-60" : ""}`}>
                <button onClick={() => !rec.is_completed && markDone(rec.id)}
                  className={`flex-shrink-0 mt-0.5 ${rec.is_completed ? "text-green-500" : "text-gray-300 hover:text-indigo-500 transition-colors"}`}>
                  {rec.is_completed ? <CheckCircle size={22} /> : <Circle size={22} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <div className={`p-1.5 rounded-lg ${cfg.color}`}><Icon size={12} /></div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[rec.priority]}`}>{PRIORITY_LABEL[rec.priority]} Priority</span>
                    {rec.is_completed && <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">✓ Done</span>}
                  </div>
                  <p className={`font-semibold text-gray-900 ${rec.is_completed ? "line-through" : ""}`}>{rec.title}</p>
                  {rec.description && <p className="text-sm text-gray-500 mt-0.5">{rec.description}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
