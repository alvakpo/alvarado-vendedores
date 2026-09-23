import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    isLoggedIn: session.isLoggedIn || false,
    role: session.role,
    username: session.username,
    participantId: session.participantId,
  });
}
