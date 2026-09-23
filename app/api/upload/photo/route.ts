import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

// Upload participant photo
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const participantId = formData.get("participantId") as string;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    // Security: vendors can only upload for their own participant
    if (session.role === "vendor" && session.participantId !== participantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "El archivo no puede superar 5MB" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `participants/${participantId}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("photos")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("photos")
      .getPublicUrl(filename);

    const photoUrl = urlData.publicUrl;

    // Update participant photo_url
    if (participantId) {
      await supabaseAdmin
        .from("participants")
        .update({ photo_url: photoUrl, updated_at: new Date().toISOString() })
        .eq("id", participantId);
    }

    return NextResponse.json({ url: photoUrl });
  } catch {
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 });
  }
}
