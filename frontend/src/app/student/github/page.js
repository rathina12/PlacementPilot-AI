"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, StatCard, LoadingSpinner, ProgressBar } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { GitBranch, RefreshCw, Star, Users, GitCommit, FolderOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function GithubPage() {
  const [github,  setGithub]  = useState(null);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const sr = await studentsAPI.getMe();
      setStudent(sr.data);
      const gr = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/students/me/github-profile`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (gr.ok) setGithub(await gr.json());
    } catch (_) {}
    setLoading(false);
  };

  const syncNow = async () => {
    setSyncing(true);
    try {
      const r = await studentsAPI.syncGitHub();
      toast.success("GitHub synced!");
      setGithub(r.data?.data || null);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Sync failed — check your GitHub username");
    }
    setSyncing(false);
  };

  // Build contribution chart data from weekly data
  const contribData = github?.contribution_data
    ? Object.entries(github.contribution_data)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-14)
        .map(([date, count]) => ({ date: date.slice(5), commits: count }))
    : [];

  if (loading) return (
    <DashboardLayout requiredRole="student">
      <div className="flex justify-center py-20"><LoadingSpinner size={32} /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout requiredRole="student">
      <div className="flex items-start justify-between mb-6">
        <SectionHeader title="GitHub Profile" subtitle="Repository and contribution statistics" />
        <button onClick={syncNow} disabled={syncing} className="btn-primary">
          {syncing ? <><LoadingSpinner size={14} /> Syncing...</> : <><RefreshCw size={14} /> Sync GitHub</>}
        </button>
      </div>

      {!student?.github_username ? (
        <div className="card text-center py-12">
          <GitBranch size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">No GitHub username connected</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Add your GitHub username in Profile Settings</p>
          <a href="/student/profile" className="btn-primary inline-flex">Go to Profile</a>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Repositories"  value={github?.repo_count    || 0} icon={FolderOpen} color="indigo" />
            <StatCard label="Total Commits" value={github?.total_commits || 0} icon={GitCommit}  color="success" />
            <StatCard label="Stars Earned"  value={github?.stars_received|| 0} icon={Star}       color="warning" />
            <StatCard label="Followers"     value={github?.followers     || 0} icon={Users}      color="info" />
          </div>

          {github?.languages_used?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Languages Used</h3>
              <div className="flex flex-wrap gap-2">
                {github.languages_used.map((lang, i) => {
                  const colors = ["bg-blue-100 text-blue-700","bg-green-100 text-green-700","bg-purple-100 text-purple-700","bg-orange-100 text-orange-700","bg-pink-100 text-pink-700","bg-yellow-100 text-yellow-700"];
                  return (
                    <span key={lang} className={`px-3 py-1.5 rounded-full text-sm font-medium ${colors[i % colors.length]}`}>
                      {lang}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {contribData.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Recent Contributions (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={contribData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="commits" fill="#6366f1" radius={[4, 4, 0, 0]} name="Commits" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!github && (
            <div className="card text-center py-8">
              <p className="text-gray-500">Click Sync GitHub to load your profile data</p>
            </div>
          )}

          <div className="card bg-indigo-50 border border-indigo-100">
            <h3 className="font-semibold text-indigo-800 mb-3">💡 Tips to Improve GitHub Score</h3>
            <ul className="space-y-2 text-sm text-indigo-700">
              <li>• Push code daily to maintain contribution streak</li>
              <li>• Add README files to all your repositories</li>
              <li>• Create at least 5 original (non-forked) repositories</li>
              <li>• Pin your best 6 projects on your GitHub profile</li>
              <li>• Contribute to open source projects</li>
            </ul>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function getToken() {
  try { return JSON.parse(localStorage.getItem("sdt-auth"))?.state?.token || ""; } catch { return ""; }
}
