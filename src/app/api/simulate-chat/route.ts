import { NextRequest, NextResponse } from "next/server";
import { createNote, createReminder } from "@/lib/db";
import { extractTaskWithAI, shouldTriggerInGroup } from "@/lib/ai-extractor";
import { buildReminderConfirmationFlex } from "@/lib/line-flex";
import { SourceType } from "@/types";

/**
 * จำลองการทำงานของ LINE Chatbot (ทั้งโหมดคุยส่วนตัว 1-on-1 และโหมดในกลุ่ม LINE Group)
 * เพื่อให้ทดสอบ AI Task Extraction + Trigger Keyword + Flex Message ได้ทันทีบนหน้าเว็บ
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text,
      source_id = "U_DEMO_USER_01",
      source_type = "user",
      user_id = "U_DEMO_USER_01",
    }: {
      text: string;
      source_id?: string;
      source_type?: SourceType;
      user_id?: string;
    } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "กรุณาพิมพ์ข้อความ" }, { status: 400 });
    }

    // Group Chat Trigger Rule Check: ต้องแท็กชื่อ @ชะโด เท่านั้น
    if (source_type === "group" && !shouldTriggerInGroup(text)) {
      return NextResponse.json({
        ignored_in_group: true,
        reason:
          'ในกลุ่ม LINE บอทจะไม่รบกวนบทสนทนาทั่วไป จะทำงานเฉพาะข้อความที่มีการแท็กชื่อ @ชะโด หรือ ชะโด เท่านั้น เพื่อป้องกันการตั้งเตือนผิดพลาด',
      });
    }

    const extracted = await extractTaskWithAI(text, new Date());

    if (extracted.is_chat_intent) {
      return NextResponse.json({
        ignored_in_group: false,
        type: "chat",
        extracted,
        bot_text: extracted.chat_reply,
      });
    }

    if (extracted.is_note_intent) {
      const note = await createNote({
        source_id,
        content: extracted.task_title,
        file_type: "text",
      });

      return NextResponse.json({
        ignored_in_group: false,
        type: "note",
        extracted,
        note,
        bot_text: `📝 บันทึกโน้ตเรียบร้อยแล้วครับ:\n"${note.content}"`,
      });
    }

    const reminder = await createReminder({
      source_id,
      source_type,
      created_by_user_id: user_id,
      title: extracted.task_title,
      remind_at: extracted.remind_at,
      repeat_type: extracted.repeat_type,
    });

    const flexMessage = buildReminderConfirmationFlex(reminder);

    return NextResponse.json({
      ignored_in_group: false,
      type: "reminder",
      extracted,
      reminder,
      flexMessage,
    });
  } catch (error) {
    console.error("POST /api/simulate-chat error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการประมวลผลข้อความ" },
      { status: 500 }
    );
  }
}
