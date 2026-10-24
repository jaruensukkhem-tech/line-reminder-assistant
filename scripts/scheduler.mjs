// Background auto-checker: ตรวจสอบรายการที่ถึงเวลาแจ้งเตือนทุก 15 วินาที
// แล้วยิง Push Notification เข้า LINE Group หรือ User ทันที

async function checkDueReminders() {
  try {
    const res = await fetch("http://127.0.0.1:3050/api/cron/notify", {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.dispatched_count > 0) {
        console.log(`[Auto Scheduler] Sent ${data.dispatched_count} due reminder(s) at ${new Date().toLocaleTimeString("th-TH")}`);
      }
    }
  } catch (err) {
    // Dev server might be restarting
  }
}

console.log("[Auto Scheduler] Started checking for due reminders every 15 seconds...");

// Run immediately, then loop every 15 seconds
checkDueReminders();
setInterval(checkDueReminders, 15000);
