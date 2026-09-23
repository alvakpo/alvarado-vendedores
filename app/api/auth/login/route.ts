import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Usuario y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("username", username.toLowerCase().trim())
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    // Get participant if vendor
    let participantId: string | undefined;
    if (user.role === "vendor") {
      const { data: participant } = await supabaseAdmin
        .from("participants")
        .select("id")
        .eq("user_id", user.id)
        .single();
      participantId = participant?.id;
    }

    const session = await getSession();
    session.userId = user.id;
    session.username = user.username;
    session.role = user.role;
    session.participantId = participantId;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      role: user.role,
      username: user.username,
    });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
