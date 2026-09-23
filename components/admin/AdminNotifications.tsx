"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ScheduledNotification = {
  id: string;
  title: string;
  message: string;
  scheduled_for: string;
  sent: boolean;
  cancelled: boolean;
  created_at: string;
};

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`toast ${type}`}>{message}</div>
  );
}

export default function AdminNotifications() {
  const [manualTitle, setManualTitle] = useState("Alvarado Vendedores");
  const [manualMessage, setManualMessage] = useState("");
  const [schedTitle, setSchedTitle] = useState("Alvarado Vendedores");
  const [schedMessage, setSchedMessage] = useState("");
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("17:00");
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const fetchScheduled = useCallback(async () => {
    const res = await fetch("/api/push/send");
    if (res.ok) {
      const data = await res.json();
      setScheduled(data.notifications || []);
    }
  }, []);

  useEffect(() => {
    fetchScheduled();
  }, [fetchScheduled]);

  async function sendManual(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: manualTitle, message: manualMessage }),
    });
    if (res.ok) {
      showToast("Notificación enviada correctamente");
      setManualMessage("");
    } else {
      showToast("Error al enviar la notificación", "error");
    }
    setLoading(false);
  }

  async function scheduleNotification(e: React.FormEvent) {
    e.preventDefault();
    if (!schedDate) return;

    const scheduledFor = new Date(`${schedDate}T${schedTime}`);

    setLoading(true);
    const res = await fetch("/api/push/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: schedTitle,
        message: schedMessage,
        scheduled_for: scheduledFor.toISOString(),
      }),
    });

    if (res.ok) {
      showToast("Recordatorio programado correctamente");
      setSchedMessage("");
      setSchedDate("");
      fetchScheduled();
    } else {
      const data = await res.json();
      showToast(data.error || "Error al programar", "error");
    }
    setLoading(false);
  }

  async function cancelScheduled(id: string) {
    const res = await fetch("/api/push/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      showToast("Recordatorio cancelado");
      fetchScheduled();
    }
  }

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Manual notification */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
          📢 Enviar notificación manual
        </h3>
        <form onSubmit={sendManual}>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Título</label>
            <input
              className="input"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Alvarado Vendedores"
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Mensaje</label>
            <textarea
              className="input"
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              placeholder="Recuerden actualizar las entradas vendidas."
              required
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Enviando..." : "ENVIAR AHORA"}
          </button>
        </form>
      </div>

      {/* Schedule notification */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
          🕐 Programar recordatorio
        </h3>
        <form onSubmit={scheduleNotification}>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Título</label>
            <input
              className="input"
              value={schedTitle}
              onChange={(e) => setSchedTitle(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="label">Mensaje</label>
            <textarea
              className="input"
              value={schedMessage}
              onChange={(e) => setSchedMessage(e.target.value)}
              placeholder="Recuerden traer las entradas y el dinero."
              required
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label className="label">Fecha</label>
              <input
                className="input"
                type="date"
                value={schedDate}
                onChange={(e) => setSchedDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Hora</label>
              <input
                className="input"
                type="time"
                value={schedTime}
                onChange={(e) => setSchedTime(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Programando..." : "PROGRAMAR"}
          </button>
        </form>
      </div>

      {/* Scheduled list */}
      {scheduled.length > 0 && (
        <div className="card" style={{ overflow: "hidden" }}>
          <div className="section-header">Recordatorios programados</div>
          {scheduled
            .filter((n) => !n.sent && !n.cancelled)
            .map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--blue-neon)" }}>
                    📅 {format(new Date(n.scheduled_for), "dd/MM/yyyy HH:mm", { locale: es })}
                  </div>
                </div>
                <button
                  onClick={() => cancelScheduled(n.id)}
                  className="btn-danger"
                  style={{ whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  Cancelar
                </button>
              </div>
            ))}
          {scheduled.filter((n) => !n.sent && !n.cancelled).length === 0 && (
            <div style={{ padding: 16, color: "var(--text-muted)", fontSize: 13 }}>
              No hay recordatorios pendientes.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
