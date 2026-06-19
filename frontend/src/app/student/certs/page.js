"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { SectionHeader, LoadingSpinner, EmptyState, Modal } from "@/components/ui";
import { studentsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import { Award, Plus, Trash2, ExternalLink } from "lucide-react";

export default function CertsPage() {
  const [certs,  setCerts]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [modal,  setModal]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title:"", issuer:"", credential_url:"", issued_date:"", domain:"" });

  useEffect(() => { fetchCerts(); }, []);
  const fetchCerts = async () => {
    setLoading(true);
    try { const r = await studentsAPI.getCertifications(); setCerts(r.data); } catch(_) {}
    setLoading(false);
  };

  const save = async () => {
    if (!form.title.trim() || !form.issuer.trim()) { toast.error("Title and issuer are required"); return; }
    setSaving(true);
    try {
      await studentsAPI.addCertification(form);
      toast.success("Certification added!");
      setModal(false);
      setForm({ title:"", issuer:"", credential_url:"", issued_date:"", domain:"" });
      fetchCerts();
    } catch(err) { toast.error(err.response?.data?.detail || "Failed"); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm("Delete this certification?")) return;
    try { await studentsAPI.deleteCertification(id); toast.success("Deleted"); fetchCerts(); }
    catch(_) { toast.error("Failed"); }
  };

  const DOMAINS = ["AI/ML","Data Science","Web Development","Cloud","Cyber Security","DevOps","Mobile","Other"];

  return (
    <DashboardLayout requiredRole="student">
      <SectionHeader title="Certifications" subtitle="Add your course completions and certifications"
        action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={16}/>Add Certificate</button>} />

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size={32}/></div>
      ) : certs.length === 0 ? (
        <EmptyState icon={Award} title="No certifications yet"
          description="Add certifications to boost your placement readiness score"
          action={<button onClick={() => setModal(true)} className="btn-primary"><Plus size={14}/>Add First</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certs.map(c => (
            <div key={c.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-yellow-50 rounded-lg"><Award size={20} className="text-yellow-600"/></div>
                <button onClick={() => del(c.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{c.issuer}</p>
              {c.domain && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{c.domain}</span>}
              {c.issued_date && <p className="text-xs text-gray-400 mt-2">Issued: {c.issued_date}</p>}
              {c.credential_url && (
                <a href={c.credential_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-2">
                  <ExternalLink size={11}/> View Certificate
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Certification">
        <div className="space-y-4">
          <div><label className="label">Certificate Title *</label>
            <input className="input" placeholder="AWS Cloud Practitioner" value={form.title}
              onChange={e => setForm(p => ({...p, title: e.target.value}))} /></div>
          <div><label className="label">Issuer / Platform *</label>
            <input className="input" placeholder="Amazon Web Services / Coursera" value={form.issuer}
              onChange={e => setForm(p => ({...p, issuer: e.target.value}))} /></div>
          <div><label className="label">Domain</label>
            <select className="input" value={form.domain} onChange={e => setForm(p => ({...p, domain: e.target.value}))}>
              <option value="">-- Select Domain --</option>
              {DOMAINS.map(d => <option key={d}>{d}</option>)}
            </select></div>
          <div><label className="label">Issue Date</label>
            <input type="date" className="input" value={form.issued_date}
              onChange={e => setForm(p => ({...p, issued_date: e.target.value}))} /></div>
          <div><label className="label">Credential URL</label>
            <input className="input" placeholder="https://..." value={form.credential_url}
              onChange={e => setForm(p => ({...p, credential_url: e.target.value}))} /></div>
          <button onClick={save} disabled={saving} className="btn-primary w-full justify-center">
            {saving ? <><LoadingSpinner size={14}/>Saving...</> : <><Plus size={14}/>Add Certificate</>}
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
