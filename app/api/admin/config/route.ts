import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

// GET event config
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("event_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}

// PATCH update event config (close/open event)
export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const allowedFields = ["status", "name", "total_tickets", "ticket_price"];
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  const { data, error } = await supabaseAdmin
    .from("event_config")
    .update(updateData)
    .eq("id", 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ config: data });
}
