"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, ProgressBar, LoadingSpinner, EmptyState, StatCard } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Code2, RefreshCw, TrendingUp, Target, Zap, Award } from "lucide-react";

const TOPICS = { arrays:"Arrays",strings:"Strings",linked_lists:"Linked Lists",stack:"Stack",queue:"Queue",hashing:"Hashing",trees:"Trees",bst:"BST",heap:"Heap",graphs:"Graphs",dp:"Dynamic Programming",greedy:"Greedy",binary_search:"Binary Search",sorting:"Sorting",recursion:"Recursion" };
const LEVELS = [{level:1,title:"Foundation",topics:["Arrays","Strings","Linked Lists"],color:"bg-green-100 text-green-700"},{level:2,title:"Intermediate",topics:["Stack","Queue","Hashing"],color:"bg-blue-100 text-blue-700"},{level:3,title:"Advanced Trees",topics:["Trees","BST","Heap"],color:"bg-purple-100 text-purple-700"},{level:4,title:"Expert",topics:["Graphs","Dynamic Programming","Greedy"],color:"bg-orange-100 text-orange-700"}];
const COMPANIES = {TCS:["Arrays","Strings","Linked Lists","Basic DP"],Infosys:["Arrays","Hashing","Trees"],Zoho:["Arrays","Strings","DP","Greedy"],Amazon:["Arrays","Trees","Graphs","DP"],Google:["Graphs","DP","Trees","Heap","Binary Search"]};

export default function CodingPage() {
  const [coding,  setCoding]  = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    studentsAPI.getMe().then(r => setStudent(r.data)).catch(()=>{}).finally(() => setLoading(false));
    fetchCoding();
  }, []);

  const fetchCoding = async () => {
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL||"http://localhost:8000/api"}/students/me/coding-profile`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (r.ok) setCoding(await r.json());
    } catch (_) {}
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const r = await studentsAPI.syncLeetCode();
      toast.success("LeetCode synced!");
      setCoding(r.data?.data || null);
      const sr = await studentsAPI.getMe();
      setStudent(sr.data);
    } catch (err) { toast.error(err.response?.data?.detail || "Sync failed - check username"); }
    setSyncing(false);
  };

  if (loading) return <DashboardLayout requiredRole="student"><div className="flex justify-center py-20"><LoadingSpinner size={32}/></div></DashboardLayout>;

  return (
    <DashboardLayout requiredRole="student">
      <div className="flex items-start justify-between mb-6">
        <SectionHeader title="Coding Profile" subtitle="LeetCode stats and DSA roadmap" />
        <button onClick={syncNow} disabled={syncing} className="btn-primary">
          {syncing ? <><LoadingSpinner size={14}/>Syncing...</> : <><RefreshCw size={14}/>Sync LeetCode</>}
        </button>
      </div>

      {!student?.leetcode_username ? (
        <div className="card text-center py-12">
          <Code2 size={40} className="text-gray-300 mx-auto mb-3"/>
          <p className="font-semibold text-gray-700">No LeetCode username connected</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Add your LeetCode username in Profile Settings</p>
          <a href="/student/profile" className="btn-primary inline-flex">Go to Profile</a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Solved"   value={coding?.total_solved   || 0} icon={Code2}      color="indigo" />
            <StatCard label="Easy"           value={coding?.easy_solved    || 0} icon={Zap}        color="success" />
            <StatCard label="Medium"         value={coding?.medium_solved  || 0} icon={TrendingUp}  color="warning" />
            <StatCard label="Hard"           value={coding?.hard_solved    || 0} icon={Target}     color="danger" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Contest Rating" value={coding?.contest_rating || "—"} icon={Award}    color="info" />
            <StatCard label="Daily Streak"   value={`${coding?.daily_streak||0} days`} icon={Zap}  color="warning" />
            <StatCard label="Consistency"    value={`${coding?.consistency_score||0}%`} icon={TrendingUp} color="success" />
          </div>

          {coding?.topic_progress && Object.keys(coding.topic_progress).length > 0 && (
            <div className="card">
              <SectionHeader title="Topic Progress" subtitle="Problems solved per topic" />
              <div className="space-y-3">
                {Object.entries(TOPICS).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-4">
                    <span className="text-sm text-gray-600 w-36 flex-shrink-0">{label}</span>
                    <div className="flex-1"><ProgressBar value={coding.topic_progress[key]||0} max={20} showLabel={false}/></div>
                    <span className="text-sm font-medium text-gray-700 w-6 text-right">{coding.topic_progress[key]||0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {coding?.weak_topics?.length > 0 && (
            <div className="card border-l-4 border-orange-400">
              <h3 className="font-semibold text-orange-700 mb-3">⚠ Weak Topics — Focus Here</h3>
              <div className="flex flex-wrap gap-2">
                {coding.weak_topics.map(t => (
                  <span key={t} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm border border-orange-200">
                    {TOPICS[t] || t}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <SectionHeader title="LeetCode Roadmap" subtitle="Structured DSA learning path" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {LEVELS.map(l => (
                <div key={l.level} className={`p-4 rounded-xl ${l.color}`}>
                  <div className="text-xs font-bold mb-1">Level {l.level}</div>
                  <div className="font-semibold text-sm mb-2">{l.title}</div>
                  <ul className="space-y-1">{l.topics.map(t => <li key={t} className="text-xs">• {t}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHeader title="Company-wise Focus" subtitle="Topics asked by top companies" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(COMPANIES).map(([co, topics]) => (
                <div key={co} className="p-4 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-gray-800 mb-2">{co}</p>
                  <div className="flex flex-wrap gap-1">
                    {topics.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-white border border-gray-200 rounded-full text-gray-600">{t}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function getToken() {
  try { return JSON.parse(localStorage.getItem("sdt-auth"))?.state?.token || ""; } catch { return ""; }
}
