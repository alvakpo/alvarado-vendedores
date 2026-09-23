"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import NotificationButton from "@/components/NotificationButton";

type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  participant_type: string;
  photo_url: string | null;
  tickets_assigned: number;
  tickets_sold: number;
  sort_order: number;
};

type DashboardData = {
  config: {
    name: string;
    total_tickets: number;
    ticket_price: number;
    status: string;
  };
  participants: Participant[];
  totals: {
    total: number;
    assigned: number;
    unassigned: number;
    sold: number;
    in_hands: number;
    revenue: number;
    percentage: number;
  };
};

function formatMoney(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function Avatar({ participant }: { participant: Participant }) {
  const initials = `${participant.first_name[0]}${participant.last_name[0]}`.toUpperCase();
  
  if (participant.photo_url) {
    return (
      <div className="avatar-sm">
        <Image
          src={participant.photo_url}
          alt={`${participant.first_name} ${participant.last_name}`}
          width={36}
          height={36}
          style={{ objectFit: "cover", width: "100%", height: "100%" }}
        />
      </div>
    );
  }
  return <div className="avatar-sm">{initials}</div>;
}

function ParticipantRow({ participant }: { participant: Participant }) {
  const pct =
    participant.tickets_assigned > 0
      ? (participant.tickets_sold / participant.tickets_assigned) * 100
      : 0;
  const isComplete = participant.tickets_assigned > 0 && participant.tickets_sold >= participant.tickets_assigned;

  return (
    <div className="participant-row animate-slide-in">
      {/* Left: Avatar + Name */}
      <div style={{ width: 60, flexShrink: 0 }}>
        <Avatar participant={participant} />
        <div
          style={{
            fontSize: 10,
            color: "var(--text-secondary)",
            lineHeight: 1.2,
            marginTop: 3,
            maxWidth: 60,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 500,
          }}
          title={`${participant.first_name} ${participant.last_name}`}
        >
          {participant.first_name}
        </div>
        <div
          style={{
            fontSize: 9,
            color: "var(--text-muted)",
            lineHeight: 1.1,
            maxWidth: 60,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={participant.last_name}
        >
          {participant.last_name}
        </div>
      </div>

      {/* Right: Progress */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="progress-bar" style={{ height: 14, marginBottom: 4 }}>
          <div
            className={`progress-fill ${isComplete ? "completed" : ""}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
            {participant.tickets_sold} / {participant.tickets_assigned}
          </span>
          {isComplete ? (
            <span className="completed-badge">
              <span>✦</span> AGOTADAS
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: pct > 0 ? "var(--blue-neon)" : "var(--text-muted)",
              }}
            >
              {pct.toFixed(0)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/public/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid var(--border)",
              borderTop: "3px solid var(--blue-electric)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Cargando...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const totals = data?.totals;
  const config = data?.config;
  const participants = data?.participants || [];

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "-0.3px",
                color: "var(--text-primary)",
              }}
            >
              ALVARADO{" "}
              <span style={{ color: "var(--blue-neon)" }}>VENDEDORES</span>
            </h1>
            {config?.status === "closed" && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#f87171",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                VENTA CERRADA
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <NotificationButton />
            <Link
              href="/login"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--blue-electric)",
                textDecoration: "none",
                border: "1px solid var(--border-blue)",
                padding: "6px 12px",
                borderRadius: 6,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              INGRESAR
            </Link>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 720, margin: "0 auto", width: "100%", padding: "16px" }}>
        {/* Global Stats */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "16px",
            marginBottom: 16,
          }}
        >
          {/* Main counter */}
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div
              style={{
                fontSize: 42,
                fontWeight: 900,
                letterSpacing: "-2px",
                lineHeight: 1,
                color: "var(--text-primary)",
              }}
            >
              <span style={{ color: "var(--blue-neon)" }}>{totals?.sold ?? 0}</span>
              <span style={{ color: "var(--text-muted)", fontSize: 28 }}>
                {" "}/ {totals?.total ?? 500}
              </span>
            </div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "1.2px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              ENTRADAS VENDIDAS
            </p>
          </div>

          {/* Main progress bar */}
          <div style={{ marginBottom: 12 }}>
            <div className="progress-bar" style={{ height: 20 }}>
              <div
                className={`progress-fill ${totals?.sold === totals?.total && (totals?.total ?? 0) > 0 ? "completed" : ""}`}
                style={{ width: `${totals?.percentage ?? 0}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--blue-neon)",
                  letterSpacing: "-0.5px",
                }}
              >
                {totals?.percentage?.toFixed(1) ?? 0}%
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Avance
              </div>
            </div>
            <div style={{ textAlign: "center", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)" }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.3px",
                }}
              >
                {formatMoney(totals?.revenue ?? 0)}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Recaudado
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: "var(--text-secondary)",
                  letterSpacing: "-0.5px",
                }}
              >
                {totals?.unassigned ?? 0}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Sin asignar
              </div>
            </div>
          </div>
        </div>

        {/* Participants list */}
        <div
          className="card"
          style={{
            overflow: "hidden",
          }}
        >
          <div className="section-header">
            VENDEDORES Y PUNTOS DE VENTA — {participants.length} activos
          </div>
          {participants.length === 0 ? (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              No hay participantes activos todavía.
            </div>
          ) : (
            <div>
              {participants.map((p) => (
                <ParticipantRow key={p.id} participant={p} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            padding: "16px",
            color: "var(--text-muted)",
            fontSize: 11,
          }}
        >
          Actualización automática cada 30 segundos
        </div>
      </main>
    </div>
  );
}
