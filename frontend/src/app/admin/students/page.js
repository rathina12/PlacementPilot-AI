"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, PlacementBadge, RiskBadge } from "@/components/ui";
import { adminAPI } from "@/lib/api";
import { Users, Search } from "lucide-react";

export default function AdminStudentsPage() {
  const [students,setStudents]=useState([]);
  const [loading, setLoading]=useState(true);
  const [search,  setSearch] =useState("");
  const [filters, setFilters]=useState({branch:"",year:"",placement_status:""});

  useEffect(()=>{fetchStudents();},[filters]);
  const fetchStudents=async()=>{
    setLoading(true);
    try{const p={};if(filters.branch)p.branch=filters.branch;if(filters.year)p.year=filters.year;if(filters.placement_status)p.placement_status=filters.placement_status;const r=await adminAPI.listStudents(p);setStudents(r.data);}catch(_){}
    setLoading(false);
  };
  const filtered=students.filter(s=>search===""||s.name.toLowerCase().includes(search.toLowerCase())||s.roll_number.toLowerCase().includes(search.toLowerCase()));

  return(
    <DashboardLayout requiredRole="admin">
      <SectionHeader title="All Students" subtitle={`${students.length} total`}/>
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search name or roll number..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="input w-36" value={filters.branch} onChange={e=>setFilters(p=>({...p,branch:e.target.value}))}>
          <option value="">All Branches</option>
          {["CSE","ECE","EEE","MECH","CIVIL","IT","AIDS","AIML"].map(b=><option key={b}>{b}</option>)}
        </select>
        <select className="input w-28" value={filters.year} onChange={e=>setFilters(p=>({...p,year:e.target.value}))}>
          <option value="">All Years</option>
          {[1,2,3,4].map(y=><option key={y} value={y}>Year {y}</option>)}
        </select>
        <select className="input w-44" value={filters.placement_status} onChange={e=>setFilters(p=>({...p,placement_status:e.target.value}))}>
          <option value="">All Status</option>
          <option value="placed">Placed</option>
          <option value="not_placed">Not Placed</option>
          <option value="not_interested">Not Interested</option>
          <option value="in_progress">In Progress</option>
        </select>
      </div>
      {loading?<div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>
      :filtered.length===0?<EmptyState icon={Users} title="No students found" description="Try adjusting filters"/>
      :(
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Name","Roll No","Branch","Yr/Sec","Email","Status","Company","Package","Readiness","Risk"].map(h=><th key={h} className="text-left py-3 px-3 font-medium text-gray-500 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-800">{s.name}</td>
                  <td className="py-2.5 px-3 text-gray-500">{s.roll_number}</td>
                  <td className="py-2.5 px-3 text-gray-600">{s.branch}</td>
                  <td className="py-2.5 px-3 text-gray-500">{s.year}{s.section}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs max-w-32 truncate">{s.email}</td>
                  <td className="py-2.5 px-3"><PlacementBadge status={s.placement_status}/></td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">{s.placed_company||"—"}</td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">{s.placed_package_lpa?`${s.placed_package_lpa} LPA`:"—"}</td>
                  <td className="py-2.5 px-3"><span className={`font-semibold ${s.readiness_score>=70?"text-green-600":s.readiness_score>=50?"text-yellow-600":"text-red-600"}`}>{s.readiness_score?.toFixed(0)}/100</span></td>
                  <td className="py-2.5 px-3"><RiskBadge risk={s.risk_level}/></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2 px-3 pb-2">Showing {filtered.length} of {students.length}</p>
        </div>
      )}
    </DashboardLayout>
  );
}
