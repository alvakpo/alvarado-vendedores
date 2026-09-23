import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

// GET vendor's own profile
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "vendor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!session.participantId) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from("participants")
    .select("*")
    .eq("id", session.participantId)
    .single();

  if (error) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Get event config to check if event is closed
  const { data: config } = await supabaseAdmin
    .from("event_config")
    .select("status, ticket_price")
    .eq("id", 1)
    .single();

  return NextResponse.json({ participant: data, eventStatus: config?.status || "open" });
}
