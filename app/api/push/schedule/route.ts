import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

// POST create scheduled notification
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { title, message, scheduled_for } = await req.json();

  if (!message || !scheduled_for) {
    return NextResponse.json({ error: "Mensaje y fecha son requeridos" }, { status: 400 });
  }

  const scheduledDate = new Date(scheduled_for);
  if (scheduledDate <= new Date()) {
    return NextResponse.json({ error: "La fecha debe ser en el futuro" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("scheduled_notifications")
    .insert({
      title: title || "Alvarado Vendedores",
      message,
      scheduled_for: scheduledDate.toISOString(),
      created_by: session.userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notification: data }, { status: 201 });
}

// DELETE cancel scheduled notification
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await req.json();
  const { error } = await supabaseAdmin
    .from("scheduled_notifications")
    .update({ cancelled: true })
    .eq("id", id)
    .eq("sent", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
