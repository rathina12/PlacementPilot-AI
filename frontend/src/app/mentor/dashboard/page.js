"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { StatCard, SectionHeader, LoadingSpinner, EmptyState, PlacementBadge } from "@/components/ui";
import { mentorsAPI } from "@/lib/api";
import { Users, TrendingUp, AlertTriangle, CheckCircle, ChevronRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import useAuthStore from "@/store/authStore";

export default function MentorDashboard() {
  const { getName } = useAuthStore();
  const [stats,    setStats]    = useState(null);
  const [atRisk,   setAtRisk]   = useState([]);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sr, rr, ar] = await Promise.allSettled([
        mentorsAPI.getDashboard(), mentorsAPI.getMyStudents(), mentorsAPI.getAtRisk(),
      ]);
      if (sr.status === "fulfilled") setStats(sr.value.data);
      if (rr.status === "fulfilled") setStudents(rr.value.data);
      if (ar.status === "fulfilled") setAtRisk(ar.value.data);
    } catch (_) {}
    setLoading(false);
  };

  if (loading) return <DashboardLayout requiredRole="mentor"><div className="flex justify-center py-20"><LoadingSpinner size={36} /></div></DashboardLayout>;

  return (
    <DashboardLayout requiredRole="mentor">
      <div className="mb-6">
        <h1 className="page-title">Welcome, {getName().split(" ")[0]} 👋</h1>
        <p className="text-gray-500 mt-1">Monitor your students&apos; placement readiness</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <StatCard label="Total Students"  value={stats.total_students}               icon={Users}         color="indigo" />
          <StatCard label="Active"          value={stats.active_students}              icon={CheckCircle}   color="success" />
          <StatCard label="Placement Ready" value={stats.placement_ready}              icon={TrendingUp}    color="info" />
          <StatCard label="Needs Attention" value={stats.needs_attention}              icon={AlertTriangle} color="danger" />
          <StatCard label="Avg Readiness"   value={`${stats.avg_readiness_score}/100`} icon={BarChart3}     color="warning" />
          <StatCard label="Placed"          value={stats.placed_count}                 icon={CheckCircle}   color="success" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At Risk */}
        <div className="card">
          <SectionHeader title="⚠ Needs Attention" subtitle={`${atRisk.length} students flagged`} />
          {atRisk.length === 0 ? (
            <EmptyState icon={CheckCircle} title="All on track!" description="No students flagged" />
          ) : (
            <div className="space-y-3">
              {atRisk.slice(0, 5).map(({ student: s, readiness_score }) => (
                <Link key={s.id} href={`/mentor/students/${s.id}`}
                  className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors block">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.roll_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{readiness_score?.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">/ 100</p>
                  </div>
                </Link>
              ))}
              {atRisk.length > 5 && (
                <Link href="/mentor/at-risk" className="text-indigo-600 text-sm font-medium flex items-center gap-1 hover:underline">
                  View All <ChevronRight size={14} />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="lg:col-span-2 card">
          <SectionHeader title="My Students" subtitle={`${students.length} total`}
            action={<Link href="/mentor/students" className="btn-secondary text-xs">View All <ChevronRight size={12} /></Link>} />
          {students.length === 0 ? (
            <EmptyState icon={Users} title="No students assigned" description="Students appear here once they select you as mentor" />
          ) : (
            <div className="space-y-2">
              {students.slice(0, 8).map(s => (
                <Link key={s.id} href={`/mentor/students/${s.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 block">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.roll_number} · {s.branch} {s.year}{s.section}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PlacementBadge status={s.placement_status} />
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
