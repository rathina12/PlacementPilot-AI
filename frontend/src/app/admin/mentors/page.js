"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, Badge } from "@/components/ui";
import { adminAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { GraduationCap, Search, Users, ToggleLeft, ToggleRight } from "lucide-react";

export default function AdminMentorsPage() {
  const [mentors, setMentors]=useState([]);
  const [loading, setLoading]=useState(true);
  const [search,  setSearch] =useState("");

  useEffect(()=>{adminAPI.listMentors().then(r=>setMentors(r.data)).catch(()=>{}).finally(()=>setLoading(false));},[]);

  const toggle=async(id,cur)=>{
    try{const r=await adminAPI.toggleMentor(id);setMentors(p=>p.map(m=>m.id===id?{...m,is_active:r.data.is_active}:m));toast.success(`Mentor ${r.data.is_active?"activated":"deactivated"}`);}
    catch(_){toast.error("Action failed");}
  };

  const filtered=mentors.filter(m=>search===""||m.name.toLowerCase().includes(search.toLowerCase())||m.employee_id.toLowerCase().includes(search.toLowerCase()));

  return(
    <DashboardLayout requiredRole="admin">
      <SectionHeader title="Mentors" subtitle={`${mentors.length} registered`}/>
      <div className="relative mb-5 max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input className="input pl-9" placeholder="Search name or employee ID..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      {loading?<div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>
      :filtered.length===0?<EmptyState icon={GraduationCap} title="No mentors found"/>
      :(
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">{["Name","Employee ID","Email","Department","Students","Status","Action"].map(h=><th key={h} className="text-left py-3 px-4 font-medium text-gray-500">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(m=>(
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">{m.name.charAt(0)}</div><span className="font-medium text-gray-800">{m.name}</span></div></td>
                  <td className="py-3 px-4 text-gray-500">{m.employee_id}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{m.email}</td>
                  <td className="py-3 px-4 text-gray-600">{m.department}</td>
                  <td className="py-3 px-4"><div className="flex items-center gap-1 text-gray-600"><Users size={13}/>{m.student_count}</div></td>
                  <td className="py-3 px-4"><Badge variant={m.is_active?"success":"danger"}>{m.is_active?"Active":"Inactive"}</Badge></td>
                  <td className="py-3 px-4">
                    <button onClick={()=>toggle(m.id,m.is_active)} className={`flex items-center gap-1.5 text-xs font-medium ${m.is_active?"text-red-500 hover:text-red-700":"text-green-600 hover:text-green-700"}`}>
                      {m.is_active?<><ToggleRight size={14}/>Deactivate</>:<><ToggleLeft size={14}/>Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
