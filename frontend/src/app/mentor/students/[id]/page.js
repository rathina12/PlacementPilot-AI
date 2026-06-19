"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { ScoreRing, ProgressBar, SectionHeader, LoadingSpinner, RiskBadge, PlacementBadge, StatCard } from "@/components/ui";
import { mentorsAPI } from "@/lib/api";
import { Code2, GitBranch, Award, FolderOpen, Video, ArrowLeft, TrendingUp } from "lucide-react";
import Link from "next/link";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

export default function StudentDetailPage() {
  const { id } = useParams();
  const [data,   setData]   = useState(null);
  const [bench,  setBench]  = useState(null);
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    Promise.allSettled([mentorsAPI.getStudentProfile(id), mentorsAPI.getBenchmark(id)])
      .then(([pr, br]) => {
        if (pr.status === "fulfilled") setData(pr.value.data);
        if (br.status === "fulfilled") setBench(br.value.data);
      }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DashboardLayout requiredRole="mentor"><div className="flex justify-center py-20"><LoadingSpinner size={36}/></div></DashboardLayout>;
  if (!data) return <DashboardLayout requiredRole="mentor"><p className="text-gray-500">Student not found.</p></DashboardLayout>;

  const { student, coding, github, certifications, projects, readiness, recent_interviews } = data;

  const radarData = readiness ? [
    {subject:"Coding",   score:readiness.coding_score},
    {subject:"GitHub",   score:readiness.github_score},
    {subject:"Certs",    score:readiness.certification_score},
    {subject:"Projects", score:readiness.project_score},
    {subject:"Interview",score:readiness.interview_score},
    {subject:"Comm.",    score:readiness.communication_score},
  ] : [];

  return (
    <DashboardLayout requiredRole="mentor">
      <div className="mb-6">
        <Link href="/mentor/students" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mb-3">
          <ArrowLeft size={14}/> Back to Students
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{student.name}</h1>
            <p className="text-gray-500 mt-1">{student.roll_number} · {student.branch} Year {student.year}{student.section}</p>
          </div>
          <PlacementBadge status={student.placement_status}/>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card flex flex-col items-center gap-3">
          <ScoreRing score={readiness?.overall_score||0} size={150} strokeWidth={13} label="Readiness"/>
          <div className="text-center">
            <p className="text-xl font-bold">{readiness?.placement_probability||0}%</p>
            <p className="text-xs text-gray-500">Placement Probability</p>
          </div>
          <RiskBadge risk={readiness?.risk_level||"high"}/>
        </div>
        <div className="card space-y-2.5">
          <h3 className="font-semibold text-gray-800 mb-2">Score Breakdown</h3>
          <ProgressBar value={readiness?.coding_score||0}        label="Coding"/>
          <ProgressBar value={readiness?.github_score||0}        label="GitHub"/>
          <ProgressBar value={readiness?.certification_score||0} label="Certifications"/>
          <ProgressBar value={readiness?.project_score||0}       label="Projects"/>
          <ProgressBar value={readiness?.interview_score||0}     label="Interview"/>
          <ProgressBar value={readiness?.communication_score||0} label="Communication"/>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-3">Skill Radar</h3>
          {radarData.length > 0 && (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb"/>
                <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:"#6b7280"}}/>
                <Radar dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25}/>
                <Tooltip formatter={v=>[`${v?.toFixed(1)}`,"Score"]}/>
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {bench && (
        <div className="card mb-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><TrendingUp size={16}/>Peer Benchmark</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div><p className="text-2xl font-bold text-indigo-600">#{bench.rank_in_batch}</p><p className="text-xs text-gray-500">Batch Rank</p></div>
            <div><p className="text-2xl font-bold text-green-600">{bench.percentile}%</p><p className="text-xs text-gray-500">Percentile</p></div>
            <div><p className="text-2xl font-bold text-gray-700">{bench.batch_average}</p><p className="text-xs text-gray-500">Batch Avg</p></div>
            <div><p className="text-2xl font-bold text-yellow-600">{bench.batch_top_10_avg}</p><p className="text-xs text-gray-500">Top 10% Avg</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Code2 size={16}/>LeetCode</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-500 text-xs">Total</p><p className="font-bold text-lg">{coding.total_solved}</p></div>
            <div className="p-3 bg-green-50 rounded-lg"><p className="text-green-600 text-xs">Easy</p><p className="font-bold text-lg text-green-700">{coding.easy_solved}</p></div>
            <div className="p-3 bg-yellow-50 rounded-lg"><p className="text-yellow-600 text-xs">Medium</p><p className="font-bold text-lg text-yellow-700">{coding.medium_solved}</p></div>
            <div className="p-3 bg-red-50 rounded-lg"><p className="text-red-600 text-xs">Hard</p><p className="font-bold text-lg text-red-700">{coding.hard_solved}</p></div>
          </div>
          {coding.weak_topics?.length>0&&<div className="mt-3 flex flex-wrap gap-1">{coding.weak_topics.map(t=><span key={t} className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">{t}</span>)}</div>}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><GitBranch size={16}/>GitHub</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-500 text-xs">Repos</p><p className="font-bold text-lg">{github.repo_count}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-gray-500 text-xs">Commits</p><p className="font-bold text-lg">{github.total_commits}</p></div>
          </div>
          {github.languages_used?.length>0&&<div className="mt-3 flex flex-wrap gap-1">{github.languages_used.slice(0,6).map(l=><span key={l} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{l}</span>)}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><Award size={16}/>Certifications ({certifications.length})</h3>
          {certifications.length===0?<p className="text-sm text-gray-400">None added</p>:
            <ul className="space-y-1">{certifications.map((c,i)=><li key={i} className="text-sm flex items-center gap-2"><span className="text-green-500">✓</span>{c.title} — {c.issuer}</li>)}</ul>}
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3"><FolderOpen size={16}/>Projects ({projects.length})</h3>
          {projects.length===0?<p className="text-sm text-gray-400">None added</p>:
            <ul className="space-y-1">{projects.map((p,i)=><li key={i} className="text-sm flex items-center gap-2"><span className="text-indigo-500">▸</span>{p.title}{p.is_featured&&<span className="text-yellow-500 text-xs">★</span>}</li>)}</ul>}
        </div>
      </div>

      {recent_interviews?.length>0&&(
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4"><Video size={16}/>Recent Interviews</h3>
          <div className="space-y-2">
            {recent_interviews.map((s,i)=>(
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div><p className="text-sm font-medium text-gray-800 capitalize">{s.session_type?.replace("_"," ")}</p><p className="text-xs text-gray-400">{s.created_at?.slice(0,10)}</p></div>
                <div className="text-right"><p className="font-bold text-indigo-600">{s.overall_score?.toFixed(0)||"—"}</p><p className="text-xs text-gray-400">/ 100</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
