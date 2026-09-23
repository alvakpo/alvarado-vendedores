"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminParticipants from "@/components/admin/AdminParticipants";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminHistory from "@/components/admin/AdminHistory";
import AdminConfig from "@/components/admin/AdminConfig";

type Tab = "dashboard" | "participants" | "notifications" | "history" | "config";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/logout").then(async (res) => {
      const data = await res.json();
      if (!data.isLoggedIn || data.role !== "admin") {
        router.replace("/login");
      } else {
        setUsername(data.username);
        setLoading(false);
      }
    });
  }, [router]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }, [router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTop: "3px solid var(--blue-electric)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "participants", label: "Vendedores", icon: "👥" },
    { id: "notifications", label: "Notificaciones", icon: "🔔" },
    { id: "history", label: "Historial", icon: "📋" },
    { id: "config", label: "Configuración", icon: "⚙️" },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <header
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
            ADMIN <span style={{ color: "var(--blue-neon)" }}>PANEL</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>@{username}</span>
          <a href="/" target="_blank" style={{ fontSize: 12, color: "var(--blue-electric)", textDecoration: "none" }}>
            Ver público ↗
          </a>
          <button
            onClick={handleLogout}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted)",
              background: "transparent",
              border: "1px solid var(--border)",
              padding: "5px 10px",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Tab navigation */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 16px",
              border: "none",
              background: "transparent",
              color: activeTab === tab.id ? "var(--blue-neon)" : "var(--text-muted)",
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--blue-electric)" : "2px solid transparent",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main style={{ flex: 1, padding: "16px", maxWidth: 900, margin: "0 auto", width: "100%" }}>
        {activeTab === "dashboard" && <AdminDashboard />}
        {activeTab === "participants" && <AdminParticipants />}
        {activeTab === "notifications" && <AdminNotifications />}
        {activeTab === "history" && <AdminHistory />}
        {activeTab === "config" && <AdminConfig />}
      </main>
    </div>
  );
}
