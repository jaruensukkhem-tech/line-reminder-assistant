"use client";

import React, { useState } from "react";
import { ExtractedTaskResult, ReminderRecord, SourceType } from "@/types";
import FlexMessagePreview from "./FlexMessagePreview";
import {
  BellRing,
  Bot,
  MessageSquare,
  Send,
  Sparkles,
  Users,
  User,
  Info,
  Code2,
} from "lucide-react";

interface ChatLogItem {
  id: string;
  sender: "user" | "bot" | "system";
  text?: string;
  reminder?: ReminderRecord;
  extracted?: ExtractedTaskResult;
  variant?: "confirmation" | "push_alert";
  timestamp: string;
}

interface LineBotSimulatorProps {
  onDataChanged: () => Promise<void>;
  onOpenEditModal: (reminder: ReminderRecord) => void;
  onCancelReminder: (id: string) => Promise<void>;
  onCompleteReminder: (id: string) => Promise<void>;
}

export default function LineBotSimulator({
  onDataChanged,
  onOpenEditModal,
  onCancelReminder,
  onCompleteReminder,
}: LineBotSimulatorProps) {
  const [chatMode, setChatMode] = useState<SourceType>("user");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showExtractedJson, setShowExtractedJson] = useState(true);
  const [logs, setLogs] = useState<ChatLogItem[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: 'สวัสดีครับ! ผมคือ "ชะโด AI" ผู้ช่วยเตือนความจำของคุณ พิมพ์สั่งงานด้วยภาษาไทยธรรมชาติได้เลย เช่น "เตือนพรุ่งนี้บ่ายสอง ประชุมทีม" หรือ "เตือน 17.45 ไปวิ่งทุกวัน"',
      timestamp: new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const samplePrompts =
    chatMode === "user"
      ? [
          "เตือนพรุ่งนี้บ่ายสอง ประชุมทีมการตลาด",
          "ตั้งเตือน 17.45 ไปวิ่งสวนสาธารณะทุกวัน",
          "เตือนวันจันทร์หน้า 09.30 ส่งรายงานสรุปยอดขาย",
          "จดโน้ต รหัสเข้าห้องประชุมชั้น 4 คือ 9981#",
        ]
      : [
          "@ชะโด เตือนพรุ่งนี้ 10.00 นัดคุยลูกค้าโปรเจกต์ใหม่",
          "@ชะโด ตั้งเตือนทุกวันศุกร์ 16.00 สรุปงานประจำสัปดาห์",
          "เตือนพรุ่งนี้บ่ายสอง (ไม่มีแท็ก @ชะโด บอทจะไม่ตอบเพื่อกันมั่ว)",
          "วันนี้เที่ยงไปกินข้าวไหนดีทุกคน? (บอทจะไม่ตอบ)",
        ];

  const handleSendMessage = async (customText?: string) => {
    const messageText = (customText ?? input).trim();
    if (!messageText || sending) return;

    const nowTime = new Date().toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const userMsg: ChatLogItem = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: messageText,
      timestamp: nowTime,
    };

    setLogs((prev) => [...prev, userMsg]);
    if (!customText) setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/simulate-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: messageText,
          source_type: chatMode,
          source_id: chatMode === "group" ? "C_DEMO_GROUP_01" : "U_DEMO_USER_01",
          user_id: "U_DEMO_USER_01",
        }),
      });
      const data = await res.json();

      if (data.ignored_in_group) {
        setLogs((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            sender: "system",
            text: `🔇 [Group Silent Filter]: ${data.reason}`,
            timestamp: nowTime,
          },
        ]);
      } else if (data.type === "note") {
        setLogs((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            sender: "bot",
            text: data.bot_text,
            extracted: data.extracted,
            timestamp: nowTime,
          },
        ]);
        await onDataChanged();
      } else if (data.reminder) {
        setLogs((prev) => [
          ...prev,
          {
            id: `b-${Date.now()}`,
            sender: "bot",
            reminder: data.reminder,
            extracted: data.extracted,
            variant: "confirmation",
            timestamp: nowTime,
          },
        ]);
        await onDataChanged();
      }
    } finally {
      setSending(false);
    }
  };

  const handleTriggerCronPush = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/cron/notify", { method: "POST" });
      const data = await res.json();
      const nowTime = new Date().toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (data.dispatched && data.dispatched.length > 0) {
        for (const item of data.dispatched) {
          setLogs((prev) => [
            ...prev,
            {
              id: `push-${Date.now()}-${item.id}`,
              sender: "bot",
              reminder: {
                id: item.id,
                source_id: item.source_id,
                created_by_user_id: "U_DEMO_USER_01",
                title: item.title,
                remind_at: new Date().toISOString(),
                repeat_type: item.repeat_type,
                status: "sent",
                created_at: new Date().toISOString(),
              },
              variant: "push_alert",
              timestamp: nowTime,
            },
          ]);
        }
        await onDataChanged();
      } else {
        // หากยังไม่มีรายการที่เลยเวลา ให้จำลองแสดงตัวอย่าง Push Alert ของรายการถัดไป
        setLogs((prev) => [
          ...prev,
          {
            id: `sys-push-${Date.now()}`,
            sender: "system",
            text: "🔔 ทดสอบส่ง Push Notification ตัวอย่างเข้าแชทเรียบร้อย (เมื่อถึงเวลาจริง ระบบ Cron จะยิงแจ้งเตือนนี้อัตโนมัติ)",
            timestamp: nowTime,
          },
          {
            id: `push-demo-${Date.now()}`,
            sender: "bot",
            reminder: {
              id: "a1b2c3d4-0001-4000-8000-000000000001",
              source_id:
                chatMode === "group" ? "C_DEMO_GROUP_01" : "U_DEMO_USER_01",
              created_by_user_id: "U_DEMO_USER_01",
              title: "ประชุมทีมอัปเดตแคมเปญ Q4 ผ่าน Google Meet",
              remind_at: new Date().toISOString(),
              repeat_type: "once",
              status: "pending",
              created_at: new Date().toISOString(),
            },
            variant: "push_alert",
            timestamp: nowTime,
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-[#EAEAEA] shadow-soft overflow-hidden">
      {/* Simulator Header */}
      <div className="bg-[#4E8752] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">
              จำลองแชท LINE OA & Group (AI Task Extractor + Flex Message)
            </h3>
            <p className="text-xs text-[#E3F0E4] mt-0.5">
              ทดสอบพิมพ์ภาษาไทยธรรมชาติ ระบบจะสกัดวันเวลาและสร้างการ์ด Flex Message ทันที
            </p>
          </div>
        </div>

        {/* ปุ่มสลับโหมด 1-on-1 vs LINE Group */}
        <div className="flex items-center bg-black/15 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setChatMode("user")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              chatMode === "user"
                ? "bg-white text-[#4E8752] shadow-xs"
                : "text-white/90 hover:text-white"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            คุยส่วนตัว (1-on-1)
          </button>
          <button
            type="button"
            onClick={() => setChatMode("group")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              chatMode === "group"
                ? "bg-white text-[#4E8752] shadow-xs"
                : "text-white/90 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            ในกลุ่ม LINE Group
          </button>
        </div>
      </div>

      {/* แถบอธิบายกติกาในกลุ่ม & ปุ่มยิง Push Notification */}
      <div className="bg-[#EEF5EE] px-5 py-2.5 border-b border-[#D5E6D6] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4E8752]">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>
            {chatMode === "group" ? (
              <>
                <strong>โหมดกลุ่ม LINE:</strong> ต้องแท็กชื่อ{" "}
                <code className="bg-white px-1.5 py-0.5 rounded font-bold">@ชะโด</code> เท่านั้น (เพื่อป้องกันการตอบกลับผิดพลาดหรือรับแจ้งเตือนมั่วในกลุ่ม)
              </>
            ) : (
              <>
                <strong>โหมดคุยส่วนตัว (1-on-1):</strong> พิมพ์ประโยคนัดหมายหรือเรื่องที่ต้องทำได้เลยโดยไม่ต้องใส่คำนำหน้าก็ได้
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExtractedJson((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-white border border-[#D5E6D6] text-[#4E8752] font-semibold inline-flex items-center gap-1 hover:bg-[#F9F9F6] transition"
          >
            <Code2 className="w-3.5 h-3.5" />
            {showExtractedJson ? "ซ่อน AI JSON" : "ดู AI JSON"}
          </button>
          <button
            type="button"
            onClick={handleTriggerCronPush}
            disabled={sending}
            className="px-3 py-1 rounded-lg bg-[#E27D50] hover:bg-[#d36d40] text-white font-semibold inline-flex items-center gap-1.5 transition shadow-xs"
          >
            <BellRing className="w-3.5 h-3.5" />
            ทดสอบยิง Push แจ้งเตือน
          </button>
        </div>
      </div>

      {/* พื้นที่ห้องแชทจำลอง */}
      <div className="p-4 sm:p-5 bg-[#FAF8F5] space-y-4 max-h-[480px] overflow-y-auto">
        {logs.map((item) => {
          if (item.sender === "system") {
            return (
              <div key={item.id} className="flex justify-center">
                <div className="bg-white border border-[#EAEAEA] text-[#4A4E69] text-xs px-4 py-2 rounded-full shadow-2xs max-w-md text-center">
                  {item.text}
                </div>
              </div>
            );
          }

          if (item.sender === "user") {
            return (
              <div key={item.id} className="flex justify-end items-end gap-2">
                <span className="text-[10px] text-[#8D99AE]">{item.timestamp}</span>
                <div className="bg-[#4E8752] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-xs sm:max-w-md text-sm font-medium shadow-xs">
                  {item.text}
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[#4E8752] text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                AI
              </div>
              <div className="space-y-2 max-w-full">
                {item.text && (
                  <div className="bg-white border border-[#EAEAEA] text-[#2B2D42] px-4 py-3 rounded-2xl rounded-tl-xs max-w-md text-sm leading-relaxed shadow-soft whitespace-pre-line">
                    {item.text}
                  </div>
                )}

                {item.reminder && (
                  <FlexMessagePreview
                    reminder={item.reminder}
                    variant={item.variant || "confirmation"}
                    onEditTime={(rem) => onOpenEditModal(rem)}
                    onCancel={async (remId) => {
                      await onCancelReminder(remId);
                      setLogs((prev) =>
                        prev.map((l) =>
                          l.reminder?.id === remId
                            ? {
                                ...l,
                                reminder: { ...l.reminder, status: "cancelled" },
                              }
                            : l
                        )
                      );
                    }}
                    onComplete={async (remId) => {
                      await onCompleteReminder(remId);
                      setLogs((prev) =>
                        prev.map((l) =>
                          l.reminder?.id === remId
                            ? {
                                ...l,
                                reminder: { ...l.reminder, status: "completed" },
                              }
                            : l
                        )
                      );
                    }}
                  />
                )}

                {/* แสดงผลลัพธ์ AI Function Calling / Structured Extraction */}
                {showExtractedJson && item.extracted && (
                  <div className="bg-[#2B2D42] text-[#E3F0E4] rounded-xl p-3 text-xs font-mono max-w-[320px] overflow-x-auto">
                    <div className="flex items-center gap-1.5 text-[#E27D50] font-sans font-semibold mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        AI Task Extraction ({item.extracted.engine === "gemini" ? "Gemini 2.5 Flash" : "Thai NLP Parser"})
                      </span>
                    </div>
                    <pre className="text-[11px] leading-relaxed">
                      {JSON.stringify(
                        {
                          task_title: item.extracted.task_title,
                          remind_at: item.extracted.remind_at,
                          repeat_type: item.extracted.repeat_type,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#8D99AE] self-end">
                {item.timestamp}
              </span>
            </div>
          );
        })}
      </div>

      {/* ตัวอย่างประโยคกดทดลองด่วน */}
      <div className="px-4 py-3 bg-white border-t border-[#EAEAEA]">
        <p className="text-xs font-semibold text-[#8D99AE] mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#4E8752]" />
          กดเลือกประโยคภาษาไทยเพื่อทดสอบสั่งบอท:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              disabled={sending}
              className="text-xs px-3 py-1.5 rounded-full bg-[#F9F9F6] hover:bg-[#EEF5EE] text-[#4A4E69] hover:text-[#4E8752] border border-[#EAEAEA] hover:border-[#D5E6D6] transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* ช่องพิมพ์ข้อความแชท */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3.5 bg-white border-t border-[#EAEAEA] flex items-center gap-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            chatMode === "group"
              ? 'พิมพ์ในกลุ่ม เช่น "เตือนพรุ่งนี้บ่ายสอง ประชุมทีม"...'
              : 'พิมพ์บอกบอท เช่น "เตือน 17.45 ไปวิ่งทุกวัน"...'
          }
          className="flex-1 px-4 py-3 rounded-xl bg-[#F9F9F6] border border-[#EAEAEA] text-[#2B2D42] text-sm focus:outline-none focus:border-[#4E8752]"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-5 py-3 rounded-xl bg-[#4E8752] hover:bg-[#417345] text-white font-semibold text-sm inline-flex items-center gap-2 transition disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>ส่งข้อความ</span>
        </button>
      </form>
    </div>
  );
}
