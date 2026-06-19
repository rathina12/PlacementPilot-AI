"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, StatCard, PlacementBadge } from "@/components/ui";
import { adminAPI } from "@/lib/api";
import { CheckCircle, XCircle, MinusCircle, Clock, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function AdminPlacementsPage() {
  const [students,setStudents]=useState([]);
  const [loading, setLoading]=useState(true);
  const [search,  setSearch] =useState("");
  const [sf,      setSf]     =useState("all");

  useEffect(()=>{adminAPI.listStudents({}).then(r=>setStudents(r.data)).catch(()=>{}).finally(()=>setLoading(false));},[]);

  const placed        =students.filter(s=>s.placement_status==="placed");
  const notPlaced     =students.filter(s=>s.placement_status==="not_placed");
  const notInterested =students.filter(s=>s.placement_status==="not_interested");
  const inProgress    =students.filter(s=>s.placement_status==="in_progress");

  const pieData=[
    {name:"Placed",value:placed.length,color:"#22c55e"},
    {name:"Not Placed",value:notPlaced.length,color:"#ef4444"},
    {name:"Not Interested",value:notInterested.length,color:"#6b7280"},
    {name:"In Progress",value:inProgress.length,color:"#3b82f6"},
  ];

  const companyMap={};
  placed.forEach(s=>{if(s.placed_company)companyMap[s.placed_company]=(companyMap[s.placed_company]||0)+1;});
  const companyData=Object.entries(companyMap).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([c,count])=>({company:c,count}));
  const avgPkg=placed.filter(s=>s.placed_package_lpa).length>0?(placed.reduce((s,x)=>s+(x.placed_package_lpa||0),0)/placed.filter(s=>s.placed_package_lpa).length).toFixed(1):"—";

  const filtered=students.filter(s=>{
    const ms=search===""||s.name.toLowerCase().includes(search.toLowerCase())||s.roll_number.toLowerCase().includes(search.toLowerCase())||(s.placed_company||"").toLowerCase().includes(search.toLowerCase());
    const mf=sf==="all"||s.placement_status===sf;
    return ms&&mf;
  });

  if(loading)return<DashboardLayout requiredRole="admin"><div className="flex justify-center py-16"><LoadingSpinner size={32}/></div></DashboardLayout>;

  return(
    <DashboardLayout requiredRole="admin">
      <SectionHeader title="Placements" subtitle="Track placement outcomes across the college"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Placed"         value={placed.length}        icon={CheckCircle}  color="success"/>
        <StatCard label="Not Placed"     value={notPlaced.length}     icon={XCircle}      color="danger"/>
        <StatCard label="Not Interested" value={notInterested.length} icon={MinusCircle}  color="gray"/>
        <StatCard label="In Progress"    value={inProgress.length}    icon={Clock}        color="info"/>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center"><p className="text-3xl font-bold text-green-600">{students.length>0?Math.round((placed.length/students.length)*100):0}%</p><p className="text-sm text-gray-500 mt-1">Placement Rate</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-indigo-600">{avgPkg} LPA</p><p className="text-sm text-gray-500 mt-1">Average Package</p></div>
        <div className="card text-center"><p className="text-3xl font-bold text-gray-700">{Object.keys(companyMap).length}</p><p className="text-sm text-gray-500 mt-1">Companies Recruited</p></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={250}><PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={3} dataKey="value">{pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer>
        </div>
        {companyData.length>0&&(
          <div className="card"><h3 className="font-semibold text-gray-900 mb-4">Top Recruiting Companies</h3>
            <ResponsiveContainer width="100%" height={250}><BarChart data={companyData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/><XAxis type="number" tick={{fontSize:12}}/><YAxis type="category" dataKey="company" tick={{fontSize:11}} width={90}/><Tooltip/><Bar dataKey="count" fill="#6366f1" radius={[0,6,6,0]} name="Students"/></BarChart></ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="card">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <select className="input w-44" value={sf} onChange={e=>setSf(e.target.value)}>
            <option value="all">All</option><option value="placed">Placed</option><option value="not_placed">Not Placed</option><option value="not_interested">Not Interested</option><option value="in_progress">In Progress</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Name","Roll No","Branch","Year","Status","Company","Package","Readiness"].map(h=><th key={h} className="text-left py-3 px-3 font-medium text-gray-500">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-800">{s.name}</td>
                  <td className="py-2.5 px-3 text-gray-500">{s.roll_number}</td>
                  <td className="py-2.5 px-3 text-gray-600">{s.branch}</td>
                  <td className="py-2.5 px-3 text-gray-500">{s.year}</td>
                  <td className="py-2.5 px-3"><PlacementBadge status={s.placement_status}/></td>
                  <td className="py-2.5 px-3 text-gray-600 font-medium">{s.placed_company||"—"}</td>
                  <td className="py-2.5 px-3 text-gray-600">{s.placed_package_lpa?`${s.placed_package_lpa} LPA`:"—"}</td>
                  <td className="py-2.5 px-3"><span className={`font-semibold ${s.readiness_score>=70?"text-green-600":s.readiness_score>=50?"text-yellow-600":"text-red-600"}`}>{s.readiness_score?.toFixed(0)}/100</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
