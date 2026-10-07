"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, ShieldCheck } from "lucide-react";
import useAuthStore from "@/store/authStore";
import Sidebar from "@/components/ui/Sidebar";
import { ToastProvider, PageLoader } from "@/components/ui";

export default function DashboardLayout({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (requiredRole && user?.role !== requiredRole) {
      router.replace(["student", "mentor", "admin"].includes(user?.role)
        ? `/${user.role}/dashboard` : "/login");
    }
  }, [isAuthenticated, user?.role, requiredRole, router]);

  useEffect(() => setMobileOpen(false), [pathname]);

  // Avoid rendering another role's data while redirecting.
  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) return <PageLoader />;

  return (
    <div className="flex min-h-screen bg-[#f6f8fc] lg:h-screen lg:overflow-hidden">
      <ToastProvider />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl md:px-9">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"><Menu size={19}/></button>
            <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">PlacementPilot AI</p><p className="text-sm font-bold capitalize text-slate-800">{user?.role} workspace</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700"><ShieldCheck size={15}/><span className="hidden sm:inline">Your workspace</span></div>
        </header>
        <main id="main-content" className="flex-1 min-w-0 overflow-y-auto">
          <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-6 md:px-9 md:py-9">{children}</div>
        </main>
      </div>
    </div>
  );
}
