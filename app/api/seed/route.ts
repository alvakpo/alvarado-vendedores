import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

// This route seeds the initial admin user
// Call POST /api/seed to initialize
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if admin already exists
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", "alvakpo")
    .single();

  if (existing) {
    return NextResponse.json({ message: "Admin already exists" });
  }

  // Create admin user
  const passwordHash = await bcrypt.hash("alvaradomdp", 12);
  const { error } = await supabaseAdmin.from("users").insert({
    username: "alvakpo",
    password_hash: passwordHash,
    role: "admin",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Admin user created" });
}
