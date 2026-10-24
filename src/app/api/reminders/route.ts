import { NextRequest, NextResponse } from "next/server";
import { createReminder, getReminders, listSources } from "@/lib/db";
import { RepeatType, SourceType } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get("sourceId") || undefined;

  const [reminders, sources] = await Promise.all([
    getReminders(sourceId),
    listSources(),
  ]);

  return NextResponse.json({ reminders, sources });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      source_id = "U_DEMO_USER_01",
      source_type,
      source_name,
      created_by_user_id,
      title,
      remind_at,
      repeat_type = "once",
    } = body;

    if (!title || !remind_at) {
      return NextResponse.json(
        { error: "กรุณาระบุหัวข้อการแจ้งเตือนและวันเวลา" },
        { status: 400 }
      );
    }

    const created = await createReminder({
      source_id,
      source_type: source_type as SourceType | undefined,
      source_name,
      created_by_user_id,
      title,
      remind_at,
      repeat_type: repeat_type as RepeatType,
    });

    return NextResponse.json({ reminder: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/reminders error:", error);
    return NextResponse.json({ error: "ไม่สามารถสร้างรายการแจ้งเตือนได้" }, { status: 500 });
  }
}
