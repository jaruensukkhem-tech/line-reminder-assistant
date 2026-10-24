import { ExtractedTaskResult, RepeatType } from "@/types";

const BOT_NAMES = ["ชะโด", "chado", "@ชะโด", "@chado"];

/**
 * ตรวจสอบว่าข้อความใน LINE Group มีการแท็กหรือเอ่ยชื่อบอท "ชะโด" หรือไม่
 * ในกลุ่มจะไม่ตอบข้อความทั่วไป เพื่อป้องกันการทำงานผิดพลาด
 * จะทำงานเฉพาะเมื่อมีการแท็กหรือระบุชื่อ "@ชะโด" หรือ "ชะโด" เท่านั้น
 */
export function shouldTriggerInGroup(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  for (const botName of BOT_NAMES) {
    if (lower.includes(botName.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * ทำความสะอาดคำขึ้นต้น เช่น "@ชะโด ตั้งเตือน..." ให้เหลือเฉพาะเนื้อหาคำสั่ง
 */
export function stripTriggerPrefix(text: string): string {
  let cleaned = text.trim();
  for (const name of BOT_NAMES) {
    const regex = new RegExp(`^@?${name}\\s*[:,]?\\s*`, "i");
    cleaned = cleaned.replace(regex, "");
  }
  cleaned = cleaned.replace(/^(ช่วย)?(ตั้งเตือนว่า|ตั้งเตือน|เตือนว่า|เตือนให้|เตือน)\s*/i, "");
  return cleaned.trim();
}

const THAI_MONTH_MAP: Record<string, number> = {
  มกราคม: 0, "ม.ค.": 0, "ม.ค": 0, มค: 0,
  กุมภาพันธ์: 1, "ก.พ.": 1, "ก.พ": 1, กพ: 1,
  มีนาคม: 2, "มี.ค.": 2, "มี.ค": 2, มีค: 2,
  เมษายน: 3, "เม.ย.": 3, "เม.ย": 3, เมย: 3,
  พฤษภาคม: 4, "พ.ค.": 4, "พ.ค": 4, พค: 4,
  มิถุนายน: 5, "มิ.ย.": 5, "มิ.ย": 5, มิย: 5,
  กรกฎาคม: 6, "ก.ค.": 6, "ก.ค": 6, กค: 6,
  สิงหาคม: 7, "ส.ค.": 7, "ส.ค": 7, สค: 7,
  กันยายน: 8, "ก.ย.": 8, "ก.ย": 8, กย: 8,
  ตุลาคม: 9, "ต.ค.": 9, "ต.ค": 9, ตค: 9,
  พฤศจิกายน: 10, "พ.ย.": 10, "พ.ย": 10, พย: 10,
  ธันวาคม: 11, "ธ.ค.": 11, "ธ.ค": 11, ธค: 11,
};

const THAI_WEEKDAYS: Record<string, number> = {
  อาทิตย์: 0,
  จันทร์: 1,
  อังคาร: 2,
  พุธ: 3,
  พฤหัสบดี: 4,
  พฤหัส: 4,
  ศุกร์: 5,
  เสาร์: 6,
};

const THAI_NUMBERS: Record<string, number> = {
  หนึ่ง: 1,
  นึง: 1,
  สอง: 2,
  สาม: 3,
  สี่: 4,
  ห้า: 5,
  หก: 6,
  เจ็ด: 7,
  แปด: 8,
  เก้า: 9,
  สิบ: 10,
  สิบเอ็ด: 11,
  สิบสอง: 12,
};

function parseThaiNumberWord(word: string): number | null {
  const trimmed = word.trim();
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  return THAI_NUMBERS[trimmed] ?? null;
}

/**
 * สร้างคำตอบคุยเล่นแบบน่ารัก สุภาพ เป็นกันเอง อารมณ์ดี และให้กำลังใจเก่ง (Personality แบบ ก)
 */
export function generateChadoChatReply(text: string): string {
  const lower = text.trim().toLowerCase();

  // หมวดให้กำลังใจ / บ่นเหนื่อย / ท้อ / เครียด
  if (/เหนื่อย|ท้อ|เครียด|หมดไฟ|เศร้า|เหงา|ขอกำลังใจ|สู้ไม่ไหว|แย่จัง/.test(lower)) {
    return "ชะโดขอส่งกำลังใจก้อนโตๆ ให้เลยครับ! 🐟💖✨ วันนี้คุณเก่งและอดทนมากๆ แล้วนะครับ ถ้าเหนื่อยก็พักดื่มน้ำเย็นๆ ฟังเพลงโปรด หรือหาของอร่อยทานก่อนนะครับ ชะโดคอยอยู่ข้างๆ และเอาใจช่วยเสมอเลยครับ สู้ๆ นะครับ! ✌️😊";
  }

  // หมวดหิว / ของกิน / กินอะไรดี
  if (/กินอะไร|หิว|ของกิน|ร้านอาหาร|มื้อเที่ยง|มื้อเย็น|ชาบู|หมูกระทะ/.test(lower)) {
    const foods = [
      "ชาบูหรือหมูกระทะร้อนๆ ซักมื้อไหมครับ เยียวยาจิตใจได้ดีสุดๆ เลย! 🍲",
      "ข้าวกะเพราหมูกรอบไข่ดาวไม่สุก ราดพริกน้ำปลาหอมๆ ครับ ฟินแน่นอน! 🍳😋",
      "ส้มตำแซ่บๆ ไก่ย่างหนังกรอบ ข้าวเหนียวร้อนๆ ดีไหมครับ เติมความสดชื่น! 🍗",
      "ก๋วยเตี๋ยวต้มยำน้ำข้นมะนาวสด อร่อยคล่องคอ สดชื่นแน่นอนครับ! 🍜",
    ];
    const picked = foods[Math.floor(Math.random() * foods.length)];
    return `ชะโดขอแนะนำเมนูนี้เลยครับ: ${picked}\nทานให้อร่อยและอิ่มท้อง มีความสุขกับมื้ออาหารนะครับ! 😋🐟`;
  }

  // หมวดทักทาย
  if (/^(สวัสดี|หวัดดี|ดีครับ|ดีค่ะ|hello|hi|เฮลโล|ทักทาย|ฮัลโหล)/i.test(lower)) {
    return "สวัสดีครับ! ชะโดยินดีมากๆ ที่ได้คุยด้วยครับ 🐟🌿 วันนี้เป็นอย่างไรบ้างครับ? มีอะไรให้ชะโดช่วยเตือนความจำ จดโน้ต หรืออยากชวนคุยเล่น บอกได้เลยนะครับ ชะโดพร้อมเสมอครับ! 😊✨";
  }

  // หมวดถามเกี่ยวกับตัวชะโด / ทำอะไรได้บ้าง
  if (/ทำอะไรได้|เป็นใคร|ชื่ออะไร|ช่วยอะไร|ทำไรอยู่|คืออะไร|แนะนำตัว/.test(lower)) {
    return "ผมคือ \"ชะโด AI\" ผู้ช่วยเตือนความจำประจำกลุ่มและเพื่อนคุยเล่นครับ 🐟✨\n\n📌 สิ่งที่ชะโดทำได้:\n1. ⏰ ตั้งเตือนนัดหมาย: เช่น '@ชะโด เตือนพรุ่งนี้ 10.00 ประชุมทีม'\n2. 📝 จดโน้ตบันทึก: เช่น '@ชะโด จดโน้ต รหัสห้อง 9981'\n3. 💬 ชวนคุยเล่น ปรึกษา หรือขอกำลังใจได้ตลอด 24 ชม. เลยครับ!\nยินดีที่ได้รับใช้นะครับ 😊";
  }

  // หมวดชมเชย / ขอบคุณ / น่ารัก / บอกรัก
  if (/ขอบคุณ|แต๊งกิ้ว|น่ารัก|เก่ง|รักชะโด|ชอบชะโด|สุดยอด/.test(lower)) {
    return "ขอบคุณมากๆ เลยครับ! ได้ยินคำนี้แล้วชะโดใจฟูเลยครับ 🥰💖 ชะโดจะตั้งใจคอยช่วยเตือนความจำและอยู่เคียงข้างทุกคนให้ดีที่สุดเลยครับ ยินดีเสมอเลยครับผม! 🐟✨";
  }

  // หมวดมุกตลก
  if (/มุก|ตลก|ฮา|เล่าเรื่อง/.test(lower)) {
    return "ชะโดมีมุกมาฝากครับ! 😄\nถาม: รู้ไหมครับ ทำไมปลาชะโดถึงว่ายน้ำเก่ง?\nตอบ: เพราะถ้าวิ่ง เดี๋ยวสะดุดครีบตัวเองครับ! แฮร่~ 🐟😆\nหวังว่าจะช่วยเรียกรอยยิ้มในวันนี้ได้นะครับ!";
  }

  // คำตอบทั่วไปแบบอบอุ่น เป็นมิตร
  return "ชะโดรับฟังอยู่นะครับ! 🐟✨ ยินดีที่ได้คุยด้วยเสมอนะครับ มีเรื่องอะไรอยากเล่า ระบาย หรือมีนัดหมายสำคัญที่กลัวลืม สามารถบอกชะโดได้ทุกเมื่อเลยนะครับ ชะโดพร้อมช่วยเสมอครับ 😊💖";
}

/**
 * ตรวจสอบว่าข้อความมีเจตนาตั้งเตือนหรือมีเรื่องวันเวลาหรือไม่
 */
function hasReminderOrTimeIntent(text: string): boolean {
  // หากมีคำสั่งเตือนชัดเจน
  if (/เตือน|ตั้งเตือน|ช่วยเตือน|นัด|รับรถ|ประชุม|ส่งงาน|ทำฟัน|กินยา/.test(text)) {
    return true;
  }
  // หากมีวลีเกี่ยวกับวันหรือเวลา
  if (/พรุ่งนี้|มะรืน|วันนี้|วันจันทร์|วันอังคาร|วันพุธ|วันพฤหัส|วันศุกร์|วันเสาร์|วันอาทิตย์/.test(text)) {
    return true;
  }
  if (/\d{1,2}[:.]\d{2}/.test(text)) {
    return true;
  }
  if (/(?:โมง|ทุ่ม|นาที|ชั่วโมง|ช่วงเวลา|ตอนเช้า|ตอนบ่าย|ตอนเย็น)/.test(text)) {
    return true;
  }
  if (/\d{1,2}[\/\.-]\d{1,2}/.test(text)) {
    return true;
  }
  return false;
}

/**
 * ระบบวิเคราะห์ภาษาไทยแบบ Rule-based NLP พร้อมระบบคุยเล่นอัจฉริยะ (Personality แบบ ก)
 */
export function parseThaiReminderRuleBased(
  rawText: string,
  referenceDate = new Date()
): ExtractedTaskResult {
  const trimmed = rawText.trim();
  const stripped = stripTriggerPrefix(trimmed);

  // 1. ตรวจสอบว่าเป็นการสั่งจดโน้ตหรือไม่
  if (/^(จดโน้ต|บันทึกโน้ต|จดว่า|โน้ต)\s+/i.test(trimmed) || /^(จดโน้ต|บันทึกโน้ต|จดว่า|โน้ต)\s+/i.test(stripped)) {
    const noteBody = stripped.replace(/^(จดโน้ต|บันทึกโน้ต|จดว่า|โน้ต)\s+/i, "").trim();
    return {
      is_reminder_intent: false,
      is_note_intent: true,
      task_title: noteBody || stripped,
      remind_at: referenceDate.toISOString(),
      repeat_type: "once",
      confidence: 0.92,
      engine: "thai-nlp-rule",
    };
  }

  // 2. หากไม่มีเจตนาตั้งเตือนหรือไม่มีเรื่องเวลา -> เป็นการ "คุยเล่น" (Chit-Chat Intent)
  if (!hasReminderOrTimeIntent(stripped)) {
    const reply = generateChadoChatReply(stripped || trimmed);
    return {
      is_reminder_intent: false,
      is_chat_intent: true,
      chat_reply: reply,
      task_title: stripped,
      remind_at: referenceDate.toISOString(),
      repeat_type: "once",
      confidence: 0.98,
      engine: "thai-nlp-rule",
    };
  }

  let working = stripped;
  const targetDate = new Date(referenceDate);
  let repeatType: RepeatType = "once";
  const matchedPhrases: string[] = [];

  // Repeat Type Detection
  if (/ทุกวัน|รายวัน|ประจำวัน/.test(working)) {
    repeatType = "daily";
    matchedPhrases.push("ทุกวัน");
    working = working.replace(/ทุกวัน|รายวัน|ประจำวัน/g, " ");
  } else if (/ทุกสัปดาห์|ทุกอาทิตย์|รายสัปดาห์|ทุกวัน(จันทร์|อังคาร|พุธ|พฤหัสบดี|พฤหัส|ศุกร์|เสาร์|อาทิตย์)/.test(working)) {
    repeatType = "weekly";
    matchedPhrases.push("รายสัปดาห์");
    working = working.replace(/ทุกสัปดาห์|ทุกอาทิตย์|รายสัปดาห์/g, " ");
  } else if (/ทุกเดือน|รายเดือน|ทุกสิ้นเดือน|ทุกต้นเดือน/.test(working)) {
    repeatType = "monthly";
    matchedPhrases.push("รายเดือน");
    working = working.replace(/ทุกเดือน|รายเดือน/g, " ");
  }

  // Relative Time
  const relMinMatch = working.match(/อีก\s*(\d+)\s*นาที/);
  const relHourMatch = working.match(/อีก\s*(\d+)\s*ชั่วโมง/);
  let timeExplicitlySet = false;

  if (relMinMatch) {
    const mins = parseInt(relMinMatch[1], 10);
    targetDate.setMinutes(targetDate.getMinutes() + mins, 0, 0);
    timeExplicitlySet = true;
    matchedPhrases.push(relMinMatch[0]);
    working = working.replace(relMinMatch[0], " ");
  } else if (relHourMatch) {
    const hrs = parseInt(relHourMatch[1], 10);
    targetDate.setHours(targetDate.getHours() + hrs, targetDate.getMinutes(), 0, 0);
    timeExplicitlySet = true;
    matchedPhrases.push(relHourMatch[0]);
    working = working.replace(relHourMatch[0], " ");
  }

  // Date Phrase Detection
  let dateExplicitlySet = false;
  const textMonthMatch = working.match(
    /(?:วันที่\s*)?(\d{1,2})\s*(มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)(?:\s*(?:พ\.?ศ\.?|ค\.?ศ\.?)?\s*(\d{2,4}))?/i
  );
  if (textMonthMatch) {
    const day = parseInt(textMonthMatch[1], 10);
    const month = THAI_MONTH_MAP[textMonthMatch[2]] ?? 1;
    let year = textMonthMatch[3] ? parseInt(textMonthMatch[3], 10) : targetDate.getFullYear() + 543;
    if (year >= 2500) {
      year -= 543;
    } else if (year < 100) {
      year = year >= 50 ? (2500 + year) - 543 : year + 2000;
    }
    targetDate.setFullYear(year, month, day);
    dateExplicitlySet = true;
    matchedPhrases.push(textMonthMatch[0]);
    working = working.replace(textMonthMatch[0], " ");
  }

  const slashDateMatch = !dateExplicitlySet ? working.match(/(?:วันที่\s*)?(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/) : null;
  if (slashDateMatch) {
    let day = parseInt(slashDateMatch[1], 10);
    let monthNum = parseInt(slashDateMatch[2], 10);
    let year = parseInt(slashDateMatch[3], 10);

    if (monthNum > 12) {
      if (day <= 12) {
        const temp = day;
        day = monthNum;
        monthNum = temp;
      } else if (monthNum === 20 || String(monthNum).startsWith("2")) {
        monthNum = 2;
      } else {
        monthNum = Math.min(Math.max(monthNum % 12 || 12, 1), 12);
      }
    }

    if (day > 31) day = 31;
    const month = monthNum - 1;

    if (year >= 2500) {
      year -= 543;
    } else if (year < 100) {
      if (year >= 50) {
        year = (2500 + year) - 543;
      } else {
        year += 2000;
      }
    }
    targetDate.setFullYear(year, month, day);
    dateExplicitlySet = true;
    matchedPhrases.push(slashDateMatch[0]);
    working = working.replace(slashDateMatch[0], " ");
  } else if (/มะรืน(นี้)?/.test(working)) {
    targetDate.setDate(targetDate.getDate() + 2);
    dateExplicitlySet = true;
    matchedPhrases.push("มะรืนนี้");
    working = working.replace(/มะรืน(นี้)?/g, " ");
  } else if (/พรุ่งนี้/.test(working)) {
    targetDate.setDate(targetDate.getDate() + 1);
    dateExplicitlySet = true;
    matchedPhrases.push("พรุ่งนี้");
    working = working.replace(/พรุ่งนี้/g, " ");
  } else if (/วันนี้/.test(working)) {
    dateExplicitlySet = true;
    matchedPhrases.push("วันนี้");
    working = working.replace(/วันนี้/g, " ");
  } else {
    const weekdayMatch = working.match(
      /(ทุก)?วัน(อาทิตย์|จันทร์|อังคาร|พุธ|พฤหัสบดี|พฤหัส|ศุกร์|เสาร์)(หน้า|นี้)?/
    );
    if (weekdayMatch) {
      const dayName = weekdayMatch[2];
      const modifier = weekdayMatch[3];
      const targetDay = THAI_WEEKDAYS[dayName];
      if (targetDay !== undefined) {
        const currentDay = targetDate.getDay();
        let diff = (targetDay - currentDay + 7) % 7;
        if (diff === 0 || modifier === "หน้า") {
          diff += 7;
        }
        targetDate.setDate(targetDate.getDate() + diff);
        dateExplicitlySet = true;
        matchedPhrases.push(weekdayMatch[0]);
        working = working.replace(weekdayMatch[0], " ");
      }
    }
  }

  // Time Detection
  if (!timeExplicitlySet) {
    let hours = 9;
    let minutes = 0;

    const digitalMatch = working.match(/(?:เวลา\s*|ตอน\s*|ช่วง\s*)?(\d{1,2})[:.](\d{2})(?:\s*น\.?)?/);
    if (digitalMatch) {
      hours = parseInt(digitalMatch[1], 10);
      minutes = parseInt(digitalMatch[2], 10);
      if (/บ่าย|เย็น/.test(working) && hours >= 1 && hours <= 6) {
        hours += 12;
      }
      timeExplicitlySet = true;
      matchedPhrases.push(digitalMatch[0]);
      working = working.replace(digitalMatch[0], " ");
      working = working.replace(/เวลา|ตอน|ช่วง|บ่าย|เย็น|เช้า/g, " ");
    } else if (/เที่ยงคืนครึ่ง/.test(working)) {
      hours = 0;
      minutes = 30;
      timeExplicitlySet = true;
      working = working.replace(/เที่ยงคืนครึ่ง/g, " ");
    } else if (/เที่ยงคืน/.test(working)) {
      hours = 0;
      minutes = 0;
      timeExplicitlySet = true;
      working = working.replace(/เที่ยงคืน/g, " ");
    } else if (/เที่ยงครึ่ง/.test(working)) {
      hours = 12;
      minutes = 30;
      timeExplicitlySet = true;
      working = working.replace(/เที่ยงครึ่ง/g, " ");
    } else if (/ตอนเที่ยง|เที่ยงตรง|เที่ยง/.test(working)) {
      hours = 12;
      minutes = 0;
      timeExplicitlySet = true;
      working = working.replace(/ตอนเที่ยง|เที่ยงตรง|เที่ยง/g, " ");
    } else {
      const afternoonMatch = working.match(
        /บ่าย\s*(โมง|\d+|หนึ่ง|สอง|สาม|สี่|ห้า)?\s*(?:โมง)?\s*(ครึ่ง|\d+\s*นาที)?/
      );
      const eveningMatch = working.match(
        /(\d+|หนึ่ง|สอง|สาม|สี่|ห้า|หก)\s*โมงเย็น\s*(ครึ่ง)?/
      );
      const nightMatch = working.match(
        /(\d+|หนึ่ง|สอง|สาม|สี่|ห้า)?\s*ทุ่ม\s*(ครึ่ง)?/
      );
      const morningMatch = working.match(
        /(\d+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|สิบเอ็ด)\s*โมง(เช้า)?\s*(ครึ่ง)?/
      );
      const dawnMatch = working.match(
        /ตี\s*(\d+|หนึ่ง|สอง|สาม|สี่|ห้า)\s*(ครึ่ง)?/
      );

      if (afternoonMatch && afternoonMatch[0].trim() !== "บ่าย") {
        const numRaw = afternoonMatch[1];
        const num = !numRaw || numRaw === "โมง" ? 1 : parseThaiNumberWord(numRaw) || 1;
        hours = 12 + num;
        minutes = afternoonMatch[2]?.includes("ครึ่ง") ? 30 : 0;
        timeExplicitlySet = true;
        matchedPhrases.push(afternoonMatch[0]);
        working = working.replace(afternoonMatch[0], " ");
      } else if (eveningMatch) {
        const num = parseThaiNumberWord(eveningMatch[1]) || 5;
        hours = 12 + num;
        minutes = eveningMatch[2] ? 30 : 0;
        timeExplicitlySet = true;
        matchedPhrases.push(eveningMatch[0]);
        working = working.replace(eveningMatch[0], " ");
      } else if (nightMatch && nightMatch[0].trim().includes("ทุ่ม")) {
        const num = nightMatch[1] ? parseThaiNumberWord(nightMatch[1]) || 1 : 1;
        hours = 18 + num;
        minutes = nightMatch[2] ? 30 : 0;
        timeExplicitlySet = true;
        matchedPhrases.push(nightMatch[0]);
        working = working.replace(nightMatch[0], " ");
      } else if (dawnMatch) {
        const num = parseThaiNumberWord(dawnMatch[1]) || 5;
        hours = num;
        minutes = dawnMatch[2] ? 30 : 0;
        timeExplicitlySet = true;
        matchedPhrases.push(dawnMatch[0]);
        working = working.replace(dawnMatch[0], " ");
      } else if (morningMatch) {
        const num = parseThaiNumberWord(morningMatch[1]) || 9;
        hours = num;
        minutes = morningMatch[3] ? 30 : 0;
        timeExplicitlySet = true;
        matchedPhrases.push(morningMatch[0]);
        working = working.replace(morningMatch[0], " ");
      }
    }

    if (timeExplicitlySet) {
      targetDate.setHours(hours, minutes, 0, 0);
      if (!dateExplicitlySet && targetDate.getTime() <= referenceDate.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
    } else {
      if (dateExplicitlySet) {
        targetDate.setHours(9, 0, 0, 0);
      } else {
        targetDate.setHours(targetDate.getHours() + 1, 0, 0, 0);
      }
    }
  }

  const cleanTitle = working
    .replace(/(ช่วงเวลา|เวลา|ตอน|ช่วง|เรื่อง|ให้หน่อย|ด้วยนะ|ครับ|ค่ะ|นะ|หน่อย)/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return {
    is_reminder_intent: true,
    task_title: cleanTitle || stripped || "รายการแจ้งเตือนใหม่",
    remind_at: targetDate.toISOString(),
    repeat_type: repeatType,
    confidence: timeExplicitlySet || dateExplicitlySet ? 0.95 : 0.78,
    engine: "thai-nlp-rule",
    raw_time_phrase: matchedPhrases.join(" ") || "อัตโนมัติ",
  };
}

/**
 * สกัดข้อมูลนัดหมายด้วย Google Gemini API หรือสร้างคำตอบคุยเล่น
 */
export async function extractTaskWithAI(
  rawText: string,
  referenceDate = new Date()
): Promise<ExtractedTaskResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey || apiKey === "your_gemini_api_key") {
    return parseThaiReminderRuleBased(rawText, referenceDate);
  }

  try {
    const prompt = `คุณคือ AI ผู้ช่วยชื่อ "ชะโด" (Chado AI)
บุคลิกนิสัยของคุณ:
- สุภาพ น่ารัก อารมณ์ดี เป็นกันเอง พูดจาไพเราะ ลงท้าย ครับ/ค่ะ
- ให้กำลังใจเก่ง มีอิโมจิน่ารักประกอบ (เช่น 🐟✨, 💖, 😊)
- ช่วยจัดการเตือนความจำ และเป็นเพื่อนคุยเล่นที่ดีเสมอ

เวลาปัจจุบัน (Asia/Bangkok +07:00): ${referenceDate.toISOString()} (${referenceDate.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })})
ข้อความผู้ใช้: "${rawText}"

กฎการวิเคราะห์:
1. หากผู้ใช้ "คุยเล่น, ถามคำถาม, ขอคำแนะนำ, ชวนคุย, บ่นเหนื่อย, ทักทาย, ขอมุกตลก":
   - ให้ "is_chat_intent": true, "is_reminder_intent": false
   - สร้างข้อความตอบกลับที่อบอุ่น สุภาพ น่ารัก ให้กำลังใจ ในฟิลด์ "chat_reply"
2. หากผู้ใช้ต้องการ "ตั้งเตือน, นัดหมาย, มีกำหนดเวลา, มีวันที่":
   - ให้ "is_reminder_intent": true, "is_chat_intent": false
   - แปลงเวลาไทย เช่น "พรุ่งนี้บ่ายสอง", "25/02/2569 10:00", "17.45" เป็น ISO 8601
   - repeat_type: "once" | "daily" | "weekly" | "monthly"

ตอบกลับเป็น JSON เท่านั้น:
{
  "is_reminder_intent": boolean,
  "is_chat_intent": boolean,
  "chat_reply": "ข้อความตอบคุยเล่น (ถ้ามี)",
  "task_title": "ชื่อเรื่องที่ต้องทำ",
  "remind_at": "ISO 8601 string",
  "repeat_type": "once" | "daily" | "weekly" | "monthly"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API status ${response.status}`);
    }

    const data = await response.json();
    const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonText) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(jsonText);
    if (parsed.is_chat_intent) {
      return {
        is_reminder_intent: false,
        is_chat_intent: true,
        chat_reply: parsed.chat_reply || generateChadoChatReply(rawText),
        task_title: rawText,
        remind_at: referenceDate.toISOString(),
        repeat_type: "once",
        confidence: 0.99,
        engine: "gemini",
      };
    }

    return {
      is_reminder_intent: true,
      is_chat_intent: false,
      task_title: parsed.task_title || stripTriggerPrefix(rawText),
      remind_at: new Date(parsed.remind_at).toISOString(),
      repeat_type: (["once", "daily", "weekly", "monthly"].includes(parsed.repeat_type)
        ? parsed.repeat_type
        : "once") as RepeatType,
      confidence: 0.99,
      engine: "gemini",
    };
  } catch (err) {
    console.warn("Gemini extraction fallback to Thai NLP rule parser:", err);
    return parseThaiReminderRuleBased(rawText, referenceDate);
  }
}
