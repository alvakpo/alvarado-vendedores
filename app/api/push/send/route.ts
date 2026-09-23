import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sendPushToAll } from "@/lib/notifications";
import { supabaseAdmin } from "@/lib/supabase";

// Send manual notification (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { title, message } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "El mensaje es requerido" }, { status: 400 });
  }

  await sendPushToAll({
    title: title || "Alvarado Vendedores",
    body: message,
  });

  return NextResponse.json({ success: true });
}

// GET scheduled notifications (admin)
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("scheduled_notifications")
    .select("*")
    .eq("cancelled", false)
    .order("scheduled_for", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ notifications: data });
}
