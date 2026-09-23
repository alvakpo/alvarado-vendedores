import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

// Update sort order for all participants (drag & drop)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { order } = await req.json();
  // order is an array of { id, sort_order }

  if (!Array.isArray(order)) {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
  }

  // Update each participant's sort_order
  const updates = order.map(({ id, sort_order }: { id: string; sort_order: number }) =>
    supabaseAdmin
      .from("participants")
      .update({ sort_order, updated_at: new Date().toISOString() })
      .eq("id", id)
  );

  await Promise.all(updates);

  // Log history
  await supabaseAdmin.from("history").insert({
    participant_id: order[0]?.id,
    changed_by: session.userId,
    action: "order_change",
    notes: "Orden de participantes actualizado",
  });

  return NextResponse.json({ success: true });
}
