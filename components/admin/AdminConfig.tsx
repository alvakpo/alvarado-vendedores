"use client";

import { useState, useEffect } from "react";

type EventConfig = {
  name: string;
  total_tickets: number;
  ticket_price: number;
  status: "open" | "closed";
};

type ParticipantSummary = {
  id: string;
  first_name: string;
  last_name: string;
  tickets_assigned: number;
  tickets_sold: number;
  status: string;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);
}

export default function AdminConfig() {
  const [config, setConfig] = useState<EventConfig | null>(null);
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [toast, setToast] = useState("");

  function showToastMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/config").then((r) => r.json()),
      fetch("/api/admin/participants").then((r) => r.json()),
    ]).then(([configData, partData]) => {
      setConfig(configData.config);
      setParticipants(partData.participants || []);
      setLoading(false);
    });
  }, []);

  async function handleClose() {
    setClosing(true);
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    if (res.ok) {
      setConfig((c) => c ? { ...c, status: "closed" } : null);
      showToastMsg("Venta cerrada correctamente.");
    }
    setClosing(false);
    setShowCloseConfirm(false);
  }

  async function handleReopen() {
    const res = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "open" }),
    });
    if (res.ok) {
      setConfig((c) => c ? { ...c, status: "open" } : null);
      showToastMsg("Venta reabierta.");
    }
  }

  if (loading) {
    return <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Cargando...</div>;
  }

  const totalSold = participants.reduce((s, p) => s + p.tickets_sold, 0);
  const totalAssigned = participants.reduce((s, p) => s + p.tickets_assigned, 0);
  const totalTickets = config?.total_tickets ?? 500;
  const ticketPrice = config?.ticket_price ?? 10000;

  return (
    <div className="animate-fade-in">
      {toast && <div className="toast success">{toast}</div>}

      {/* Event status */}
      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
          Estado del evento
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.8px",
              ...(config?.status === "open"
                ? { background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
                : { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }),
            }}
          >
            {config?.status === "open" ? "VENTA ABIERTA" : "VENTA CERRADA"}
          </div>
        </div>

        {config?.status === "open" ? (
          <button
            className="btn-danger"
            onClick={() => setShowCloseConfirm(true)}
            style={{ padding: "10px 20px", fontSize: 13 }}
          >
            🔒 CERRAR VENTA
          </button>
        ) : (
          <button
            className="btn-secondary"
            onClick={handleReopen}
            style={{ fontSize: 13 }}
          >
            🔓 Reabrir venta
          </button>
        )}
      </div>

      {/* Final summary */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
        <div className="section-header">Resumen de cierre</div>
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Total entradas", value: totalTickets },
              { label: "Vendidas", value: totalSold, color: "var(--blue-neon)" },
              { label: "Asignadas", value: totalAssigned },
              { label: "Sin asignar", value: totalTickets - totalAssigned },
              { label: "En manos de vendedores", value: totalAssigned - totalSold, color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label} className="stat-card" style={{ padding: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color || "var(--text-primary)" }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
            <div className="stat-card" style={{ padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#4ade80" }}>{formatMoney(totalSold * ticketPrice)}</div>
              <div className="stat-label">Recaudado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Per-participant summary */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="section-header">Detalle por participante</div>
        {participants.map((p) => (
          <div
            key={p.id}
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                {p.first_name} {p.last_name}
                {p.status === "inactive" && (
                  <span style={{ fontSize: 10, color: "var(--text-muted)", marginLeft: 6 }}>(inactivo)</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Asignadas: {p.tickets_assigned} · Vendidas: {p.tickets_sold} · Restantes: {p.tickets_assigned - p.tickets_sold}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>
                {formatMoney(p.tickets_sold * ticketPrice)}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Restante: {formatMoney((p.tickets_assigned - p.tickets_sold) * ticketPrice)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Close confirmation modal */}
      {showCloseConfirm && (
        <div className="modal-overlay" onClick={() => setShowCloseConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
              ¿Cerrar la venta?
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.5 }}>
              Al cerrar la venta, los vendedores <strong>no podrán modificar</strong> sus cantidades vendidas.
              El tablero público seguirá visible. Esta acción se puede revertir.
            </p>

            {/* Summary */}
            <div
              style={{
                background: "var(--bg-secondary)",
                borderRadius: 8,
                padding: 14,
                marginBottom: 20,
                fontSize: 13,
                color: "var(--text-secondary)",
              }}
            >
              <div>Total vendidas: <strong style={{ color: "var(--blue-neon)" }}>{totalSold}</strong> / {totalTickets}</div>
              <div>Recaudado: <strong style={{ color: "#4ade80" }}>{formatMoney(totalSold * ticketPrice)}</strong></div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-secondary" onClick={() => setShowCloseConfirm(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={handleClose}
                disabled={closing}
                style={{ flex: 1, padding: "10px" }}
              >
                {closing ? "Cerrando..." : "CERRAR VENTA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
