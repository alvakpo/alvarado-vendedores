import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { sendPushToAll } from "@/lib/notifications";

// GET single participant
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Vendors can only see their own profile
  if (session.role === "vendor" && session.participantId !== id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("participants")
    .select("*, users(username)")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ participant: data });
}

// PATCH update participant
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = session.role === "admin";
  const isOwnProfile = session.role === "vendor" && session.participantId === id;

  if (!isAdmin && !isOwnProfile) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();

  // Get current participant data for comparison
  const { data: current, error: fetchError } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const historyEntries: Array<{
    participant_id: string;
    changed_by: string | null;
    action: string;
    field_changed?: string;
    old_value?: string;
    new_value?: string;
    notes?: string;
  }> = [];

  if (isAdmin) {
    // Admin can change everything
    if (body.first_name !== undefined) updateData.first_name = body.first_name;
    if (body.last_name !== undefined) updateData.last_name = body.last_name;
    if (body.photo_url !== undefined) updateData.photo_url = body.photo_url;
    if (body.status !== undefined) {
      updateData.status = body.status;
      historyEntries.push({
        participant_id: id,
        changed_by: session.userId || null,
        action: "status_change",
        field_changed: "status",
        old_value: current.status,
        new_value: body.status,
      });
    }
    if (body.sort_order !== undefined) {
      updateData.sort_order = body.sort_order;
      historyEntries.push({
        participant_id: id,
        changed_by: session.userId || null,
        action: "order_change",
        field_changed: "sort_order",
        old_value: String(current.sort_order),
        new_value: String(body.sort_order),
      });
    }
    if (body.tickets_assigned !== undefined) {
      const newAssigned = Number(body.tickets_assigned);
      if (newAssigned < current.tickets_sold) {
        return NextResponse.json(
          { error: "No se puede asignar menos entradas de las que ya se vendieron" },
          { status: 400 }
        );
      }
      updateData.tickets_assigned = newAssigned;
      historyEntries.push({
        participant_id: id,
        changed_by: session.userId || null,
        action: "assigned_change",
        field_changed: "tickets_assigned",
        old_value: String(current.tickets_assigned),
        new_value: String(newAssigned),
      });
    }
    if (body.tickets_sold !== undefined) {
      const newSold = Number(body.tickets_sold);
      const assigned = body.tickets_assigned !== undefined ? Number(body.tickets_assigned) : current.tickets_assigned;
      if (newSold > assigned) {
        return NextResponse.json(
          { error: "Las entradas vendidas no pueden superar las asignadas" },
          { status: 400 }
        );
      }
      updateData.tickets_sold = newSold;
      historyEntries.push({
        participant_id: id,
        changed_by: session.userId || null,
        action: "sold_change",
        field_changed: "tickets_sold",
        old_value: String(current.tickets_sold),
        new_value: String(newSold),
      });
    }

    // Handle password reset
    if (body.new_password) {
      const passwordHash = await bcrypt.hash(body.new_password, 12);
      if (current.user_id) {
        await supabaseAdmin
          .from("users")
          .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
          .eq("id", current.user_id);
        historyEntries.push({
          participant_id: id,
          changed_by: session.userId || null,
          action: "password_reset",
          notes: "Contraseña restablecida por administrador",
        });
      }
    }

    // Handle username change
    if (body.username && current.user_id) {
      const uname = body.username.toLowerCase().trim();
      const { data: uExisting } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("username", uname)
        .neq("id", current.user_id)
        .single();
      if (uExisting) {
        return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
      }
      await supabaseAdmin
        .from("users")
        .update({ username: uname, updated_at: new Date().toISOString() })
        .eq("id", current.user_id);
    }
  } else {
    // Vendor can only update tickets_sold and photo
    if (body.tickets_sold !== undefined) {
      const newSold = Number(body.tickets_sold);
      if (newSold > current.tickets_assigned) {
        return NextResponse.json(
          { error: "Las entradas vendidas no pueden superar las asignadas" },
          { status: 400 }
        );
      }
      if (newSold < 0) {
        return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
      }
      updateData.tickets_sold = newSold;
      historyEntries.push({
        participant_id: id,
        changed_by: session.userId || null,
        action: "sold_change",
        field_changed: "tickets_sold",
        old_value: String(current.tickets_sold),
        new_value: String(newSold),
      });
    }
    if (body.photo_url !== undefined) {
      updateData.photo_url = body.photo_url;
    }
  }

  // Handle password change by vendor themselves
  if (!isAdmin && body.current_password && body.new_password) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("password_hash")
      .eq("id", session.userId!)
      .single();

    if (!user) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const valid = await bcrypt.compare(body.current_password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
    }

    const newHash = await bcrypt.hash(body.new_password, 12);
    await supabaseAdmin
      .from("users")
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq("id", session.userId!);
    historyEntries.push({
      participant_id: id,
      changed_by: session.userId || null,
      action: "password_change",
      notes: "Contraseña cambiada por el vendedor",
    });
  }

  // Update participant
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("participants")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Insert history entries
  if (historyEntries.length > 0) {
    await supabaseAdmin.from("history").insert(historyEntries);
  }

  // Check if reached 100% (only when tickets_sold changed)
  if (
    body.tickets_sold !== undefined &&
    updated.tickets_assigned > 0 &&
    updated.tickets_sold === updated.tickets_assigned &&
    current.tickets_sold < current.tickets_assigned
  ) {
    // Fire push notification
    await sendPushToAll({
      title: "🎉 ¡Entradas Agotadas!",
      body: `${updated.first_name} ${updated.last_name} vendió todas sus entradas.`,
    });
  }

  return NextResponse.json({ participant: updated });
}

// DELETE participant (admin only)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch participant to check for associated user_id
  const { data: participant } = await supabaseAdmin
    .from("participants")
    .select("user_id")
    .eq("id", id)
    .single();

  // Delete participant
  const { error } = await supabaseAdmin
    .from("participants")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Delete user record if exists
  if (participant?.user_id) {
    await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", participant.user_id);
  }

  return NextResponse.json({ success: true });
}
