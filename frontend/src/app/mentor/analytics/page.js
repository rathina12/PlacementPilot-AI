"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, StatCard } from "@/components/ui";
import { mentorsAPI } from "@/lib/api";
import { Users, TrendingUp, Award, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export default function MentorAnalyticsPage() {
  const [stats,    setStats]    = useState(null);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(()=>{
    Promise.allSettled([mentorsAPI.getDashboard(),mentorsAPI.getMyStudents()])
      .then(([sr,rr])=>{
        if(sr.status==="fulfilled")setStats(sr.value.data);
        if(rr.status==="fulfilled")setStudents(rr.value.data);
      }).finally(()=>setLoading(false));
  },[]);

  const pieData=stats?[
    {name:"Placed",value:stats.placed_count||0,color:"#22c55e"},
    {name:"Ready",value:stats.placement_ready||0,color:"#3b82f6"},
    {name:"Needs Attention",value:stats.needs_attention||0,color:"#f59e0b"},
    {name:"Others",value:Math.max(0,(stats.total_students||0)-(stats.placed_count||0)-(stats.placement_ready||0)-(stats.needs_attention||0)),color:"#6b7280"},
  ]:[];

  const yearMap=students.reduce((acc,s)=>{const yr=`Year ${s.year}`;acc[yr]=(acc[yr]||0)+1;return acc;},{});
  const yearData=Object.entries(yearMap).map(([year,count])=>({year,count}));

  if(loading)return<DashboardLayout requiredRole="mentor"><div className="flex justify-center py-16"><LoadingSpinner size={32}/></div></DashboardLayout>;

  return(
    <DashboardLayout requiredRole="mentor">
      <SectionHeader title="Analytics" subtitle="Your students performance overview"/>
      {stats&&(
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Students"  value={stats.total_students}               icon={Users}      color="indigo"/>
          <StatCard label="Placement Ready" value={stats.placement_ready}              icon={Award}      color="success"/>
          <StatCard label="Needs Attention" value={stats.needs_attention}              icon={BarChart3}  color="danger"/>
          <StatCard label="Avg Readiness"   value={`${stats.avg_readiness_score}/100`} icon={TrendingUp} color="info"/>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Placement Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip/><Legend/>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Students by Year</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="year" tick={{fontSize:12}}/><YAxis tick={{fontSize:12}}/>
              <Tooltip/>
              <Bar dataKey="count" fill="#6366f1" radius={[6,6,0,0]} name="Students"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
}
