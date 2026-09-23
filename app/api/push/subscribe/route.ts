import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// POST subscribe to push notifications
export async function POST(req: NextRequest) {
  try {
    const { endpoint, keys } = await req.json();
    const { p256dh, auth } = keys;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const userAgent = req.headers.get("user-agent") || null;

    const { error } = await supabaseAdmin.from("push_subscriptions").upsert(
      { endpoint, p256dh, auth, user_agent: userAgent },
      { onConflict: "endpoint" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}

// DELETE unsubscribe
export async function DELETE(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
