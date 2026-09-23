import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// GET all participants (admin only)
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("participants")
    .select("*, users(username)")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ participants: data });
}

// POST create participant (admin only)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const {
    first_name,
    last_name,
    username,
    participant_type,
    tickets_assigned,
    tickets_sold = 0,
    status = "active",
    photo_url,
  } = body;

  if (!first_name || !last_name) {
    return NextResponse.json({ error: "Nombre y apellido son requeridos" }, { status: 400 });
  }

  // Get max sort_order
  const { data: maxOrder } = await supabaseAdmin
    .from("participants")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sort_order = (maxOrder?.sort_order ?? -1) + 1;

  let userId: string | null = null;

  // Create user account for vendors
  if (participant_type === "vendor" && username) {
    const uname = username.toLowerCase().trim();
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", uname)
      .single();

    if (existing) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash("123456", 12);
    const { data: newUser, error: userError } = await supabaseAdmin
      .from("users")
      .insert({ username: uname, password_hash: passwordHash, role: "vendor" })
      .select()
      .single();

    if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });
    userId = newUser.id;
  }

  // Create participant
  const { data: participant, error: pError } = await supabaseAdmin
    .from("participants")
    .insert({
      user_id: userId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      participant_type: participant_type || "vendor",
      photo_url: photo_url || null,
      tickets_assigned: tickets_assigned || 0,
      tickets_sold: tickets_sold || 0,
      status,
      sort_order,
    })
    .select()
    .single();

  if (pError) return NextResponse.json({ error: pError.message }, { status: 500 });

  // Log history
  await supabaseAdmin.from("history").insert({
    participant_id: participant.id,
    changed_by: session.userId,
    action: "created",
    notes: `Participante creado con ${tickets_assigned || 0} entradas asignadas`,
  });

  return NextResponse.json({ participant }, { status: 201 });
}
