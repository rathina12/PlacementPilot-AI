"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, RiskBadge } from "@/components/ui";
import { mentorsAPI } from "@/lib/api";
import { AlertTriangle, ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function AtRiskPage() {
  const [students,setStudents]=useState([]);
  const [loading, setLoading]=useState(true);

  useEffect(()=>{mentorsAPI.getAtRisk().then(r=>setStudents(r.data)).catch(()=>{}).finally(()=>setLoading(false));},[]);

  return(
    <DashboardLayout requiredRole="mentor">
      <SectionHeader title="Students Needing Attention" subtitle="Readiness below 50% — SMS alerts have been sent"/>
      {loading?<div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>
      :students.length===0?<EmptyState icon={CheckCircle} title="All students on track!" description="No students flagged for low readiness"/>
      :(
        <div className="space-y-3">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-800 flex items-center gap-2">
            <AlertTriangle size={16}/>{students.length} student{students.length>1?"s":""} flagged. SMS alerts sent.
          </div>
          {students.map(({student:s,readiness_score,risk_level})=>(
            <div key={s.id} className="card border-l-4 border-red-400">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">{s.name.charAt(0)}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="text-sm text-gray-500">{s.roll_number} · {s.branch} Year {s.year}{s.section}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center"><p className="text-2xl font-bold text-red-600">{readiness_score?.toFixed(0)}</p><p className="text-xs text-gray-400">/ 100</p></div>
                  <RiskBadge risk={risk_level}/>
                  <Link href={`/mentor/students/${s.id}`} className="btn-secondary text-sm">View <ChevronRight size={14}/></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
