import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

// GET history (admin only)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const participantId = url.searchParams.get("participant_id");
  const limit = parseInt(url.searchParams.get("limit") || "100");

  let query = supabaseAdmin
    .from("history")
    .select(`
      *,
      participants(first_name, last_name),
      users(username)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (participantId) {
    query = query.eq("participant_id", participantId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ history: data });
}
