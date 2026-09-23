"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Participant = {
  id: string;
  first_name: string;
  last_name: string;
  participant_type: string;
  photo_url: string | null;
  tickets_assigned: number;
  tickets_sold: number;
  status: string;
  sort_order: number;
  users?: { username: string } | null;
};

function formatMoney(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(n);
}

function Avatar({ p }: { p: Participant }) {
  const initials = `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
  if (p.photo_url) {
    return (
      <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0 }}>
        <Image src={p.photo_url} alt={p.first_name} width={40} height={40} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg, #0ea5e9, #0369a1)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function SortableRow({
  p,
  onEdit,
}: {
  p: Participant;
  onEdit: (p: Participant) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const pct = p.tickets_assigned > 0 ? (p.tickets_sold / p.tickets_assigned) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderBottom: "1px solid var(--border)",
        background: isDragging ? "var(--bg-surface)" : "transparent",
        cursor: isDragging ? "grabbing" : "default",
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: "grab", color: "var(--text-muted)", fontSize: 16, flexShrink: 0, padding: "0 4px" }}
        title="Arrastrar para reordenar"
      >
        ⠿
      </div>

      <Avatar p={p} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {p.first_name} {p.last_name}
          </span>
          {p.participant_type === "punto_venta" && (
            <span className="badge badge-gray">Punto</span>
          )}
          {p.status === "inactive" && (
            <span className="badge" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
              INACTIVO
            </span>
          )}
        </div>
        {p.users && (
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>@{p.users.username}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <div className="progress-bar" style={{ height: 6, flex: 1 }}>
            <div
              className={`progress-fill ${pct >= 100 ? "completed" : ""}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
            {p.tickets_sold}/{p.tickets_assigned}
          </span>
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
          {formatMoney(p.tickets_sold * 10000)}
        </div>
        <button
          onClick={() => onEdit(p)}
          style={{
            fontSize: 11, fontWeight: 600, color: "var(--blue-electric)",
            background: "var(--blue-dim)", border: "1px solid var(--border-blue)",
            padding: "4px 10px", borderRadius: 5, cursor: "pointer",
          }}
        >
          Editar
        </button>
      </div>
    </div>
  );
}

