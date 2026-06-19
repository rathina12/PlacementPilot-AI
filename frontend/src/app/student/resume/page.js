"use client";
import { useState } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, ScoreRing, Badge } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { FileText, Upload, CheckCircle, AlertCircle, Lightbulb, XCircle } from "lucide-react";

const QUALITY_COLOR = { excellent: "success", good: "info", average: "warning", poor: "danger" };

export default function ResumePage() {
  const [file,    setFile]    = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f); setResult(null);
  };

  const analyze = async () => {
    if (!file) { toast.error("Please select a file"); return; }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await studentsAPI.analyzeResume(form);
      setResult(r.data);
      toast.success("Resume analyzed!");
    } catch (err) { toast.error(err.response?.data?.detail || "Analysis failed"); }
    setLoading(false);
  };

  return (
    <DashboardLayout requiredRole="student">
      <SectionHeader title="Resume Analyzer" subtitle="AI-powered ATS check and improvement suggestions" />

      <div
        onDragOver={e => { e.preventDefault(); }}
        onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => document.getElementById("res-input").click()}
        className="card border-2 border-dashed text-center py-12 cursor-pointer hover:border-indigo-300 transition-colors mb-6">
        <Upload size={36} className="mx-auto mb-3 text-gray-300" />
        <p className="font-semibold text-gray-700">Drop your resume here or click to browse</p>
        <p className="text-sm text-gray-400 mt-1">PDF, DOCX, or TXT</p>
        {file && <p className="text-sm text-indigo-600 mt-3 font-medium">✓ {file.name}</p>}
        <input id="res-input" type="file" accept=".pdf,.docx,.txt" className="hidden"
          onChange={e => handleFile(e.target.files[0])} />
      </div>

      {file && !result && (
        <div className="flex justify-center mb-6">
          <button onClick={analyze} disabled={loading} className="btn-primary px-8 py-3">
            {loading ? <><LoadingSpinner size={16} />Analyzing...</> : <><FileText size={16} />Analyze Resume</>}
          </button>
        </div>
      )}

      {loading && (
        <div className="card text-center py-12">
          <LoadingSpinner size={40} className="mx-auto mb-3" />
          <p className="text-gray-600 font-medium">AI is reviewing your resume...</p>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="card flex flex-col md:flex-row items-center gap-8">
            <ScoreRing score={result.ats_score || 0} size={140} strokeWidth={12} label="ATS Score" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">Resume Quality</h3>
                {result.overall_quality && (
                  <Badge variant={QUALITY_COLOR[result.overall_quality] || "info"}>
                    {result.overall_quality?.charAt(0).toUpperCase() + result.overall_quality?.slice(1)}
                  </Badge>
                )}
              </div>
              <p className="text-gray-500 text-sm">
                Your resume scored <strong>{result.ats_score?.toFixed(0)}/100</strong> for ATS compatibility.
                {result.ats_score >= 70 ? " Good score! Work on the improvements below." : " Needs work to pass ATS filters."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card">
              <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-4"><CheckCircle size={16} />Strengths</h4>
              {result.strengths?.length > 0 ? (
                <ul className="space-y-2">
                  {result.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-green-500 flex-shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-400">No strengths detected</p>}
            </div>
            <div className="card">
              <h4 className="font-semibold text-red-700 flex items-center gap-2 mb-4"><XCircle size={16} />Missing Sections</h4>
              {result.missing_sections?.length > 0 ? (
                <ul className="space-y-2">
                  {result.missing_sections.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-red-500 flex-shrink-0">✗</span>{s}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-green-600 font-medium">✓ All important sections present</p>}
            </div>
          </div>

          {result.missing_skills?.length > 0 && (
            <div className="card border-l-4 border-orange-400">
              <h4 className="font-semibold text-orange-700 flex items-center gap-2 mb-3"><AlertCircle size={16} />Missing Skills</h4>
              <div className="flex flex-wrap gap-2">
                {result.missing_skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200">{s}</span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions?.length > 0 && (
            <div className="card">
              <h4 className="font-semibold text-blue-700 flex items-center gap-2 mb-4"><Lightbulb size={16} />Improvement Suggestions</h4>
              <ul className="space-y-3">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-700 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-500 font-bold flex-shrink-0">{i + 1}.</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={() => { setFile(null); setResult(null); }} className="btn-secondary">
            Analyze Another Resume
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
