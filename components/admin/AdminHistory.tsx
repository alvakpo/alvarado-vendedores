"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type HistoryEntry = {
  id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  notes: string | null;
  created_at: string;
  participants: { first_name: string; last_name: string } | null;
  users: { username: string } | null;
};

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    created: "Creado",
    sold_change: "Vendidas modificadas",
    assigned_change: "Asignadas modificadas",
    status_change: "Estado cambiado",
    order_change: "Orden cambiado",
    password_change: "Contraseña cambiada",
    password_reset: "Contraseña restablecida",
  };
  return labels[action] || action;
}

function actionColor(action: string): string {
  if (action === "created") return "#4ade80";
  if (action === "sold_change") return "var(--blue-neon)";
  if (action === "assigned_change") return "#f59e0b";
  if (action === "status_change") return "#f87171";
  return "var(--text-muted)";
}

export default function AdminHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/history?limit=200")
      .then((r) => r.json())
      .then((d) => {
        setHistory(d.history || []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Cargando historial...</div>;
  }

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
        Historial de cambios
      </h2>

      <div className="card" style={{ overflow: "hidden" }}>
        {history.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No hay historial todavía.
          </div>
        ) : (
          history.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: actionColor(entry.action),
                  marginTop: 5,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {entry.participants
                      ? `${entry.participants.first_name} ${entry.participants.last_name}`
                      : "—"}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {format(new Date(entry.created_at), "dd/MM HH:mm", { locale: es })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: actionColor(entry.action), fontWeight: 600, marginTop: 1 }}>
                  {actionLabel(entry.action)}
                </div>
                {entry.old_value !== null && entry.new_value !== null && (
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                    {entry.old_value} → {entry.new_value}
                  </div>
                )}
                {entry.notes && (
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                    {entry.notes}
                  </div>
                )}
                {entry.users && (
                  <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    por @{entry.users.username}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
