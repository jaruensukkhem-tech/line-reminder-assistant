import { NextRequest, NextResponse } from "next/server";
import { getDueReminders, getNextRepeatDate, updateReminder } from "@/lib/db";
import { buildDueNotificationFlex } from "@/lib/line-flex";

async function sendLinePushMessage(to: string, messages: unknown[]): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || token === "your_line_channel_access_token") {
    console.log(`[Push Notification Dry-Run] To ${to}:`, JSON.stringify(messages, null, 2));
    return true;
  }

  const res = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      messages,
    }),
  });

  return res.ok;
}

/**
 * Push Notification Engine (Cron Endpoint)
 * ค้นหารายการแจ้งเตือนที่ถึงเวลา (remind_at <= NOW() และ status = 'pending')
 * แล้วส่ง Push Flex Message ไปยัง userId หรือ groupId
 */
export async function POST(req: NextRequest) {
  try {
    const dueList = await getDueReminders(new Date());
    const dispatched = [];

    for (const reminder of dueList) {
      const flexMessage = buildDueNotificationFlex(reminder);
      const sentOk = await sendLinePushMessage(reminder.source_id, [flexMessage]);

      if (sentOk) {
        if (reminder.repeat_type === "once") {
          await updateReminder(reminder.id, { status: "sent" });
        } else {
          // เลื่อนไปรอบถัดไปสำหรับ daily, weekly, monthly
          const nextRemindAt = getNextRepeatDate(reminder.remind_at, reminder.repeat_type);
          await updateReminder(reminder.id, {
            remind_at: nextRemindAt,
            status: "pending",
          });
        }
        dispatched.push({
          id: reminder.id,
          source_id: reminder.source_id,
          title: reminder.title,
          repeat_type: reminder.repeat_type,
          flexMessage,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      checked_at: new Date().toISOString(),
      dispatched_count: dispatched.length,
      dispatched,
    });
  } catch (error) {
    console.error("[Cron Notify Error]:", error);
    return NextResponse.json({ error: "Failed to run push notification job" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
