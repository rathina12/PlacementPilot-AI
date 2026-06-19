"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, Modal, ProgressBar, Badge } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Target, Plus, CheckCircle, Code2, Award, Video, BookOpen } from "lucide-react";

const CATS=[{v:"leetcode",l:"LeetCode",icon:Code2,c:"text-purple-600"},{v:"certification",l:"Certification",icon:Award,c:"text-blue-600"},{v:"project",l:"Project",icon:Target,c:"text-green-600"},{v:"interview",l:"Interview",icon:Video,c:"text-orange-600"},{v:"other",l:"Other",icon:BookOpen,c:"text-gray-600"}];
const STATUS={pending:{l:"Pending",v:"warning"},completed:{l:"Completed",v:"success"},missed:{l:"Missed",v:"danger"}};

export default function GoalsPage(){
  const [goals,  setGoals]  =useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,  setModal]  =useState(false);
  const [saving, setSaving] =useState(false);
  const today=new Date();
  const weekStart=getMonday(today).toISOString().slice(0,10);
  const weekEnd=new Date(getMonday(today).getTime()+6*86400000).toISOString().slice(0,10);
  const [form,setForm]=useState({title:"",target_value:1,category:"leetcode",week_start:weekStart,week_end:weekEnd});

  useEffect(()=>{fetchGoals();},[]);
  const fetchGoals=async()=>{
    setLoading(true);
    try{const r=await studentsAPI.getGoals();setGoals(r.data);}catch(_){}
    setLoading(false);
  };

  const save=async()=>{
    if(!form.title.trim()){toast.error("Goal title required");return;}
    setSaving(true);
    try{
      await studentsAPI.addGoal(form);
      toast.success("Goal added!");
      setModal(false);
      setForm({title:"",target_value:1,category:"leetcode",week_start:weekStart,week_end:weekEnd});
      fetchGoals();
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    setSaving(false);
  };

  const increment=async(g)=>{
    const newVal=Math.min(g.target_value,g.current_value+1);
    try{
      await studentsAPI.updateGoal(g.id,{current_value:newVal});
      setGoals(p=>p.map(x=>x.id===g.id?{...x,current_value:newVal,status:newVal>=g.target_value?"completed":"pending"}:x));
      if(newVal>=g.target_value)toast.success("Goal completed! 🎉");
    }catch(_){toast.error("Failed");}
  };

  const thisWeek=goals.filter(g=>g.week_start===weekStart);
  const older=goals.filter(g=>g.week_start!==weekStart);
  const done=thisWeek.filter(g=>g.status==="completed").length;
  const pct=thisWeek.length>0?Math.round((done/thisWeek.length)*100):0;
  const getCat=cat=>CATS.find(c=>c.v===cat)||CATS[4];

  return(
    <DashboardLayout requiredRole="student">
      <SectionHeader title="Weekly Goals" subtitle="Track your weekly targets"
        action={<button onClick={()=>setModal(true)} className="btn-primary"><Plus size={16}/>Add Goal</button>}/>

      {thisWeek.length>0&&(
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <div><p className="font-semibold text-gray-900">This Week</p><p className="text-sm text-gray-500">{weekStart} → {weekEnd}</p></div>
            <div className="text-right"><p className="text-2xl font-bold text-indigo-600">{pct}%</p><p className="text-xs text-gray-400">{done}/{thisWeek.length} done</p></div>
          </div>
          <ProgressBar value={pct} showLabel={false}/>
        </div>
      )}

      {loading?<div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>
      :goals.length===0?<EmptyState icon={Target} title="No goals yet" description="Set weekly goals to stay on track"
        action={<button onClick={()=>setModal(true)} className="btn-primary"><Plus size={14}/>Add Goal</button>}/>
      :(
        <div className="space-y-6">
          {thisWeek.length>0&&(
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Current Week</h3>
              <div className="space-y-3">
                {thisWeek.map(g=>{
                  const cfg=getCat(g.category);const Icon=cfg.icon;
                  const pct2=Math.round((g.current_value/g.target_value)*100);
                  return(
                    <div key={g.id} className="card">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={cfg.c}/>
                          <span className="font-medium text-gray-800">{g.title}</span>
                          <Badge variant={STATUS[g.status]?.v}>{STATUS[g.status]?.l}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500">{g.current_value}/{g.target_value}</span>
                          {g.status!=="completed"&&(
                            <button onClick={()=>increment(g)} className="btn-secondary text-xs px-3 py-1">+1</button>
                          )}
                          {g.status==="completed"&&<CheckCircle size={18} className="text-green-500"/>}
                        </div>
                      </div>
                      <ProgressBar value={pct2} showLabel={false} color={pct2===100?"bg-green-500":"bg-indigo-500"}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {older.length>0&&(
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">Previous Weeks</h3>
              <div className="space-y-2">
                {older.map(g=>{const cfg=getCat(g.category);const Icon=cfg.icon;return(
                  <div key={g.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2"><Icon size={14} className={cfg.c}/><span className="text-sm text-gray-600">{g.title}</span></div>
                    <div className="flex items-center gap-2"><span className="text-xs text-gray-400">{g.week_start}</span><Badge variant={STATUS[g.status]?.v}>{STATUS[g.status]?.l}</Badge></div>
                  </div>
                );})}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Weekly Goal">
        <div className="space-y-4">
          <div><label className="label">Goal Title *</label>
            <input className="input" placeholder="Solve 10 LeetCode problems" value={form.title}
              onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></div>
          <div><label className="label">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATS.map(c=>{const Icon=c.icon;return(
                <button key={c.v} onClick={()=>setForm(p=>({...p,category:c.v}))}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-colors ${form.category===c.v?"bg-indigo-600 text-white border-indigo-600":"bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <Icon size={14}/>{c.l}
                </button>
              );})}
            </div></div>
          <div><label className="label">Target Count</label>
            <input type="number" min={1} max={100} className="input" value={form.target_value}
              onChange={e=>setForm(p=>({...p,target_value:parseInt(e.target.value)||1}))}/></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Week Start</label>
              <input type="date" className="input" value={form.week_start}
                onChange={e=>setForm(p=>({...p,week_start:e.target.value}))}/></div>
            <div><label className="label">Week End</label>
              <input type="date" className="input" value={form.week_end}
                onChange={e=>setForm(p=>({...p,week_end:e.target.value}))}/></div>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
            {saving?<><LoadingSpinner size={14}/>Adding...</>:<><Plus size={14}/>Add Goal</>}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function getMonday(d){const day=d.getDay(),diff=d.getDate()-day+(day===0?-6:1);return new Date(d.setDate(diff));}
