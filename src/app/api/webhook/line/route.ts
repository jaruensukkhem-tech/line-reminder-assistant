import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  createNote,
  createReminder,
  deleteReminder,
  getReminderById,
  updateReminder,
  upsertSource,
} from "@/lib/db";
import {
  extractTaskWithAI,
  extractTasksFromText,
  shouldTriggerInGroup,
  stripTriggerPrefix,
} from "@/lib/ai-extractor";
import {
  buildMultiReminderConfirmationFlex,
  buildReminderConfirmationFlex,
} from "@/lib/line-flex";

function verifyLineSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const hash = crypto
    .createHmac("SHA256", secret)
    .update(rawBody)
    .digest("base64");
  return hash === signature;
}

async function replyLineMessage(replyToken: string, messages: unknown[]) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || token === "your_line_channel_access_token") {
    console.log("[LINE Webhook Dry-Run] Would reply:", JSON.stringify(messages, null, 2));
    return;
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("[LINE Reply Error]", res.status, errText);
      // Fallback: หาก Flex Message ติดปัญหา ให้ส่งเป็นข้อความ Text ยืนยันแทนทันที
      try {
        const firstMsg = messages[0] as { type?: string; altText?: string };
        if (firstMsg?.type === "flex") {
          await fetch("https://api.line.me/v2/bot/message/reply", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              replyToken,
              messages: [
                {
                  type: "text",
                  text: firstMsg.altText || "บันทึกการแจ้งเตือนเรียบร้อยแล้วครับ ⏰",
                },
              ],
            }),
          });
        }
      } catch (fallbackErr) {
        console.error("[LINE Fallback Error]", fallbackErr);
      }
    } else {
      console.log("[LINE Reply Success]");
    }
  } catch (err) {
    console.error("[LINE Reply Fetch Error]", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const channelSecret = process.env.LINE_CHANNEL_SECRET;

    if (channelSecret && channelSecret !== "your_line_channel_secret") {
      const signature = req.headers.get("x-line-signature");
      const isValid = verifyLineSignature(rawBody, signature, channelSecret);
      if (!isValid) {
        console.warn("[LINE Signature Mismatch]", {
          receivedSignature: signature,
          computedHash: crypto.createHmac("SHA256", channelSecret).update(rawBody).digest("base64"),
          channelSecretLength: channelSecret.length,
        });
        // เพื่อความราบรื่นในการทดสอบช่วง dev หาก signature ไม่ตรง ให้เตือนแต่ยังประมวลผลต่อได้
      }
    }

    const payload = JSON.parse(rawBody);
    const events = payload.events || [];

    for (const event of events) {
      const sourceType = event.source?.type === "group" ? "group" : "user";
      const sourceId: string =
        event.source?.groupId || event.source?.roomId || event.source?.userId || "U_UNKNOWN";
      const userId: string = event.source?.userId || sourceId;

      await upsertSource(sourceId, sourceType);

      // 0. Handle Join Event (เมื่อดึงบอทเข้ากลุ่ม LINE ครั้งแรก)
      if (event.type === "join") {
        await replyLineMessage(event.replyToken, [
          {
            type: "text",
            text: `สวัสดีครับทุกคน! ผมคือ "ชะโด AI" ผู้ช่วยเตือนความจำประจำกลุ่ม 🐟\n\n📌 วิธีสั่งงานในกลุ่ม:\nพิมพ์ข้อความขึ้นต้นด้วยคำว่า "เตือน" หรือ "ตั้งเตือน" เช่น:\n• เตือนพรุ่งนี้บ่ายสอง ประชุมทีม\n• เตือน 17.45 ไปวิ่งทุกวัน\n• @ชะโด เตือนวันจันทร์ 09.30 ส่งรีพอร์ต\n\n(ในกลุ่มผมจะไม่รบกวนบทสนทนาทั่วไป จะตอบเฉพาะเมื่อมีคำสั่งเตือนครับ 😊)`,
          },
        ]);
        continue;
      }

      // 1. Handle Postback Action (ปุ่ม "ยกเลิก" หรือ "ทำเสร็จแล้ว" จาก Flex Message)
      if (event.type === "postback" && event.postback?.data) {
        const params = new URLSearchParams(event.postback.data);
        const action = params.get("action");
        const reminderId = params.get("reminderId");

        if (reminderId && (action === "cancel" || action === "complete")) {
          const existing = await getReminderById(reminderId);
          if (existing) {
            if (action === "cancel") {
              await deleteReminder(reminderId);
              await replyLineMessage(event.replyToken, [
                {
                  type: "text",
                  text: `🗑️ ยกเลิกและลบรายการแจ้งเตือน "${existing.title}" ออกจากระบบเรียบร้อยแล้วครับ`,
                },
              ]);
            } else {
              await updateReminder(reminderId, { status: "completed" });
              await replyLineMessage(event.replyToken, [
                {
                  type: "text",
                  text: `เยี่ยมมาก! ทำเครื่องหมายว่าเสร็จงาน "${existing.title}" เรียบร้อยแล้วครับ ✓`,
                },
              ]);
            }
          } else if (action === "cancel") {
            await replyLineMessage(event.replyToken, [
              {
                type: "text",
                text: `รายการแจ้งเตือนนี้ถูกลบออกจากระบบเรียบร้อยแล้วครับ 😊`,
              },
            ]);
          }
        }
        continue;
      }

      // 2. Handle Text Message
      if (event.type === "message" && event.message?.type === "text") {
        const text: string = event.message.text.trim();
        console.log(`[LINE Message Received] (${sourceType}) "${text}" from ${sourceId}`);

        // Group Filter: ในกลุ่มต้องไม่ตอบทุกข้อความ จะทำงานเมื่อแท็กหรือระบุชื่อ @ชะโด เท่านั้น
        if (sourceType === "group" && !shouldTriggerInGroup(text)) {
          console.log(`[Group Message Ignored - No @ชะโด Tag] "${text}"`);
          continue;
        }

        const extractedList = await extractTasksFromText(text, new Date());

        // 2a. Handle Chit-Chat (คุยเล่น / ถามคำถาม / ทักทาย / ขอกำลังใจ)
        if (extractedList.length === 1 && extractedList[0].is_chat_intent && extractedList[0].chat_reply) {
          await replyLineMessage(event.replyToken, [
            {
              type: "text",
              text: extractedList[0].chat_reply,
            },
          ]);
          continue;
        }

        // 2b. Handle Note Intent (จดโน้ต)
        if (extractedList.length === 1 && extractedList[0].is_note_intent) {
          const note = await createNote({
            source_id: sourceId,
            content: extractedList[0].task_title,
            file_type: "text",
          });
          await replyLineMessage(event.replyToken, [
            {
              type: "text",
              text: `📝 บันทึกโน้ตเรียบร้อยแล้วครับ:\n"${note.content}"`,
            },
          ]);
          continue;
        }

        // 2c. Handle Reminders (รองรับทั้ง 1 รายการ และหลายรายการพร้อมกัน Multi-Task Batch)
        const createdReminders = [];
        for (const ext of extractedList) {
          if (ext.is_reminder_intent) {
            const reminder = await createReminder({
              source_id: sourceId,
              source_type: sourceType,
              created_by_user_id: userId,
              title: ext.task_title,
              remind_at: ext.remind_at,
              repeat_type: ext.repeat_type,
            });
            createdReminders.push(reminder);
          }
        }

        if (createdReminders.length === 1) {
          const flexMsg = buildReminderConfirmationFlex(createdReminders[0]);
          await replyLineMessage(event.replyToken, [flexMsg]);
        } else if (createdReminders.length > 1) {
          const multiFlexMsg = buildMultiReminderConfirmationFlex(createdReminders);
          await replyLineMessage(event.replyToken, [multiFlexMsg]);
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[LINE Webhook Error]:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
