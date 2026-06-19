"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import {
  LayoutDashboard, Users, BookOpen, Code2, GitBranch,
  Award, FolderOpen, Target, Video, FileText, TrendingUp,
  LogOut, GraduationCap, ChevronLeft, ChevronRight,
  Bell, BarChart3, Building2, Star, User,
} from "lucide-react";
import { useState } from "react";

const studentNav = [
  { label: "Dashboard",      href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Coding Profile", href: "/student/coding",    icon: Code2 },
  { label: "GitHub",         href: "/student/github",    icon: GitBranch },
  { label: "Skills",         href: "/student/skills",    icon: Star },
  { label: "Certifications", href: "/student/certs",     icon: Award },
  { label: "Projects",       href: "/student/projects",  icon: FolderOpen },
  { label: "Mock Interview", href: "/student/interview", icon: Video },
  { label: "Roadmap",        href: "/student/roadmap",   icon: Target },
  { label: "Resume Check",   href: "/student/resume",    icon: FileText },
  { label: "Weekly Goals",   href: "/student/goals",     icon: BookOpen },
  { label: "Profile",        href: "/student/profile",   icon: User },
];
const mentorNav = [
  { label: "Dashboard",  href: "/mentor/dashboard",  icon: LayoutDashboard },
  { label: "My Students",href: "/mentor/students",   icon: Users },
  { label: "Batches",    href: "/mentor/batches",    icon: GraduationCap },
  { label: "At-Risk",    href: "/mentor/at-risk",    icon: Bell },
  { label: "Analytics",  href: "/mentor/analytics",  icon: TrendingUp },
];
const adminNav = [
  { label: "Dashboard",  href: "/admin/dashboard",   icon: LayoutDashboard },
  { label: "Students",   href: "/admin/students",    icon: Users },
  { label: "Mentors",    href: "/admin/mentors",     icon: GraduationCap },
  { label: "Branches",   href: "/admin/branches",    icon: Building2 },
  { label: "Batches",    href: "/admin/batches",     icon: BookOpen },
  { label: "Placements", href: "/admin/placements",  icon: Target },
  { label: "Analytics",  href: "/admin/analytics",   icon: BarChart3 },
];
const navMap = { student: studentNav, mentor: mentorNav, admin: adminNav };

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = navMap[user?.role] || [];

  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <aside className={`h-screen bg-gray-900 text-white flex flex-col flex-shrink-0 transition-all duration-200 sticky top-0 ${collapsed ? "w-16" : "w-60"}`}>
      <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">SDT Platform</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role} Portal</p>
            </div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 ml-auto">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-3">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 transition-colors">
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
