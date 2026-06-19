"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";
import Sidebar from "@/components/ui/Sidebar";
import { ToastProvider } from "@/components/ui";
import { PageLoader } from "@/components/ui";

export default function DashboardLayout({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/login"); return; }
    if (requiredRole && user?.role !== requiredRole) {
      router.replace(`/${user?.role}/dashboard`);
    }
  }, [isAuthenticated, user, requiredRole, router]);

  if (!isAuthenticated) return <PageLoader />;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <ToastProvider />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
