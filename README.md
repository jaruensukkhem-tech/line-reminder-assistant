# ชะโด AI — LINE Reminder Bot & Personal Assistant (LINE OA + LIFF)

ระบบผู้ช่วยเตือนความจำผ่าน LINE Official Account (รองรับทั้งแชทส่วนตัว 1-on-1 และดึงเข้า LINE Group) พร้อมหน้าเว็บ **LINE LIFF Dashboard** สำหรับดูปฏิทิน จัดการโน้ต คลังไฟล์/รูปภาพ และจำลองแชททดสอบบอท

---

## 1. โทนสีและการออกแบบ UI/UX (Warm Minimalist & High Readability)
- **Background หลัก:** Warm Off-White / Soft Cream (`#F9F9F6` / `#FAF8F5`)
- **Primary Accent:** Muted Sage Green (`#4E8752` / `#5B8C5A`)
- **Secondary Accent (ปุ่มสำคัญ):** Soft Warm Orange / Amber (`#E27D50`)
- **Typography:** ฟอนต์ไทย `Prompt` อ่านง่าย ขนาดตัวเลขเวลาใหญ่ชัดเจน (`24px-32px Bold` สี `#2B2D42`) และเนื้อหาสี Deep Gray (`#4A4E69`)

---

## 2. โครงสร้างไฟล์สำคัญ
- [`supabase/schema.sql`](file:///Users/jaruensuk/.gemini/antigravity/scratch/line-reminder-assistant/supabase/schema.sql) & [`prisma/schema.prisma`](file:///Users/jaruensuk/.gemini/antigravity/scratch/line-reminder-assistant/prisma/schema.prisma) — โครงสร้างตาราง `sources`, `reminders`, และ `notes`
- [`src/lib/ai-extractor.ts`](file:///Users/jaruensuk/.gemini/antigravity/scratch/line-reminder-assistant/src/lib/ai-extractor.ts) — ระบบสกัดข้อมูลนัดหมายด้วย **Google Gemini API (`gemini-2.5-flash`)** พร้อมระบบ Fallback วิเคราะห์ภาษาไทยธรรมชาติ (`"พรุ่งนี้บ่ายสอง"`, `"17.45"`, `"วันจันทร์หน้า"`, `"ทุกวัน"`) และระบบกรองคำสั่งในกลุ่ม LINE
- [`src/lib/line-flex.ts`](file:///Users/jaruensuk/.gemini/antigravity/scratch/line-reminder-assistant/src/lib/line-flex.ts) — สร้างการ์ด **LINE Flex Message** ยืนยันการตั้งเตือน (มีปุ่ม `"เปลี่ยนเวลา"` เปิด LIFF และปุ่ม `"ยกเลิก"`) และ Flex Message แจ้งเตือนเมื่อถึงเวลา
- [`src/app/api/webhook/line/route.ts`](file:///Users/jaruensuk/.gemini/antigravity/scratch/line-reminder-assistant/src/app/api/webhook/line/route.ts) — LINE Messaging API Webhook รองรับทั้งแชท 1-on-1 และ Group (`source.groupId`)
- [`src/app/api/cron/notify/route.ts`](file:///Users/jaruensuk/.gemini/antigravity/scratch/line-reminder-assistant/src/app/api/cron/notify/route.ts) — Push Notification Engine สำหรับส่งแจ้งเตือนเมื่อถึงเวลาที่กำหนด
- [`src/app/page.tsx`](file:///Users/jaruensuk/.gemini/antigravity/scratch/line-reminder-assistant/src/app/page.tsx) — หน้าเว็บ LINE LIFF ครบทั้ง 4 แท็บ (`แจ้งเตือน`, `โน้ต/บันทึก`, `ไฟล์/รูป`, `ตั้งค่า/บอท`)

---

## 3. วิธีรันโปรเจกต์
```bash
cd /Users/jaruensuk/.gemini/antigravity/scratch/line-reminder-assistant
npm install
npm run dev
```
เปิดเบราว์เซอร์ที่ `http://localhost:3050`
