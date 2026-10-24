import { NextRequest, NextResponse } from "next/server";
import { createNote, deleteNote, getNotes } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get("sourceId") || undefined;
  const notes = await getNotes(sourceId);
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      source_id = "U_DEMO_USER_01",
      content,
      file_url,
      file_type = "text",
    } = body;

    if (!content && !file_url) {
      return NextResponse.json(
        { error: "กรุณาระบุเนื้อหาโน้ตหรือไฟล์แนบ" },
        { status: 400 }
      );
    }

    const note = await createNote({
      source_id,
      content,
      file_url,
      file_type,
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกโน้ตได้" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing note id" }, { status: 400 });
  }
  const ok = await deleteNote(id);
  return NextResponse.json({ ok });
}
