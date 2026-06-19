"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, Modal } from "@/components/ui";
import { mentorsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { BookOpen, Plus, Trash2, Users } from "lucide-react";

const BRANCHES=["CSE","ECE","EEE","MECH","CIVIL","IT","AIDS","AIML"];
const YEARS=[1,2,3,4];
const SECTIONS=["A","B","C","D","E"];

export default function MentorBatchesPage() {
  const [batches,setBatches]=useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,  setModal]  =useState(false);
  const [saving, setSaving] =useState(false);
  const [form,   setForm]   =useState({name:"",branch:"CSE",year:3,section:"A",batch_year:new Date().getFullYear()+1});

  useEffect(()=>{fetchBatches();},[]);
  const fetchBatches=async()=>{
    setLoading(true);
    try{const r=await mentorsAPI.getBatches();setBatches(r.data);}catch(_){}
    setLoading(false);
  };

  const save=async()=>{
    if(!form.name.trim()){toast.error("Batch name required");return;}
    setSaving(true);
    try{
      await mentorsAPI.createBatch({...form,year:parseInt(form.year),batch_year:parseInt(form.batch_year)});
      toast.success("Batch created!");
      setModal(false);
      setForm({name:"",branch:"CSE",year:3,section:"A",batch_year:new Date().getFullYear()+1});
      fetchBatches();
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    setSaving(false);
  };

  const del=async(id)=>{
    if(!confirm("Delete this batch? Students will be unassigned."))return;
    try{await mentorsAPI.deleteBatch(id);toast.success("Deleted");fetchBatches();}
    catch(_){toast.error("Failed");}
  };

  return(
    <DashboardLayout requiredRole="mentor">
      <SectionHeader title="Manage Batches" subtitle="Create and manage your student batches"
        action={<button onClick={()=>setModal(true)} className="btn-primary"><Plus size={16}/>New Batch</button>}/>

      {loading?<div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>
      :batches.length===0?<EmptyState icon={BookOpen} title="No batches yet" description="Create a batch to start assigning students"
        action={<button onClick={()=>setModal(true)} className="btn-primary"><Plus size={14}/>Create Batch</button>}/>
      :(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map(b=>(
            <div key={b.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg"><BookOpen size={18} className="text-indigo-600"/></div>
                <button onClick={()=>del(b.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
              <h3 className="font-semibold text-gray-900">{b.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                <p>Branch: <strong>{b.branch}</strong></p>
                <p>Year {b.year} · Section {b.section}</p>
                <p>Graduation: {b.batch_year}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <Users size={12}/> Students assigned via registration
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Create New Batch">
        <div className="space-y-4">
          <div><label className="label">Batch Name *</label>
            <input className="input" placeholder="CSE-A 2027" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="label">Branch</label>
              <select className="input" value={form.branch} onChange={e=>setForm(p=>({...p,branch:e.target.value}))}>
                {BRANCHES.map(b=><option key={b}>{b}</option>)}</select></div>
            <div><label className="label">Year</label>
              <select className="input" value={form.year} onChange={e=>setForm(p=>({...p,year:parseInt(e.target.value)}))}>
                {YEARS.map(y=><option key={y} value={y}>Year {y}</option>)}</select></div>
            <div><label className="label">Section</label>
              <select className="input" value={form.section} onChange={e=>setForm(p=>({...p,section:e.target.value}))}>
                {SECTIONS.map(s=><option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="label">Graduation Year</label>
            <input type="number" className="input" value={form.batch_year}
              onChange={e=>setForm(p=>({...p,batch_year:parseInt(e.target.value)}))}/></div>
          <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
            {saving?<><LoadingSpinner size={14}/>Creating...</>:<><Plus size={14}/>Create Batch</>}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
