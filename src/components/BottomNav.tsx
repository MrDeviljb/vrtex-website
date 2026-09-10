"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Flame, BarChart3, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Tournaments", href: "/tournaments", icon: Trophy },
    { label: "Scrims", href: "/scrims", icon: Flame },
    { label: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080a0f]/95 backdrop-blur-lg border-t border-border px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-medium transition ${
              isActive ? "text-neon-green" : "text-gray-400 hover:text-white"
            }`}
          >
            <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "text-neon-green" : "text-gray-400"}`} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
