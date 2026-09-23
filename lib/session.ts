import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  userId?: string;
  username?: string;
  role?: "admin" | "vendor";
  participantId?: string;
  isLoggedIn: boolean;
};

function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set.");
  }
  return {
    password: secret,
    cookieName: "alvarado-session",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(
    cookieStore,
    getSessionOptions()
  );
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
  }
  return session;
}
