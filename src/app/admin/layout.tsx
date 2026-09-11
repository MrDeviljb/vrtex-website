"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  Key,
  Users,
  UserCheck,
  Award,
  Shield,
  FileText,
  Lock,
  LogOut,
  ChevronLeft,
  Loader2,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (
        data.success &&
        data.user &&
        ["SUPER_ADMIN", "TOURNAMENT_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(
          data.user.role
        )
      ) {
        setUser(data.user);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080a0f]">
        <Loader2 className="w-10 h-10 text-accent-gold animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const adminNav = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Tournaments & Scrims", href: "/admin/tournaments", icon: Trophy },
    { label: "Payments Approval", href: "/admin/payments", icon: Award },
    { label: "Slot Management", href: "/admin/slots", icon: UserCheck },
    { label: "Room Management", href: "/admin/rooms", icon: Key },
    { label: "Registrations", href: "/admin/registrations", icon: UserCheck },
    { label: "Matches & Results", href: "/admin/matches", icon: Award },
    { label: "Moderators", href: "/admin/moderators", icon: Shield },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-surface border-r border-border p-4 md:p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand & Badge */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-surface-light border border-accent-gold/40 flex items-center justify-center text-accent-gold font-bold text-sm">
                <Lock className="w-4 h-4" />
              </div>
              <span className="font-display font-black text-lg text-white">
                Vrtex <span className="text-accent-gold text-xs font-mono">ADMIN</span>
              </span>
            </Link>
          </div>

          {/* User Role Card */}
          <div className="p-3 rounded-xl bg-surface-light border border-border mb-6">
            <span className="text-[10px] uppercase font-mono text-gray-400 block">ADMIN OPERATOR</span>
            <span className="font-display font-bold text-sm text-white block truncate">
              {user.username}
            </span>
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-accent-gold/20 text-accent-gold border border-accent-gold/40">
              {user.role}
            </span>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-accent-gold/15 text-accent-gold border border-accent-gold/30 font-bold"
                      : "text-gray-400 hover:text-white hover:bg-surface-light"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-border space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-surface-light transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Exit to Player Site</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
