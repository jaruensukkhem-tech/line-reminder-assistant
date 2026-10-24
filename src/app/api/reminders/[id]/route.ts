import { NextRequest, NextResponse } from "next/server";
import { deleteReminder, getReminderById, updateReminder } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updated = await updateReminder(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "ไม่พบรายการแจ้งเตือน" }, { status: 404 });
    }
    return NextResponse.json({ reminder: updated });
  } catch (error) {
    console.error("PATCH /api/reminders/[id] error:", error);
    return NextResponse.json({ error: "ไม่สามารถอัปเดตรายการได้" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteReminder(params.id);
    if (!deleted) {
      return NextResponse.json({ error: "ไม่พบรายการแจ้งเตือน" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/reminders/[id] error:", error);
    return NextResponse.json({ error: "ไม่สามารถลบรายการได้" }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reminder = await getReminderById(params.id);
  if (!reminder) {
    return NextResponse.json({ error: "ไม่พบรายการแจ้งเตือน" }, { status: 404 });
  }
  return NextResponse.json({ reminder });
}
