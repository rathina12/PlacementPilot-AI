"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { StatCard, SectionHeader, ProgressBar, LoadingSpinner, PlacementBadge, RiskBadge } from "@/components/ui";
import { adminAPI } from "@/lib/api";
import { Users, GraduationCap, BookOpen, TrendingUp, CheckCircle, XCircle, MinusCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [dist,    setDist]    = useState(null);
  const [top,     setTop]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded,setExpanded]= useState({});
  const [branchData,setBranchData]=useState({});

  useEffect(()=>{
    Promise.allSettled([adminAPI.getDashboard(),adminAPI.getReadinessDist(),adminAPI.getTopPerformers({limit:10})])
      .then(([dr,distr,tr])=>{
        if(dr.status==="fulfilled")setData(dr.value.data);
        if(distr.status==="fulfilled")setDist(distr.value.data);
        if(tr.status==="fulfilled")setTop(tr.value.data);
      }).finally(()=>setLoading(false));
  },[]);

  const toggleBranch=async(branch)=>{
    const isOpen=expanded[branch];
    setExpanded(p=>({...p,[branch]:!isOpen}));
    if(!isOpen&&!branchData[branch]){
      try{const r=await adminAPI.getBranchOverview(branch);setBranchData(p=>({...p,[branch]:r.data}));}catch(_){}
    }
  };

  if(loading)return<DashboardLayout requiredRole="admin"><div className="flex justify-center py-20"><LoadingSpinner size={36}/></div></DashboardLayout>;

  const pieData=data?[
    {name:"Placed",value:data.placement_status.placed,color:"#22c55e"},
    {name:"Not Placed",value:data.placement_status.not_placed,color:"#ef4444"},
    {name:"Not Interested",value:data.placement_status.not_interested,color:"#6b7280"},
    {name:"In Progress",value:data.placement_status.in_progress,color:"#3b82f6"},
  ]:[];

  const distData=dist?Object.entries(dist.distribution).map(([range,count])=>({range,count})):[];

  return(
    <DashboardLayout requiredRole="admin">
      <SectionHeader title="Platform Overview" subtitle="College-wide placement and readiness analytics"/>

      {data&&(
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <StatCard label="Total Students" value={data.total_students}              icon={Users}         color="indigo"/>
            <StatCard label="Total Mentors"  value={data.total_mentors}               icon={GraduationCap} color="info"/>
            <StatCard label="Total Batches"  value={data.total_batches}               icon={BookOpen}      color="warning"/>
            <StatCard label="Avg Readiness"  value={`${data.avg_readiness_score}/100`}icon={TrendingUp}    color="success"/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card flex items-center gap-3"><div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="text-green-600" size={20}/></div><div><p className="text-2xl font-bold">{data.placement_status.placed}</p><p className="text-xs text-gray-500">Placed</p></div></div>
            <div className="card flex items-center gap-3"><div className="p-2 bg-red-50 rounded-lg"><XCircle className="text-red-600" size={20}/></div><div><p className="text-2xl font-bold">{data.placement_status.not_placed}</p><p className="text-xs text-gray-500">Not Placed</p></div></div>
            <div className="card flex items-center gap-3"><div className="p-2 bg-gray-50 rounded-lg"><MinusCircle className="text-gray-500" size={20}/></div><div><p className="text-2xl font-bold">{data.placement_status.not_interested}</p><p className="text-xs text-gray-500">Not Interested</p></div></div>
            <div className="card flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-lg"><Clock className="text-blue-600" size={20}/></div><div><p className="text-2xl font-bold">{data.placement_status.in_progress}</p><p className="text-xs text-gray-500">In Progress</p></div></div>
          </div>
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Placement Status</h3>
          <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>
        </div>
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Readiness Distribution</h3>
          <ResponsiveContainer width="100%" height={260}><BarChart data={distData}><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis dataKey="range" tick={{fontSize:11}}/><YAxis tick={{fontSize:12}}/><Tooltip/><Bar dataKey="count" fill="#6366f1" radius={[6,6,0,0]} name="Students"/></BarChart></ResponsiveContainer>
        </div>
      </div>

      {/* Branch Stats */}
      {data?.branch_stats?.length>0&&(
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-gray-900">Branch-wise Overview</h3>
          {data.branch_stats.map(b=>(
            <div key={b.branch} className="card p-0 overflow-hidden">
              <button onClick={()=>toggleBranch(b.branch)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center gap-4">
                  <h3 className="font-semibold text-gray-900 text-lg">{b.branch}</h3>
                  <span className="text-sm text-gray-500">{b.total_students} students</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center hidden md:block"><p className="font-bold text-green-600">{b.placed_count}</p><p className="text-xs text-gray-400">Placed</p></div>
                  <div className="text-center hidden md:block"><p className="font-bold text-indigo-600">{b.avg_readiness_score}/100</p><p className="text-xs text-gray-400">Avg Readiness</p></div>
                  {expanded[b.branch]?<ChevronUp size={18} className="text-gray-400"/>:<ChevronDown size={18} className="text-gray-400"/>}
                </div>
              </button>
              {expanded[b.branch]&&branchData[b.branch]&&(
                <div className="border-t border-gray-100 p-5">
                  {branchData[b.branch].years?.map(yr=>(
                    <div key={yr.year} className="mb-5">
                      <div className="flex items-center gap-4 mb-3">
                        <h4 className="font-semibold text-gray-800">Year {yr.year}</h4>
                        <span className="text-sm text-green-600">{yr.placed||0} placed</span>
                        <span className="text-sm text-gray-500">• {yr.total} total</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="bg-gray-50">
                            {["Name","Roll No","Sec","Status","Company","Package","Score","Risk"].map(h=><th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>)}
                          </tr></thead>
                          <tbody>
                            {yr.students?.map(s=>(
                              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2 px-3 font-medium text-gray-800">{s.name}</td>
                                <td className="py-2 px-3 text-gray-500 text-xs">{s.roll_number}</td>
                                <td className="py-2 px-3 text-gray-500">{s.section}</td>
                                <td className="py-2 px-3"><PlacementBadge status={s.placement_status}/></td>
                                <td className="py-2 px-3 text-gray-500 text-xs">{s.placed_company||"—"}</td>
                                <td className="py-2 px-3 text-gray-500 text-xs">{s.placed_package_lpa?`${s.placed_package_lpa} LPA`:"—"}</td>
                                <td className="py-2 px-3"><span className={`font-bold text-sm ${s.readiness_score>=70?"text-green-600":s.readiness_score>=50?"text-yellow-600":"text-red-500"}`}>{s.readiness_score?.toFixed(0)}</span></td>
                                <td className="py-2 px-3"><RiskBadge risk={s.risk_level}/></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Top Performers */}
      {top.length>0&&(
        <div className="card">
          <SectionHeader title="Top Performers"/>
          <div className="space-y-3">
            {top.map(s=>(
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${s.rank<=3?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-600"}`}>{s.rank}</span>
                  <div><p className="font-medium text-gray-800 text-sm">{s.name}</p><p className="text-xs text-gray-500">{s.branch} · Year {s.year}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <PlacementBadge status={s.placement_status}/>
                  <div className="text-right"><p className="font-bold text-indigo-600">{s.readiness_score?.toFixed(0)}</p><p className="text-xs text-gray-400">/ 100</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
