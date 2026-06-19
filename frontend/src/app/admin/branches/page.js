"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, ProgressBar, PlacementBadge, RiskBadge } from "@/components/ui";
import { adminAPI } from "@/lib/api";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminBranchesPage() {
  const [dashboard,  setDashboard]  = useState(null);
  const [branchData, setBranchData] = useState({});
  const [expanded,   setExpanded]   = useState({});
  const [loading,    setLoading]    = useState(true);

  useEffect(()=>{adminAPI.getDashboard().then(r=>setDashboard(r.data)).catch(()=>{}).finally(()=>setLoading(false));},[]);

  const toggle=async(branch)=>{
    const isOpen=expanded[branch];
    setExpanded(p=>({...p,[branch]:!isOpen}));
    if(!isOpen&&!branchData[branch]){
      try{const r=await adminAPI.getBranchOverview(branch);setBranchData(p=>({...p,[branch]:r.data}));}catch(_){}
    }
  };

  if(loading)return<DashboardLayout requiredRole="admin"><div className="flex justify-center py-16"><LoadingSpinner size={32}/></div></DashboardLayout>;

  return(
    <DashboardLayout requiredRole="admin">
      <SectionHeader title="Branch-wise View" subtitle="Click any branch for detailed student data"/>
      <div className="space-y-4">
        {(dashboard?.branch_stats||[]).map(b=>(
          <div key={b.branch} className="card p-0 overflow-hidden">
            <button onClick={()=>toggle(b.branch)} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 text-left">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-indigo-50 rounded-xl"><Building2 size={20} className="text-indigo-600"/></div>
                <div><h3 className="font-semibold text-gray-900 text-lg">{b.branch}</h3><p className="text-sm text-gray-500">{b.total_students} students</p></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center hidden md:block"><p className="font-bold text-green-600">{b.placed_count}</p><p className="text-xs text-gray-400">Placed</p></div>
                <div className="text-center hidden md:block"><p className="font-bold text-indigo-600">{b.avg_readiness_score}/100</p><p className="text-xs text-gray-400">Avg Readiness</p></div>
                <div className="w-24 hidden md:block">
                  <ProgressBar value={b.total_students?Math.round((b.placed_count/b.total_students)*100):0} showLabel={false}/>
                  <p className="text-xs text-gray-400 mt-0.5 text-center">{b.total_students?Math.round((b.placed_count/b.total_students)*100):0}% placed</p>
                </div>
                {expanded[b.branch]?<ChevronUp size={18} className="text-gray-400"/>:<ChevronDown size={18} className="text-gray-400"/>}
              </div>
            </button>
            {expanded[b.branch]&&(
              <div className="border-t border-gray-100 p-5">
                {!branchData[b.branch]?<div className="flex justify-center py-6"><LoadingSpinner size={24}/></div>
                :(branchData[b.branch].years||[]).map(yr=>(
                  <div key={yr.year} className="mb-5">
                    <div className="flex items-center gap-4 mb-3 pb-2 border-b border-gray-100">
                      <h4 className="font-semibold text-gray-800">Year {yr.year}</h4>
                      <span className="text-sm text-green-600">✓ {yr.placed||0} placed</span>
                      <span className="text-sm text-gray-500">• {yr.total} total</span>
                      <span className="text-sm text-gray-400">• Avg: {yr.avg_readiness||0}/100</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="bg-gray-50">{["Name","Roll No","Sec","Status","Company","Package","Score","Risk"].map(h=><th key={h} className="text-left py-2 px-3 text-gray-500 font-medium">{h}</th>)}</tr></thead>
                        <tbody>
                          {(yr.students||[]).map(s=>(
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
    </DashboardLayout>
  );
}