// Modal to create/edit participant
function ParticipantModal({
  participant,
  onClose,
  onSave,
}: {
  participant: Participant | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const isEdit = !!participant;
  const [form, setForm] = useState({
    first_name: participant?.first_name || "",
    last_name: participant?.last_name || "",
    username: participant?.users?.username || "",
    participant_type: participant?.participant_type || "vendor",
    tickets_assigned: participant?.tickets_assigned ?? 0,
    tickets_sold: participant?.tickets_sold ?? 0,
    status: participant?.status || "active",
    new_password: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!participant?.id) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/participants/${participant.id}`, { method: "DELETE" });
      if (res.ok) {
        onSave();
        onClose();
      } else {
        const data = await res.json();
        setError(data.error || "Error al eliminar");
      }
    } catch {
      setError("Error de conexión");
    }
    setDeleting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let photo_url = participant?.photo_url;

      // Upload photo if selected
      if (photoFile && participant?.id) {
        const fd = new FormData();
        fd.append("file", photoFile);
        fd.append("participantId", participant.id);
        const uploadRes = await fetch("/api/upload/photo", { method: "POST", body: fd });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          photo_url = uploadData.url;
        }
      }

      const body: Record<string, unknown> = {
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        participant_type: form.participant_type,
        tickets_assigned: Number(form.tickets_assigned),
        tickets_sold: Number(form.tickets_sold),
        status: form.status,
        photo_url,
      };

      if (form.new_password) {
        body.new_password = form.new_password;
      }

      let res;
      if (isEdit) {
        res = await fetch(`/api/admin/participants/${participant!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/admin/participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      // If photo upload was separate (new participant)
      if (!isEdit && photoFile && res.ok) {
        const newP = await res.clone().json();
        if (newP.participant?.id) {
          const fd = new FormData();
          fd.append("file", photoFile);
          fd.append("participantId", newP.participant.id);
          await fetch("/api/upload/photo", { method: "POST", body: fd });
        }
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Error al guardar");
      } else {
        onSave();
        onClose();
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
            {isEdit ? "Editar Participante" : "Nuevo Participante"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
              width: 32,
              height: 32,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {!isEdit && (
          <div
            style={{
              background: "rgba(14,165,233,0.08)",
              border: "1px solid var(--border-blue)",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 16,
              fontSize: 12,
              color: "var(--blue-neon)",
            }}
          >
            💡 La contraseña inicial será <strong>123456</strong>. El vendedor podrá cambiarla después.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="label">Nombre</label>
              <input className="input" value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Apellido</label>
              <input className="input" value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} required />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="label">Tipo</label>
            <select
              className="input"
              value={form.participant_type}
              onChange={(e) => setForm((f) => ({ ...f, participant_type: e.target.value }))}
            >
              <option value="vendor">Vendedor</option>
              <option value="punto_venta">Punto de venta</option>
            </select>
          </div>

          {form.participant_type === "vendor" && (
            <div style={{ marginBottom: 12 }}>
              <label className="label">Usuario</label>
              <input
                className="input"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="usuario_vendedor"
                autoCapitalize="none"
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="label">Entradas Asignadas</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.tickets_assigned}
                onChange={(e) => setForm((f) => ({ ...f, tickets_assigned: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="label">Entradas Vendidas</label>
              <input
                className="input"
                type="number"
                min={0}
                value={form.tickets_sold}
                onChange={(e) => setForm((f) => ({ ...f, tickets_sold: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label className="label">Estado</label>
            <select className="input" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          {isEdit && (
            <div style={{ marginBottom: 12 }}>
              <label className="label">Nueva Contraseña (dejar vacío para no cambiar)</label>
              <input
                className="input"
                type="password"
                value={form.new_password}
                onChange={(e) => setForm((f) => ({ ...f, new_password: e.target.value }))}
                placeholder="••••••"
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label className="label">Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              style={{ color: "var(--text-secondary)", fontSize: 13 }}
            />
          </div>

          {error && (
            <div style={{ color: "#f87171", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "rgba(239,68,68,0.1)", borderRadius: 6 }}>
              {error}
            </div>
          )}

          {isEdit && confirmDelete && (
            <div style={{ marginBottom: 14, padding: "12px 14px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#f87171", marginBottom: 8 }}>
                ¿Confirmás eliminar a {participant.first_name} {participant.last_name}?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ flex: 1, padding: "8px 12px", fontSize: 12 }}
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar definitivamente"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setConfirmDelete(false)}
                  style={{ flex: 1, padding: "8px 12px", fontSize: 12 }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {isEdit && !confirmDelete && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => setConfirmDelete(true)}
                style={{ padding: "10px 14px", fontSize: 13 }}
                title="Eliminar vendedor"
              >
                🗑️ Eliminar
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" style={{ flex: 2 }} disabled={loading}>
              {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear participante"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null | undefined>(undefined);
  const [showInactive, setShowInactive] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchParticipants = useCallback(async () => {
    const res = await fetch("/api/admin/participants");
    if (res.ok) {
      const data = await res.json();
      setParticipants(data.participants || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = participants.findIndex((p) => p.id === active.id);
    const newIndex = participants.findIndex((p) => p.id === over.id);
    const newParticipants = arrayMove(participants, oldIndex, newIndex);

    // Update sort_order values
    const updated = newParticipants.map((p, i) => ({ ...p, sort_order: i }));
    setParticipants(updated);

    // Persist to server
    await fetch("/api/admin/participants/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: updated.map((p) => ({ id: p.id, sort_order: p.sort_order })) }),
    });
  }

  const filtered = showInactive ? participants : participants.filter((p) => p.status === "active");

  if (loading) {
    return <div style={{ color: "var(--text-muted)", padding: 40, textAlign: "center" }}>Cargando...</div>;
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            Participantes ({participants.filter((p) => p.status === "active").length} activos)
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            Arrastrá ⠿ para cambiar el orden
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setEditingParticipant(null)}
          style={{ fontSize: 13 }}
        >
          + Nuevo
        </button>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Mostrar inactivos
        </label>
      </div>

      <div className="card">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            {filtered.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                No hay participantes. Creá el primero con el botón &quot;+ Nuevo&quot;.
              </div>
            ) : (
              filtered.map((p) => (
                <SortableRow key={p.id} p={p} onEdit={setEditingParticipant} />
              ))
            )}
          </SortableContext>
        </DndContext>
      </div>

      {editingParticipant !== undefined && (
        <ParticipantModal
          participant={editingParticipant}
          onClose={() => setEditingParticipant(undefined)}
          onSave={fetchParticipants}
        />
      )}
    </div>
  );
}
