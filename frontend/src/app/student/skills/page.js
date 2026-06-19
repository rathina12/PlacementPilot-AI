"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, Modal, Badge } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Star, Plus, Sparkles } from "lucide-react";

const DOMAINS=["AI/ML","Data Science","Web Development","Mobile Development","Cloud Computing","Cyber Security","DevOps","UI/UX","Data Engineering"];
const LEVELS=["beginner","intermediate","advanced"];
const LEVEL_COLOR={beginner:"info",intermediate:"warning",advanced:"success"};
const DOMAIN_SKILLS={"AI/ML":["Python","Machine Learning","Deep Learning","TensorFlow","PyTorch","NLP","Computer Vision"],"Data Science":["Python","R","SQL","Pandas","NumPy","Tableau","Statistics"],"Web Development":["HTML","CSS","JavaScript","React","Node.js","Next.js","TypeScript"],"Mobile Development":["Flutter","React Native","Android","Kotlin","Swift"],"Cloud Computing":["AWS","Azure","Docker","Kubernetes","Terraform"],"Cyber Security":["Network Security","Ethical Hacking","Penetration Testing","Cryptography"],"DevOps":["Docker","Kubernetes","Jenkins","Linux","Bash","CI/CD"],"UI/UX":["Figma","Adobe XD","Wireframing","Prototyping","User Research"],"Data Engineering":["Spark","Kafka","Airflow","SQL","Python","Data Pipelines"]};

export default function SkillsPage(){
  const [skills, setSkills] =useState([]);
  const [loading,setLoading]=useState(true);
  const [modal,  setModal]  =useState(false);
  const [saving, setSaving] =useState(false);
  const [form,   setForm]   =useState({skill_name:"",domain:"Web Development",proficiency_level:"beginner"});

  useEffect(()=>{fetchSkills();},[]);
  const fetchSkills=async()=>{
    setLoading(true);
    try{const r=await studentsAPI.getSkills();setSkills(r.data);}catch(_){}
    setLoading(false);
  };

  const save=async()=>{
    if(!form.skill_name.trim()){toast.error("Skill name required");return;}
    setSaving(true);
    try{
      await studentsAPI.addSkill(form);
      toast.success("Skill added!");
      setModal(false);
      setForm({skill_name:"",domain:"Web Development",proficiency_level:"beginner"});
      fetchSkills();
    }catch(err){toast.error(err.response?.data?.detail||"Failed");}
    setSaving(false);
  };

  const grouped=skills.reduce((acc,s)=>{acc[s.domain]=acc[s.domain]||[];acc[s.domain].push(s);return acc;},{});

  return(
    <DashboardLayout requiredRole="student">
      <SectionHeader title="Skills & Domains" subtitle="Showcase your technical expertise"
        action={<button onClick={()=>setModal(true)} className="btn-primary"><Plus size={16}/>Add Skill</button>}/>

      {loading?(<div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>)
      :skills.length===0?(
        <EmptyState icon={Star} title="No skills added yet" description="Add your technical skills to improve your placement score"
          action={<button onClick={()=>setModal(true)} className="btn-primary"><Plus size={14}/>Add Skill</button>}/>
      ):(
        <div className="space-y-5">
          {Object.entries(grouped).map(([domain,domSkills])=>(
            <div key={domain} className="card">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-indigo-500"/>
                <h3 className="font-semibold text-gray-900">{domain}</h3>
                <span className="text-xs text-gray-400">({domSkills.length})</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {domSkills.map(s=>(
                  <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full">
                    <span className="text-sm text-gray-800">{s.skill_name}</span>
                    <Badge variant={LEVEL_COLOR[s.proficiency_level]}>{s.proficiency_level}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Skill">
        <div className="space-y-4">
          <div><label className="label">Domain</label>
            <select className="input" value={form.domain} onChange={e=>setForm(p=>({...p,domain:e.target.value,skill_name:""}))}>
              {DOMAINS.map(d=><option key={d}>{d}</option>)}
            </select></div>
          <div><label className="label">Skill</label>
            <input className="input" placeholder="Type or choose below" value={form.skill_name}
              onChange={e=>setForm(p=>({...p,skill_name:e.target.value}))}/>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(DOMAIN_SKILLS[form.domain]||[]).map(s=>(
                <button key={s} onClick={()=>setForm(p=>({...p,skill_name:s}))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.skill_name===s?"bg-indigo-100 border-indigo-300 text-indigo-700":"bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Proficiency Level</label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map(l=>(
                <button key={l} onClick={()=>setForm(p=>({...p,proficiency_level:l}))}
                  className={`py-2 rounded-lg border text-sm font-medium capitalize transition-colors ${form.proficiency_level===l?"bg-indigo-600 text-white border-indigo-600":"bg-white border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
            {saving?<><LoadingSpinner size={14}/>Adding...</>:<><Plus size={14}/>Add Skill</>}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
