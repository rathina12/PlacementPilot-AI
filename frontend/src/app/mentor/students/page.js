"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, PlacementBadge } from "@/components/ui";
import { mentorsAPI } from "@/lib/api";
import { Users, Search, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function MentorStudentsPage() {
  const [students,setStudents]=useState([]);
  const [loading, setLoading]=useState(true);
  const [search,  setSearch] =useState("");
  const [filter,  setFilter] =useState("all");

  useEffect(()=>{mentorsAPI.getMyStudents().then(r=>setStudents(r.data)).catch(()=>{}).finally(()=>setLoading(false));}, []);

  const filtered=students.filter(s=>{
    const matchS=search===""||s.name.toLowerCase().includes(search.toLowerCase())||s.roll_number.toLowerCase().includes(search.toLowerCase());
    const matchF=filter==="all"||s.placement_status===filter;
    return matchS&&matchF;
  });

  return(
    <DashboardLayout requiredRole="mentor">
      <SectionHeader title="My Students" subtitle={`${students.length} assigned`}/>
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9" placeholder="Search by name or roll number..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <select className="input w-44" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="in_progress">In Progress</option>
          <option value="placed">Placed</option>
          <option value="not_placed">Not Placed</option>
          <option value="not_interested">Not Interested</option>
        </select>
      </div>
      {loading?<div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>
      :filtered.length===0?<EmptyState icon={Users} title="No students found"/>
      :(
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              {["Student","Roll No","Branch","Yr/Sec","Status","LeetCode","GitHub",""].map(h=><th key={h} className="text-left py-3 px-4 font-medium text-gray-500">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">{s.name.charAt(0)}</div><span className="font-medium text-gray-800">{s.name}</span></div></td>
                  <td className="py-3 px-4 text-gray-500">{s.roll_number}</td>
                  <td className="py-3 px-4 text-gray-600">{s.branch}</td>
                  <td className="py-3 px-4 text-gray-500">{s.year}{s.section}</td>
                  <td className="py-3 px-4"><PlacementBadge status={s.placement_status}/></td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{s.leetcode_username||"—"}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{s.github_username||"—"}</td>
                  <td className="py-3 px-4"><Link href={`/mentor/students/${s.id}`} className="flex items-center gap-1 text-indigo-600 text-xs font-medium">View<ChevronRight size={12}/></Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
