"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { ScoreRing, StatCard, ProgressBar, PlacementBadge, SectionHeader, LoadingSpinner, RiskBadge } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Code2, GitBranch, Award, Target, RefreshCw, Video, Zap, FileText, AlertCircle } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import useAuthStore from "@/store/authStore";

export default function StudentDashboard() {
  const { getName } = useAuthStore();
  const [student,  setStudent]  = useState(null);
  const [readiness,setReadiness]= useState(null);
  const [loading,  setLoading]  = useState(true);
  const [syncing,  setSyncing]  = useState({ leetcode: false, github: false });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sr, rr] = await Promise.allSettled([studentsAPI.getMe(), studentsAPI.getReadiness()]);
      if (sr.status === "fulfilled") setStudent(sr.value.data);
      if (rr.status === "fulfilled") setReadiness(rr.value.data);
    } catch (_) {}
    setLoading(false);
  };

  const sync = (type) => async () => {
    setSyncing(p => ({ ...p, [type]: true }));
    try {
      await (type === "leetcode" ? studentsAPI.syncLeetCode() : studentsAPI.syncGitHub());
      toast.success(`${type === "leetcode" ? "LeetCode" : "GitHub"} synced!`);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.detail || "Sync failed"); }
    setSyncing(p => ({ ...p, [type]: false }));
  };

  const radarData = readiness ? [
    { subject: "Coding",    score: readiness.coding_score },
    { subject: "GitHub",    score: readiness.github_score },
    { subject: "Certs",     score: readiness.certification_score },
    { subject: "Projects",  score: readiness.project_score },
    { subject: "Interview", score: readiness.interview_score },
    { subject: "Comm.",     score: readiness.communication_score },
    { subject: "Skills",    score: readiness.domain_skill_score },
  ] : [];

  if (loading) return (
    <DashboardLayout requiredRole="student">
      <div className="flex justify-center py-20"><LoadingSpinner size={36} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout requiredRole="student">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Welcome back, {getName().split(" ")[0]} 👋</h1>
          <p className="text-gray-500 mt-1">Your placement readiness overview</p>
        </div>
        {student && <PlacementBadge status={student.placement_status} />}
      </div>

      {/* Readiness Score + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card flex flex-col items-center gap-4">
          <ScoreRing score={readiness?.overall_score || 0} size={160} strokeWidth={14} label="Placement Readiness" />
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{readiness?.placement_probability || 0}%</p>
            <p className="text-sm text-gray-500">Placement Probability</p>
          </div>
          {readiness && <RiskBadge risk={readiness.risk_level} />}
          {readiness?.needs_attention && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm w-full justify-center">
              <AlertCircle size={16} /> Needs Improvement
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <h3 className="font-semibold text-gray-800 mb-2">Score Breakdown</h3>
          {readiness ? (
            <>
              <ProgressBar value={readiness.coding_score}        label="Coding" />
              <ProgressBar value={readiness.github_score}        label="GitHub" />
              <ProgressBar value={readiness.certification_score} label="Certifications" />
              <ProgressBar value={readiness.project_score}       label="Projects" />
              <ProgressBar value={readiness.interview_score}     label="Interview" />
              <ProgressBar value={readiness.communication_score} label="Communication" />
              <ProgressBar value={readiness.domain_skill_score}  label="Domain Skills" />
            </>
          ) : <p className="text-sm text-gray-400">Sync your profiles to calculate score</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Skill Radar</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Tooltip formatter={(v) => [`${v?.toFixed(1)}`, "Score"]} />
              </RadarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-8">Sync profiles to see radar</p>}
        </div>
      </div>

      {/* Quick Stats */}
      {student && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Target Salary" value={`${student.expected_salary_lpa || "—"} LPA`} icon={Target} color="indigo" />
          <StatCard label="Branch"        value={student.branch}                               icon={Code2}   color="info" />
          <StatCard label="Year"          value={`Year ${student.year}`}                       icon={Award}   color="success" />
          <StatCard label="Section"       value={student.section}                              icon={GitBranch} color="warning" />
        </div>
      )}

      {/* Sync Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {[
          { key: "leetcode", label: "LeetCode Profile", user: student?.leetcode_username, fn: sync("leetcode") },
          { key: "github",   label: "GitHub Profile",   user: student?.github_username,   fn: sync("github")   },
        ].map(({ key, label, user: u, fn }) => (
          <div key={key} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="text-sm text-gray-500">{u ? `@${u}` : "Not connected"}</p>
            </div>
            <button onClick={fn} disabled={syncing[key] || !u} className="btn-secondary text-sm">
              {syncing[key] ? <LoadingSpinner size={14} /> : <RefreshCw size={14} />}
              {syncing[key] ? "Syncing..." : "Sync"}
            </button>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <SectionHeader title="Quick Actions" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Mock Interview",  href: "/student/interview", icon: Video,    bg: "bg-purple-50 text-purple-600" },
            { label: "View Roadmap",    href: "/student/roadmap",   icon: Target,   bg: "bg-blue-50 text-blue-600" },
            { label: "Add Certificate", href: "/student/certs",     icon: Award,    bg: "bg-green-50 text-green-600" },
            { label: "Resume Check",    href: "/student/resume",    icon: FileText, bg: "bg-orange-50 text-orange-600" },
          ].map(({ label, href, icon: Icon, bg }) => (
            <a key={href} href={href}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-all ${bg}`}>
              <Icon size={24} />
              <span className="text-xs font-medium text-center text-gray-700">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
