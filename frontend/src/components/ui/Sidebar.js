"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useAuthStore from "@/store/authStore";
import {
  LayoutDashboard, Users, BookOpen, Code2, GitBranch, Award,
  FolderOpen, Target, Video, FileText, TrendingUp, LogOut,
  GraduationCap, ChevronLeft, ChevronRight, Bell, BarChart3,
  Building2, Star, User, X, Sparkles
} from "lucide-react";

const studentNav = [
  { label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Coding profile", href: "/student/coding", icon: Code2 },
  { label: "GitHub activity", href: "/student/github", icon: GitBranch },
  { label: "Skills", href: "/student/skills", icon: Star },
  { label: "Certifications", href: "/student/certs", icon: Award },
  { label: "Projects", href: "/student/projects", icon: FolderOpen },
  { label: "Mock interviews", href: "/student/interview", icon: Video },
  { label: "Learning roadmap", href: "/student/roadmap", icon: Target },
  { label: "Resume analysis", href: "/student/resume", icon: FileText },
  { label: "Weekly goals", href: "/student/goals", icon: BookOpen },
  { label: "My profile", href: "/student/profile", icon: User },
];
const mentorNav = [
  { label: "Overview", href: "/mentor/dashboard", icon: LayoutDashboard },
  { label: "My students", href: "/mentor/students", icon: Users },
  { label: "Batches", href: "/mentor/batches", icon: GraduationCap },
  { label: "Needs attention", href: "/mentor/at-risk", icon: Bell },
  { label: "Analytics", href: "/mentor/analytics", icon: TrendingUp },
];
const adminNav = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Mentors", href: "/admin/mentors", icon: GraduationCap },
  { label: "Branches", href: "/admin/branches", icon: Building2 },
  { label: "Batches", href: "/admin/batches", icon: BookOpen },
  { label: "Placements", href: "/admin/placements", icon: Target },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];
const navMap = { student: studentNav, mentor: mentorNav, admin: adminNav };

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = navMap[user?.role] || [];

  useEffect(() => { onClose(); }, [pathname]); // Close drawer on navigation.
  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen, onClose]);

  const handleLogout = () => { logout(); onClose(); router.replace("/login"); };
  return (
    <>
      {mobileOpen && <button aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" />}
      <aside aria-label="Main navigation" className={`sidebar-shell fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/80 shadow-xl shadow-slate-900/5 transition-all duration-200 lg:sticky lg:top-0 lg:z-auto lg:shadow-none ${collapsed ? "lg:w-[78px]" : "lg:w-[252px]"} w-[270px] ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex items-center gap-3 px-5 h-[78px] border-b border-slate-100">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200"><GraduationCap size={21} /></span>
          {!collapsed && <div className="min-w-0">
            <p className="font-extrabold tracking-tight text-slate-900 leading-tight">PlacementPilot <span className="text-indigo-600">AI</span></p>
            <p className="text-[11px] font-medium text-slate-500 capitalize">{user?.role || "Learning"} workspace</p>
          </div>}
          <button type="button" onClick={onClose} aria-label="Close menu" className="ml-auto rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><X size={18}/></button>
        </div>
        <div className="flex items-center justify-between px-5 pt-7 pb-3">
          {!collapsed && <p className="text-[10px] uppercase font-bold tracking-[0.18em] text-slate-400">Workspace</p>}
          <button type="button" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} className="hidden lg:flex ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600">{collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}</button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-5" aria-label="Workspace pages">
          {navItems.map(({label,href,icon:Icon}) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return <Link key={href} href={href} title={collapsed ? label : undefined} aria-current={active ? "page" : undefined} className={`group flex min-h-[43px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}>
              <Icon size={18} strokeWidth={active ? 2.25 : 1.9} className="shrink-0"/>
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600"/>}
            </Link>;
          })}
        </nav>
        {!collapsed && <div className="mx-4 mb-4 hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-sky-50 p-4 lg:block">
          <div className="mb-2 flex items-center gap-2 text-indigo-700"><Sparkles size={16}/><span className="text-xs font-bold">Build your next step</span></div>
          <p className="text-xs leading-relaxed text-slate-600">Use your roadmap and interview practice to keep progressing.</p>
        </div>}
        <div className="border-t border-slate-100 p-3">
          {!collapsed && <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">{(user?.name || "U").trim().charAt(0).toUpperCase()}</div>
            <div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{user?.name || "Account"}</p><p className="text-xs capitalize text-slate-500">{user?.role}</p></div>
          </div>}
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500"><LogOut size={18}/>{!collapsed && "Sign out"}</button>
        </div>
      </aside>
    </>
  );
}
