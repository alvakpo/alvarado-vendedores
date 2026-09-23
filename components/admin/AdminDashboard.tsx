"use client";

import { useState, useEffect } from "react";

type Totals = {
  total: number;
  assigned: number;
  unassigned: number;
  sold: number;
  in_hands: number;
  revenue: number;
  percentage: number;
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboard() {
  const [totals, setTotals] = useState<Totals | null>(null);
  const [eventStatus, setEventStatus] = useState("open");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setTotals(d.totals);
        setEventStatus(d.config?.status || "open");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Cargando...</div>;
  }

  const stats = [
    { label: "Total Entradas", value: totals?.total ?? 500, color: "var(--text-primary)" },
    { label: "Vendidas", value: totals?.sold ?? 0, color: "var(--blue-neon)" },
    { label: "Asignadas", value: totals?.assigned ?? 0, color: "var(--text-secondary)" },
    { label: "Sin Asignar", value: totals?.unassigned ?? 0, color: "var(--text-muted)" },
    { label: "En manos de vendedores", value: totals?.in_hands ?? 0, color: "#f59e0b" },
    { label: "Recaudado", value: null, money: totals?.revenue ?? 0, color: "#4ade80" },
  ];

  return (
    <div className="animate-fade-in">
      {eventStatus === "closed" && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#f87171",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          ⚠️ La venta está CERRADA. Los vendedores no pueden modificar sus cantidades.
        </div>
      )}

      {/* Main progress */}
      <div
        className="card"
        style={{ padding: 20, marginBottom: 16 }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: "var(--blue-neon)", letterSpacing: "-2px" }}>
            {totals?.sold ?? 0}
          </span>
          <span style={{ fontSize: 22, color: "var(--text-muted)" }}>/ {totals?.total ?? 500}</span>
          <span style={{ fontSize: 16, color: "var(--text-secondary)", marginLeft: "auto", fontWeight: 700 }}>
            {totals?.percentage?.toFixed(1) ?? 0}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 18 }}>
          <div
            className="progress-fill"
            style={{ width: `${totals?.percentage ?? 0}%` }}
          />
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
          {formatMoney(totals?.revenue ?? 0)} recaudados
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
          marginBottom: 16,
        }}
      >
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div
              className="stat-value"
              style={{ color: stat.color, fontSize: 26 }}
            >
              {stat.money !== undefined ? formatMoney(stat.money) : stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Distribution */}
      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
          Distribución de entradas
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Vendidas", value: totals?.sold ?? 0, total: totals?.total ?? 500, color: "#0ea5e9" },
            { label: "En manos de vendedores", value: totals?.in_hands ?? 0, total: totals?.total ?? 500, color: "#f59e0b" },
            { label: "Sin asignar", value: totals?.unassigned ?? 0, total: totals?.total ?? 500, color: "#475569" },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{item.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: item.color }}>
                  {item.value} ({((item.value / (item.total || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="progress-bar" style={{ height: 8 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(item.value / (item.total || 1)) * 100}%`,
                    background: item.color,
                    borderRadius: "inherit",
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
