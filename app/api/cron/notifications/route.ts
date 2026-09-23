import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendPushToAll } from "@/lib/notifications";

// Vercel Cron endpoint - runs every minute to check for scheduled notifications
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Get notifications that are due
  const { data: notifications, error } = await supabaseAdmin
    .from("scheduled_notifications")
    .select("*")
    .eq("sent", false)
    .eq("cancelled", false)
    .lte("scheduled_for", now.toISOString());

  if (error) {
    console.error("Error fetching scheduled notifications:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!notifications || notifications.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  for (const notification of notifications) {
    await sendPushToAll({
      title: notification.title,
      body: notification.message,
    });

    await supabaseAdmin
      .from("scheduled_notifications")
      .update({ sent: true, sent_at: now.toISOString() })
      .eq("id", notification.id);

    processed++;
  }

  return NextResponse.json({ processed });
}
