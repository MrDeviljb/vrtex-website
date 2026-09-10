"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Trophy,
  Shield,
  Flame,
  Users,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Lock,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchNotifications();
  }, [pathname]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch {}
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCurrentUser(null);
    setIsProfileDropdownOpen(false);
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { name: "Tournaments", href: "/tournaments", icon: Trophy },
    { name: "Scrims", href: "/scrims", icon: Flame },
    { name: "My Tournaments", href: "/my-tournaments", icon: Trophy },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Teams", href: "/teams", icon: Users },
    { name: "Rules", href: "/rules", icon: Shield },
    { name: "Support", href: "/support" },
  ];

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-50 bg-[#080a0f]/90 backdrop-blur-md border-b border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-surface border border-neon-green/40 flex items-center justify-center shadow-neon-green group-hover:border-neon-green transition-all duration-300">
              <span className="font-display font-extrabold text-2xl text-neon-green tracking-wider">D</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-wider text-white flex items-center gap-1.5">
                DevX <span className="text-neon-green text-xs px-1.5 py-0.5 rounded bg-neon-green/10 border border-neon-green/30 uppercase tracking-widest font-mono">eSPORTS</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono tracking-wider">BGMI COMPETITIVE HUB</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "text-neon-green bg-surface-light border border-neon-green/30"
                      : "text-gray-300 hover:text-white hover:bg-surface"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Notifications, Admin Access Shield & User */}
          <div className="hidden sm:flex items-center gap-3">
            {/* ADMIN ACCESS Shield Button (Section 18) */}
            <Link
              href="/admin/login"
              title="Admin Portal Access"
              className="p-2 rounded-lg bg-surface hover:bg-amber-950/40 border border-amber-500/30 text-amber-400 hover:text-amber-300 transition flex items-center gap-1 text-xs font-mono"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span className="font-bold hidden xl:inline">ADMIN</span>
            </Link>
            {/* Notification Bell */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2 rounded-lg bg-surface hover:bg-surface-light border border-border text-gray-300 hover:text-white transition relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-green text-black font-bold text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 p-3 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
                      <span className="font-semibold text-sm text-white">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-xs text-neon-green">{unreadCount} unread</span>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center">No notifications yet</p>
                    ) : (
                      <div className="space-y-2">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-2.5 rounded-lg text-xs transition ${
                              notif.isRead ? "bg-surface-light/40 text-gray-400" : "bg-surface-light border border-neon-green/20 text-white"
                            }`}
                          >
                            <div className="font-bold mb-0.5">{notif.title}</div>
                            <div className="text-gray-300 text-[11px] leading-relaxed">{notif.message}</div>
                            <div className="text-[9px] text-gray-500 mt-1">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Auth Dropdown or Login Buttons */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-light border border-border hover:border-neon-green/40 transition group"
                >
                  <div className="w-8 h-8 rounded-full bg-neon-green/20 border border-neon-green/50 flex items-center justify-center text-neon-green font-bold text-sm">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-white group-hover:text-neon-green transition">
                        {currentUser.username}
                      </span>
                      {currentUser.profile?.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-neon-green" />
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {currentUser.profile?.bgmiUsername || currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
                </button>

                {/* Profile Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl z-50 p-2 space-y-1">
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{currentUser.email}</p>
                      {currentUser.profile?.bgmiUid && (
                        <p className="text-[11px] text-neon-green font-mono mt-0.5">
                          UID: {currentUser.profile.bgmiUid}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:text-neon-green hover:bg-surface-light rounded-lg transition"
                    >
                      <User className="w-4 h-4" /> My Profile & UID
                    </Link>
                    <Link
                      href="/my-tournaments"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:text-neon-green hover:bg-surface-light rounded-lg transition"
                    >
                      <Trophy className="w-4 h-4" /> My Tournaments & Rooms
                    </Link>
                    <Link
                      href="/my-team"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-gray-200 hover:text-neon-green hover:bg-surface-light rounded-lg transition"
                    >
                      <Users className="w-4 h-4" /> My Team & Roster
                    </Link>

                    {/* Admin Dashboard link if user has admin role */}
                    {["SUPER_ADMIN", "TOURNAMENT_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(
                      currentUser.role
                    ) && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-accent-gold hover:bg-accent-gold/10 rounded-lg transition border-t border-border mt-1"
                      >
                        <Lock className="w-4 h-4 text-accent-gold" /> Admin Panel
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-accent-red hover:bg-accent-red/10 rounded-lg transition text-left border-t border-border mt-1"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-200 hover:text-white transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-bold bg-neon-green hover:bg-neon-emerald text-black rounded-lg transition shadow-neon-green"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {currentUser && (
              <Link href="/profile" className="p-2 text-gray-300 hover:text-white">
                <User className="w-5 h-5" />
              </Link>
            )}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg bg-surface border border-border text-gray-300 hover:text-white"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="lg:hidden bg-surface border-b border-border px-4 pt-3 pb-6 space-y-3">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === link.href
                    ? "text-neon-green bg-surface-light"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-border">
            {currentUser ? (
              <div className="space-y-2">
                <div className="px-3 py-2 bg-surface-light rounded-lg">
                  <p className="text-xs text-gray-400">Logged in as</p>
                  <p className="font-bold text-white text-sm">{currentUser.username}</p>
                  {currentUser.profile?.bgmiUsername && (
                    <p className="text-xs text-neon-green font-mono">
                      ✓ {currentUser.profile.bgmiUsername}
                    </p>
                  )}
                </div>
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-gray-300 hover:text-white"
                >
                  My Profile & BGMI UID
                </Link>
                <Link
                  href="/my-tournaments"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-gray-300 hover:text-white"
                >
                  My Tournaments
                </Link>
                <Link
                  href="/my-team"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-sm text-gray-300 hover:text-white"
                >
                  My Team & Roster
                </Link>
                {["SUPER_ADMIN", "TOURNAMENT_ADMIN", "MODERATOR", "FINANCE_ADMIN"].includes(
                  currentUser.role
                ) && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-sm font-bold text-accent-gold"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-accent-red"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-lg border border-border text-white text-sm font-semibold"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-lg bg-neon-green text-black text-sm font-bold"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export { Navbar };



