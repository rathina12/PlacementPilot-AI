"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, ProgressBar } from "@/components/ui";
import { adminAPI } from "@/lib/api";
import { BookOpen, Search } from "lucide-react";

export default function AdminBatchesPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");

  useEffect(()=>{adminAPI.getDashboard().then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoading(false));},[]);

  const batches=(data?.batch_stats||[]).filter(b=>search===""||b.batch_name.toLowerCase().includes(search.toLowerCase())||b.branch.toLowerCase().includes(search.toLowerCase())||b.mentor_name.toLowerCase().includes(search.toLowerCase()));

  if(loading)return<DashboardLayout requiredRole="admin"><div className="flex justify-center py-16"><LoadingSpinner size={32}/></div></DashboardLayout>;

  return(
    <DashboardLayout requiredRole="admin">
      <SectionHeader title="All Batches" subtitle={`${data?.batch_stats?.length||0} batches`}/>
      <div className="relative mb-5 max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search batch, branch, mentor..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      {batches.length===0?<EmptyState icon={BookOpen} title="No batches found"/>
      :(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(b=>{const pr=b.total_students>0?Math.round((b.placed_count/b.total_students)*100):0;return(
            <div key={b.batch_id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg"><BookOpen size={18} className="text-indigo-600"/></div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{b.branch} · Y{b.year}{b.section}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{b.batch_name}</h3>
              <p className="text-xs text-gray-500 mb-3">Mentor: {b.mentor_name}</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                <div className="bg-gray-50 rounded-lg py-2"><p className="font-bold text-gray-800">{b.total_students}</p><p className="text-gray-400">Students</p></div>
                <div className="bg-green-50 rounded-lg py-2"><p className="font-bold text-green-700">{b.placed_count}</p><p className="text-green-500">Placed</p></div>
                <div className="bg-indigo-50 rounded-lg py-2"><p className="font-bold text-indigo-700">{b.avg_readiness_score}</p><p className="text-indigo-400">Avg Score</p></div>
              </div>
              <div><div className="flex justify-between text-xs text-gray-500 mb-1"><span>Placement Rate</span><span>{pr}%</span></div><ProgressBar value={pr} showLabel={false}/></div>
            </div>
          );})}
        </div>
      )}
    </DashboardLayout>
  );
}
