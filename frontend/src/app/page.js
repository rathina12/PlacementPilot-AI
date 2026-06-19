"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  useEffect(() => {
    if (isAuthenticated && user?.role) router.replace(`/${user.role}/dashboard`);
    else router.replace("/login");
  }, [isAuthenticated, user, router]);
  return null;
}
