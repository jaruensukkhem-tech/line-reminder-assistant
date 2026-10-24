import { ReminderRecord, RepeatType } from "@/types";

export const REPEAT_LABELS_TH: Record<RepeatType, string> = {
  once: "เตือนครั้งเดียว",
  daily: "เตือนซ้ำทุกวัน",
  weekly: "เตือนซ้ำทุกสัปดาห์",
  monthly: "เตือนซ้ำทุกเดือน",
};

export function formatThaiTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok",
  }) + " น.";
}

export function formatThaiDateFull(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  });
}

export function getLiffUrl(params?: Record<string, string>): string {
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (liffId && liffId !== "your_line_liff_id" && liffId.trim() !== "") {
    const base = `https://liff.line.me/${liffId}`;
    if (!params || Object.keys(params).length === 0) return base;
    return `${base}?${new URLSearchParams(params).toString()}`;
  }

  // หากไม่มี LIFF ID หรือค่าเป็น localhost ให้ใช้โดเมน Cloud Production (Vercel) เสมอ
  let appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!appUrl || appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    appUrl = "https://line-reminder-assistant.vercel.app";
  }

  if (!params || Object.keys(params).length === 0) return appUrl;
  const search = new URLSearchParams(params).toString();
  return `${appUrl}?${search}`;
}

/**
 * สร้าง LINE Flex Message ยืนยันการตั้งเตือน (Confirmation Card)
 * ใช้โทนสี Warm Off-White (#F9F9F6), Muted Sage Green (#4E8752), Soft Warm Orange (#E27D50)
 */
export function buildReminderConfirmationFlex(reminder: ReminderRecord) {
  const timeText = formatThaiTime(reminder.remind_at);
  const dateText = formatThaiDateFull(reminder.remind_at);
  const repeatText = REPEAT_LABELS_TH[reminder.repeat_type] || "เตือนครั้งเดียว";
  const editUrl = getLiffUrl({
    edit: reminder.id,
    sourceId: reminder.source_id,
  });

  return {
    type: "flex" as const,
    altText: `ตั้งเตือนเรียบร้อย: ${reminder.title} (${timeText})`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "horizontal",
        backgroundColor: "#4E8752",
        paddingAll: "16px",
        contents: [
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFFFFF26",
            cornerRadius: "12px",
            width: "36px",
            height: "36px",
            justifyContent: "center",
            contents: [
              {
                type: "text",
                text: "⏰",
                size: "md",
                align: "center",
              },
            ],
          },
          {
            type: "box",
            layout: "vertical",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "บันทึกการแจ้งเตือนแล้ว",
                color: "#FFFFFF",
                weight: "bold",
                size: "md",
              },
              {
                type: "text",
                text:
                  reminder.source_id.startsWith("C")
                    ? "แจ้งเตือนสมาชิกทุกคนในกลุ่ม"
                    : "ผู้ช่วยเตือนความจำส่วนตัว",
                color: "#E3F0E4",
                size: "xs",
              },
            ],
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#F9F9F6",
        paddingAll: "16px",
        spacing: "sm",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: timeText,
                size: "xl",
                weight: "bold",
                color: "#2B2D42",
                flex: 0,
              },
              {
                type: "box",
                layout: "vertical",
                backgroundColor: "#EEF5EE",
                cornerRadius: "20px",
                paddingStart: "10px",
                paddingEnd: "10px",
                paddingTop: "3px",
                paddingBottom: "3px",
                margin: "md",
                flex: 0,
                contents: [
                  {
                    type: "text",
                    text: repeatText,
                    size: "xs",
                    color: "#4E8752",
                    weight: "bold",
                  },
                ],
              },
            ],
          },
          {
            type: "text",
            text: dateText,
            size: "xs",
            color: "#8D99AE",
          },
          {
            type: "separator",
            color: "#EAEAEA",
            margin: "sm",
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#FFFFFF",
            cornerRadius: "14px",
            paddingAll: "12px",
            margin: "sm",
            borderColor: "#EAEAEA",
            borderWidth: "1px",
            contents: [
              {
                type: "text",
                text: "เรื่องที่ต้องทำ",
                size: "xxs",
                color: "#8D99AE",
              },
              {
                type: "text",
                text: reminder.title,
                size: "sm",
                weight: "bold",
                color: "#2B2D42",
                wrap: true,
                margin: "xs",
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        backgroundColor: "#F9F9F6",
        paddingAll: "16px",
        paddingTop: "0px",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#E27D50",
            height: "sm",
            action: {
              type: "uri",
              label: "เปลี่ยนเวลา",
              uri: editUrl,
            },
          },
          {
            type: "button",
            style: "secondary",
            color: "#EAEAEA",
            height: "sm",
            action: {
              type: "postback",
              label: "ยกเลิก",
              data: `action=cancel&reminderId=${reminder.id}`,
              displayText: `ยกเลิกรายการเตือน: ${reminder.title}`,
            },
          },
        ],
      },
    },
  };
}

/**
 * สร้าง LINE Flex Message เมื่อถึงกำหนดเวลาแจ้งเตือน (Push Notification Alert)
 */
export function buildDueNotificationFlex(reminder: ReminderRecord) {
  const timeText = formatThaiTime(reminder.remind_at);
  const repeatText = REPEAT_LABELS_TH[reminder.repeat_type];
  const dashboardUrl = getLiffUrl({ sourceId: reminder.source_id });

  return {
    type: "flex" as const,
    altText: `🔔 ถึงเวลาแล้ว: ${reminder.title} (${timeText})`,
    contents: {
      type: "bubble",
      size: "mega",
      header: {
        type: "box",
        layout: "horizontal",
        backgroundColor: "#E27D50",
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "🔔 ถึงเวลานัดหมายแล้ว!",
            color: "#FFFFFF",
            weight: "bold",
            size: "md",
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#F9F9F6",
        paddingAll: "16px",
        spacing: "xs",
        contents: [
          {
            type: "text",
            text: timeText,
            size: "xl",
            weight: "bold",
            color: "#2B2D42",
          },
          {
            type: "text",
            text: reminder.title,
            size: "sm",
            weight: "bold",
            color: "#2B2D42",
            wrap: true,
            margin: "xs",
          },
          {
            type: "text",
            text: `รูปแบบ: ${repeatText}`,
            size: "xxs",
            color: "#8D99AE",
            margin: "xs",
          },
        ],
      },
      footer: {
        type: "box",
        layout: "horizontal",
        backgroundColor: "#F9F9F6",
        paddingAll: "16px",
        paddingTop: "0px",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#4E8752",
            height: "sm",
            action: {
              type: "postback",
              label: "ทำเสร็จแล้ว ✓",
              data: `action=complete&reminderId=${reminder.id}`,
              displayText: `ทำเสร็จแล้ว: ${reminder.title}`,
            },
          },
          {
            type: "button",
            style: "secondary",
            color: "#EAEAEA",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูปฏิทิน LIFF",
              uri: dashboardUrl,
            },
          },
        ],
      },
    },
  };
}
