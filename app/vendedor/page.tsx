"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  photo_url: string | null;
  tickets_assigned: number;
  tickets_sold: number;
  status: string;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return <div className={`toast ${type}`}>{message}</div>;
}

export default function VendorPage() {
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [eventStatus, setEventStatus] = useState("open");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soldInput, setSoldInput] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Password change
  const [showPwChange, setShowPwChange] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");

  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const router = useRouter();

  function showToastMsg(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/vendor/profile");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (res.ok) {
      const data = await res.json();
      setParticipant(data.participant);
      setEventStatus(data.eventStatus);
      setSoldInput(data.participant.tickets_sold);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleSaveSold(e: React.FormEvent) {
    e.preventDefault();
    if (!participant) return;
    setSaving(true);

    const res = await fetch(`/api/admin/participants/${participant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickets_sold: soldInput }),
    });

    if (res.ok) {
      const data = await res.json();
      setParticipant(data.participant);
      setSoldInput(data.participant.tickets_sold);
      showToastMsg("¡Guardado correctamente!");
    } else {
      const data = await res.json();
      showToastMsg(data.error || "Error al guardar", "error");
    }
    setSaving(false);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !participant) return;
    setPhotoFile(file);
    setPhotoLoading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("participantId", participant.id);
    const res = await fetch("/api/upload/photo", { method: "POST", body: fd });

    if (res.ok) {
      const data = await res.json();
      setParticipant((p) => p ? { ...p, photo_url: data.url } : null);
      showToastMsg("Foto actualizada");
    } else {
      showToastMsg("Error al subir la foto", "error");
    }
    setPhotoLoading(false);
    setPhotoFile(null);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");

    if (newPw.length < 6) {
      setPwError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Las contraseñas no coinciden");
      return;
    }
    if (!participant) return;

    setSaving(true);
    const res = await fetch(`/api/admin/participants/${participant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_password: currentPw, new_password: newPw }),
    });

    if (res.ok) {
      showToastMsg("Contraseña cambiada correctamente");
      setShowPwChange(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } else {
      const data = await res.json();
      setPwError(data.error || "Error al cambiar contraseña");
    }
    setSaving(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 36, height: 36, border: "3px solid var(--border)", borderTop: "3px solid var(--blue-electric)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!participant) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          <p style={{ marginBottom: 12 }}>No se encontró tu perfil de vendedor.</p>
          <button className="btn-secondary" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </div>
    );
  }

  const pct = participant.tickets_assigned > 0
    ? (participant.tickets_sold / participant.tickets_assigned) * 100
    : 0;
  const isComplete = participant.tickets_assigned > 0 && participant.tickets_sold >= participant.tickets_assigned;
  const isClosed = eventStatus === "closed";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <header style={{
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <h1 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
          <span style={{ color: "var(--blue-neon)" }}>MI</span> PERFIL
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/" style={{ fontSize: 12, color: "var(--blue-electric)", textDecoration: "none" }}>Tablero ↗</a>
          <button onClick={handleLogout} style={{ fontSize: 12, color: "var(--text-muted)", background: "transparent", border: "1px solid var(--border)", padding: "5px 10px", borderRadius: 6, cursor: "pointer" }}>
            Salir
          </button>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: 500, margin: "0 auto", width: "100%", padding: "16px" }}>
        {isClosed && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 10, padding: "12px 16px", marginBottom: 16,
            color: "#f87171", fontSize: 13, fontWeight: 600,
          }}>
            ⚠️ La venta está cerrada. No podés modificar tus entradas vendidas.
          </div>
        )}

        {/* Profile card */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            {/* Avatar with upload */}
            <label style={{ cursor: "pointer", position: "relative" }} title="Cambiar foto">
              <div style={{
                width: 64, height: 64, borderRadius: 12, overflow: "hidden",
                background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 700, color: "white",
                border: "2px solid var(--border-blue)",
              }}>
                {participant.photo_url ? (
                  <Image
                    src={participant.photo_url}
                    alt={participant.first_name}
                    width={64}
                    height={64}
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                ) : (
                  `${participant.first_name[0]}${participant.last_name[0]}`.toUpperCase()
                )}
              </div>
              {photoLoading && (
                <div style={{
                  position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                  borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "white",
                }}>
                  ...
                </div>
              )}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} />
            </label>

            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                {participant.first_name} {participant.last_name}
              </h2>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                Tocá la foto para cambiarla
              </div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>Progreso</span>
              <span style={{ fontSize: 28, fontWeight: 900, color: "var(--blue-neon)", letterSpacing: "-1px" }}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="progress-bar" style={{ height: 20, marginBottom: 8 }}>
              <div
                className={`progress-fill ${isComplete ? "completed" : ""}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            {isComplete && (
              <div style={{ textAlign: "center", marginTop: 4 }}>
                <span className="completed-badge">✦ ¡ENTRADAS AGOTADAS!</span>
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            <div style={{ textAlign: "center", padding: 10, background: "var(--bg-secondary)", borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--blue-neon)" }}>{participant.tickets_sold}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Vendidas</div>
            </div>
            <div style={{ textAlign: "center", padding: 10, background: "var(--bg-secondary)", borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>{participant.tickets_assigned}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Asignadas</div>
            </div>
            <div style={{ textAlign: "center", padding: 10, background: "var(--bg-secondary)", borderRadius: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-secondary)" }}>
                {participant.tickets_assigned - participant.tickets_sold}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Restantes</div>
            </div>
          </div>

          <div style={{
            marginTop: 12, padding: "10px 14px", background: "rgba(14,165,233,0.08)",
            borderRadius: 8, border: "1px solid var(--border-blue)",
          }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>Recaudado</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>
              {formatMoney(participant.tickets_sold * 10000)}
            </div>
          </div>
        </div>

        {/* Update sold */}
        {!isClosed && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
              Actualizar entradas vendidas
            </h3>
            <form onSubmit={handleSaveSold}>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Entradas vendidas</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  max={participant.tickets_assigned}
                  value={soldInput}
                  onChange={(e) => setSoldInput(parseInt(e.target.value) || 0)}
                  style={{ fontSize: 24, fontWeight: 800, textAlign: "center", padding: "14px" }}
                />
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, textAlign: "center" }}>
                  Máximo: {participant.tickets_assigned}
                </div>
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={saving}>
                {saving ? "Guardando..." : "GUARDAR"}
              </button>
            </form>
          </div>
        )}

        {/* Change password */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Contraseña</h3>
            <button
              className="btn-secondary"
              onClick={() => setShowPwChange(!showPwChange)}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              {showPwChange ? "Cancelar" : "Cambiar"}
            </button>
          </div>

          {showPwChange && (
            <form onSubmit={handlePasswordChange} style={{ marginTop: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Contraseña actual</label>
                <input className="input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Nueva contraseña</label>
                <input className="input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={6} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="label">Confirmar nueva contraseña</label>
                <input className="input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required />
              </div>
              {pwError && (
                <div style={{ color: "#f87171", fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>
                  {pwError}
                </div>
              )}
              <button type="submit" className="btn-primary" style={{ width: "100%" }} disabled={saving}>
                {saving ? "Cambiando..." : "CAMBIAR CONTRASEÑA"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
