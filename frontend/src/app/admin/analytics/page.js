"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner } from "@/components/ui";
import { adminAPI } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function AdminAnalyticsPage() {
  const [trends,  setTrends]  = useState([]);
  const [dist,    setDist]    = useState(null);
  const [top,     setTop]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    Promise.allSettled([adminAPI.getPlacementTrends(),adminAPI.getReadinessDist(),adminAPI.getTopPerformers({limit:20})])
      .then(([tr,dr,topr])=>{
        if(tr.status==="fulfilled")setTrends(tr.value.data);
        if(dr.status==="fulfilled")setDist(dr.value.data);
        if(topr.status==="fulfilled")setTop(topr.value.data);
      }).finally(()=>setLoading(false));
  },[]);

  const distData=dist?Object.entries(dist.distribution).map(([range,count])=>({range,count})):[];
  const branchMap={};
  trends.forEach(t=>{if(!branchMap[t.branch])branchMap[t.branch]={branch:t.branch,placed:0,total:0,scores:[]};branchMap[t.branch].placed+=t.placed;branchMap[t.branch].total+=t.total;branchMap[t.branch].scores.push(t.avg_readiness);});
  const branchRates=Object.values(branchMap).map(b=>({branch:b.branch,placement_rate:b.total?Math.round((b.placed/b.total)*100):0,avg_readiness:b.scores.length?Math.round(b.scores.reduce((a,v)=>a+v,0)/b.scores.length):0}));

  if(loading)return<DashboardLayout requiredRole="admin"><div className="flex justify-center py-16"><LoadingSpinner size={32}/></div></DashboardLayout>;

  return(
    <DashboardLayout requiredRole="admin">
      <SectionHeader title="Platform Analytics" subtitle="In-depth placement and readiness trends"/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Readiness Score Distribution</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={distData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="range" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip/><Bar dataKey="count" fill="#6366f1" radius={[6,6,0,0]} name="Students"/></BarChart></ResponsiveContainer>
        </div>
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Placement Rate by Branch</h3>
          <ResponsiveContainer width="100%" height={280}><BarChart data={branchRates}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="branch" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/><Tooltip formatter={(v,n)=>[`${v}%`,n==="placement_rate"?"Placement %":"Avg Readiness"]}/><Legend/><Bar dataKey="placement_rate" fill="#22c55e" radius={[6,6,0,0]} name="Placement %"/><Bar dataKey="avg_readiness" fill="#3b82f6" radius={[6,6,0,0]} name="Avg Readiness"/></BarChart></ResponsiveContainer>
        </div>
      </div>
      {top.length>0&&(
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Top 20 Performers</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">{["Rank","Name","Roll No","Branch","Year","Score"].map(h=><th key={h} className="text-left py-2 px-3 font-medium text-gray-500">{h}</th>)}</tr></thead>
              <tbody>
                {top.map(s=>(
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 px-3"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.rank<=3?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-600"}`}>{s.rank}</span></td>
                    <td className="py-2 px-3 font-medium text-gray-800">{s.name}</td>
                    <td className="py-2 px-3 text-gray-500">{s.roll_number}</td>
                    <td className="py-2 px-3 text-gray-600">{s.branch}</td>
                    <td className="py-2 px-3 text-gray-500">{s.year}</td>
                    <td className="py-2 px-3 font-bold text-indigo-600">{s.readiness_score?.toFixed(0)}/100</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
