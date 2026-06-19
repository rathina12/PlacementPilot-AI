"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, Modal } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { FolderOpen, Plus, Trash2, ExternalLink, Github, Star } from "lucide-react";

const DOMAINS = ["AI/ML","Web Development","Mobile","Data Science","Cloud","DevOps","Other"];

export default function ProjectsPage() {
  const [projects,setProjects]=useState([]);
  const [loading, setLoading]=useState(true);
  const [modal,   setModal]  =useState(false);
  const [saving,  setSaving] =useState(false);
  const [techInput,setTechInput]=useState("");
  const [form, setForm]=useState({title:"",description:"",tech_stack:[],github_url:"",live_url:"",domain:"Web Development",is_featured:false});

  useEffect(()=>{fetchProjects();},[]);
  const fetchProjects=async()=>{
    setLoading(true);
    try{const r=await studentsAPI.getProjects();setProjects(r.data);}catch(_){}
    setLoading(false);
  };

  const addTech=()=>{
    const t=techInput.trim();
    if(t&&!form.tech_stack.includes(t))setForm(p=>({...p,tech_stack:[...p.tech_stack,t]}));
    setTechInput("");
  };

  const save=async()=>{
    if(!form.title.trim()){toast.error("Project title required");return;}
    setSaving(true);
    try{
      await studentsAPI.addProject(form);
      toast.success("Project added!");
      setModal(false);
      setForm({title:"",description:"",tech_stack:[],github_url:"",live_url:"",domain:"Web Development",is_featured:false});
      fetchProjects();
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    setSaving(false);
  };

  const del=async(id)=>{
    if(!confirm("Delete this project?"))return;
    try{await studentsAPI.deleteProject(id);toast.success("Deleted");fetchProjects();}
    catch(_){toast.error("Failed");}
  };

  return(
    <DashboardLayout requiredRole="student">
      <SectionHeader title="Projects" subtitle="Showcase your work"
        action={<button onClick={()=>setModal(true)} className="btn-primary"><Plus size={16}/>Add Project</button>}/>

      {loading?(<div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>)
      :projects.length===0?(
        <EmptyState icon={FolderOpen} title="No projects yet" description="Add projects to boost your placement readiness"
          action={<button onClick={()=>setModal(true)} className="btn-primary"><Plus size={14}/>Add Project</button>}/>
      ):(
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map(p=>(
            <div key={p.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{p.title}</h3>
                  {p.is_featured&&<Star size={14} className="text-yellow-500 fill-yellow-500"/>}
                </div>
                <button onClick={()=>del(p.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
              {p.domain&&<span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{p.domain}</span>}
              {p.description&&<p className="text-sm text-gray-500 mt-2 line-clamp-2">{p.description}</p>}
              {p.tech_stack?.length>0&&(
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.tech_stack.map(t=><span key={t} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">{t}</span>)}
                </div>
              )}
              <div className="flex gap-3 mt-4">
                {p.github_url&&<a href={p.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"><Github size={13}/> GitHub</a>}
                {p.live_url&&<a href={p.live_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600"><ExternalLink size={13}/> Live Demo</a>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Project" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Title *</label>
              <input className="input" placeholder="My App" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></div>
            <div><label className="label">Domain</label>
              <select className="input" value={form.domain} onChange={e=>setForm(p=>({...p,domain:e.target.value}))}>
                {DOMAINS.map(d=><option key={d}>{d}</option>)}</select></div>
          </div>
          <div><label className="label">Description</label>
            <textarea className="input min-h-[70px]" placeholder="What does it do?" value={form.description}
              onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
          <div><label className="label">Tech Stack</label>
            <div className="flex gap-2">
              <input className="input" placeholder="React, Node.js..." value={techInput}
                onChange={e=>setTechInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addTech();}}}/>
              <button onClick={addTech} className="btn-secondary px-3">Add</button>
            </div>
            {form.tech_stack.length>0&&(
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tech_stack.map(t=>(
                  <span key={t} onClick={()=>setForm(p=>({...p,tech_stack:p.tech_stack.filter(x=>x!==t)}))}
                    className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full cursor-pointer hover:bg-red-100 hover:text-red-600">
                    {t} ×
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">GitHub URL</label>
              <input className="input" placeholder="https://github.com/..." value={form.github_url}
                onChange={e=>setForm(p=>({...p,github_url:e.target.value}))}/></div>
            <div><label className="label">Live URL</label>
              <input className="input" placeholder="https://myapp.vercel.app" value={form.live_url}
                onChange={e=>setForm(p=>({...p,live_url:e.target.value}))}/></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e=>setForm(p=>({...p,is_featured:e.target.checked}))} className="w-4 h-4"/>
            <span className="text-sm text-gray-700">Mark as Featured Project</span>
          </label>
          <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
            {saving?<><LoadingSpinner size={14}/>Saving...</>:<><Plus size={14}/>Save Project</>}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
