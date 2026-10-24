import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  NoteRecord,
  ReminderRecord,
  ReminderStatus,
  RepeatType,
  SourceRecord,
  SourceType,
} from "@/types";

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && key && url !== "your_supabase_url" && !url.includes("placeholder")) {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false },
    });
    return supabaseClient;
  }
  return null;
}

interface LocalStoreSchema {
  sources: SourceRecord[];
  reminders: ReminderRecord[];
  notes: NoteRecord[];
}

const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "data")
  : path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "local-db.json");

function createInitialSeedData(): LocalStoreSchema {
  const now = new Date();

  const todayAt = (hours: number, minutes: number) => {
    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const offsetDaysAt = (days: number, hours: number, minutes: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  return {
    sources: [
      {
        id: "U_DEMO_USER_01",
        type: "user",
        name: "คุณจเร (แชทส่วนตัว 1-on-1)",
        created_at: now.toISOString(),
      },
      {
        id: "C_DEMO_GROUP_01",
        type: "group",
        name: "กลุ่มทีมบริหาร & การตลาด (LINE Group)",
        created_at: now.toISOString(),
      },
    ],
    reminders: [
      {
        id: "a1b2c3d4-0001-4000-8000-000000000001",
        source_id: "U_DEMO_USER_01",
        created_by_user_id: "U_DEMO_USER_01",
        title: "ประชุมทีมอัปเดตแคมเปญ Q4 ผ่าน Google Meet",
        remind_at: todayAt(14, 0),
        repeat_type: "once",
        status: "pending",
        created_at: now.toISOString(),
      },
      {
        id: "a1b2c3d4-0002-4000-8000-000000000002",
        source_id: "U_DEMO_USER_01",
        created_by_user_id: "U_DEMO_USER_01",
        title: "ไปวิ่งออกกำลังกาย 5 กม. ที่สวนสาธารณะ",
        remind_at: todayAt(17, 45),
        repeat_type: "daily",
        status: "pending",
        created_at: now.toISOString(),
      },
      {
        id: "a1b2c3d4-0003-4000-8000-000000000003",
        source_id: "U_DEMO_USER_01",
        created_by_user_id: "U_DEMO_USER_01",
        title: "ทานวิตามินและดื่มน้ำอุ่นตอนเช้า",
        remind_at: todayAt(8, 30),
        repeat_type: "daily",
        status: "completed",
        created_at: now.toISOString(),
      },
      {
        id: "a1b2c3d4-0004-4000-8000-000000000004",
        source_id: "U_DEMO_USER_01",
        created_by_user_id: "U_DEMO_USER_01",
        title: "ชำระค่าบัตรเครดิตและค่าอินเทอร์เน็ต",
        remind_at: offsetDaysAt(1, 10, 30),
        repeat_type: "monthly",
        status: "pending",
        created_at: now.toISOString(),
      },
      {
        id: "a1b2c3d4-0005-4000-8000-000000000005",
        source_id: "C_DEMO_GROUP_01",
        created_by_user_id: "U_DEMO_USER_01",
        title: "ส่งสไลด์สรุปยอดขายประจำสัปดาห์เข้ากลุ่ม",
        remind_at: todayAt(16, 0),
        repeat_type: "weekly",
        status: "pending",
        created_at: now.toISOString(),
      },
      {
        id: "a1b2c3d4-0006-4000-8000-000000000006",
        source_id: "C_DEMO_GROUP_01",
        created_by_user_id: "U_DEMO_USER_01",
        title: "Daily Standup Meeting ทีมโปรเจกต์ใหม่",
        remind_at: offsetDaysAt(1, 9, 30),
        repeat_type: "daily",
        status: "pending",
        created_at: now.toISOString(),
      },
    ],
    notes: [
      {
        id: "n1b2c3d4-0001-4000-8000-000000000001",
        source_id: "U_DEMO_USER_01",
        content:
          "สรุปไอเดียฟีเจอร์ LINE OA: เน้นโทนสีเขียวใบเสจ (#4E8752) และพื้นหลังครีมอุ่น (#F9F9F6) ตัวหนังสือใหญ่ชัดเจนสำหรับผู้ใช้งานทุกวัย",
        file_url: null,
        file_type: "text",
        created_at: now.toISOString(),
      },
      {
        id: "n1b2c3d4-0002-4000-8000-000000000002",
        source_id: "U_DEMO_USER_01",
        content: "รหัสเข้าห้องประชุม Zoom ฝ่ายการตลาด: 892-441-0922 (Passcode: 2026)",
        file_url: null,
        file_type: "text",
        created_at: now.toISOString(),
      },
      {
        id: "n1b2c3d4-0003-4000-8000-000000000003",
        source_id: "U_DEMO_USER_01",
        content: "เอกสารบรีฟแคมเปญ Q4_Marketing_Plan.pdf",
        file_url: "https://example.com/files/Q4_Marketing_Plan.pdf",
        file_type: "file",
        created_at: now.toISOString(),
      },
      {
        id: "n1b2c3d4-0004-4000-8000-000000000004",
        source_id: "U_DEMO_USER_01",
        content: "ภาพตัวอย่าง Artwork โปรโมชั่นเดือนพฤศจิกายน",
        file_url:
          "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80",
        file_type: "image",
        created_at: now.toISOString(),
      },
      {
        id: "n1b2c3d4-0005-4000-8000-000000000005",
        source_id: "C_DEMO_GROUP_01",
        content: "ลิงก์ Google Sheet ตารางงานทีมประจำเดือน",
        file_url: "https://docs.google.com/spreadsheets",
        file_type: "file",
        created_at: now.toISOString(),
      },
    ],
  };
}

function readStore(): LocalStoreSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const seed = createInitialSeedData();
      fs.writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), "utf8");
      return seed;
    }
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw) as LocalStoreSchema;
  } catch {
    return createInitialSeedData();
  }
}

function writeStore(data: LocalStoreSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to write local store:", err);
  }
}

// ============================================================================
// Repository Functions (Supports Sources, Reminders, Notes)
// ============================================================================

export async function upsertSource(
  id: string,
  type: SourceType,
  name?: string | null
): Promise<SourceRecord> {
  const supabase = getSupabase();
  const defaultName = name || (type === "group" ? `กลุ่ม LINE (${id.slice(0, 6)})` : `ผู้ใช้ LINE (${id.slice(0, 6)})`);

  if (supabase) {
    try {
      const { data: existing } = await supabase.from("sources").select("*").eq("id", id).maybeSingle();
      if (existing) {
        if (name && name !== existing.name) {
          const { data: updated } = await supabase.from("sources").update({ name }).eq("id", id).select().single();
          if (updated) return updated as SourceRecord;
        }
        return existing as SourceRecord;
      }
      const created: SourceRecord = {
        id,
        type,
        name: defaultName,
        created_at: new Date().toISOString(),
      };
      const { data } = await supabase.from("sources").insert(created).select().single();
      return (data || created) as SourceRecord;
    } catch (err) {
      console.warn("[Supabase upsertSource fallback to local store]", err);
    }
  }

  const store = readStore();
  const existing = store.sources.find((s) => s.id === id);
  if (existing) {
    if (name && name !== existing.name) {
      existing.name = name;
      writeStore(store);
    }
    return existing;
  }
  const created: SourceRecord = {
    id,
    type,
    name: defaultName,
    created_at: new Date().toISOString(),
  };
  store.sources.push(created);
  writeStore(store);
  return created;
}

export async function listSources(): Promise<SourceRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.from("sources").select("*").order("created_at", { ascending: false });
      if (data) return data as SourceRecord[];
    } catch (err) {
      console.warn("[Supabase listSources fallback to local store]", err);
    }
  }

  const store = readStore();
  return store.sources;
}

export async function getReminders(sourceId?: string): Promise<ReminderRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      let q = supabase.from("reminders").select("*").order("remind_at", { ascending: true });
      if (sourceId) {
        q = q.eq("source_id", sourceId);
      }
      const { data } = await q;
      if (data) return data as ReminderRecord[];
    } catch (err) {
      console.warn("[Supabase getReminders fallback to local store]", err);
    }
  }

  const store = readStore();
  const filtered = sourceId
    ? store.reminders.filter((r) => r.source_id === sourceId)
    : store.reminders;
  return filtered.sort(
    (a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()
  );
}

export async function getReminderById(id: string): Promise<ReminderRecord | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase.from("reminders").select("*").eq("id", id).maybeSingle();
      if (data) return data as ReminderRecord;
    } catch (err) {
      console.warn("[Supabase getReminderById fallback to local store]", err);
    }
  }

  const store = readStore();
  return store.reminders.find((r) => r.id === id) || null;
}

export async function createReminder(input: {
  source_id: string;
  source_type?: SourceType;
  source_name?: string;
  created_by_user_id?: string | null;
  title: string;
  remind_at: string;
  repeat_type?: RepeatType;
}): Promise<ReminderRecord> {
  await upsertSource(
    input.source_id,
    input.source_type || (input.source_id.startsWith("C") ? "group" : "user"),
    input.source_name
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = {
        source_id: input.source_id,
        created_by_user_id: input.created_by_user_id || input.source_id,
        title: input.title,
        remind_at: new Date(input.remind_at).toISOString(),
        repeat_type: input.repeat_type || "once",
        status: "pending",
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("reminders").insert(payload).select().single();
      if (!error && data) {
        return data as ReminderRecord;
      }
      if (error) console.error("[Supabase createReminder error]", error);
    } catch (err) {
      console.warn("[Supabase createReminder fallback to local store]", err);
    }
  }

  const store = readStore();
  const record: ReminderRecord = {
    id: crypto.randomUUID(),
    source_id: input.source_id,
    created_by_user_id: input.created_by_user_id || input.source_id,
    title: input.title,
    remind_at: new Date(input.remind_at).toISOString(),
    repeat_type: input.repeat_type || "once",
    status: "pending",
    created_at: new Date().toISOString(),
  };

  store.reminders.push(record);
  writeStore(store);
  return record;
}

export async function updateReminder(
  id: string,
  patch: Partial<Pick<ReminderRecord, "title" | "remind_at" | "repeat_type" | "status">>
): Promise<ReminderRecord | null> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload: Record<string, unknown> = { ...patch };
      if (patch.remind_at) {
        payload.remind_at = new Date(patch.remind_at).toISOString();
      }
      const { data, error } = await supabase.from("reminders").update(payload).eq("id", id).select().maybeSingle();
      if (!error && data) {
        return data as ReminderRecord;
      }
      if (error) console.error("[Supabase updateReminder error]", error);
    } catch (err) {
      console.warn("[Supabase updateReminder fallback to local store]", err);
    }
  }

  const store = readStore();
  const idx = store.reminders.findIndex((r) => r.id === id);
  if (idx === -1) return null;

  const updated: ReminderRecord = {
    ...store.reminders[idx],
    ...patch,
    remind_at: patch.remind_at
      ? new Date(patch.remind_at).toISOString()
      : store.reminders[idx].remind_at,
  };
  store.reminders[idx] = updated;
  writeStore(store);
  return updated;
}

export async function deleteReminder(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("reminders").delete().eq("id", id);
      if (!error) return true;
      console.error("[Supabase deleteReminder error]", error);
    } catch (err) {
      console.warn("[Supabase deleteReminder fallback to local store]", err);
    }
  }

  const store = readStore();
  const initialLen = store.reminders.length;
  store.reminders = store.reminders.filter((r) => r.id !== id);
  if (store.reminders.length !== initialLen) {
    writeStore(store);
    return true;
  }
  return false;
}

export async function getDueReminders(now = new Date()): Promise<ReminderRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("status", "pending")
        .lte("remind_at", now.toISOString());
      if (!error && data) {
        return data as ReminderRecord[];
      }
      if (error) console.error("[Supabase getDueReminders error]", error);
    } catch (err) {
      console.warn("[Supabase getDueReminders fallback to local store]", err);
    }
  }

  const store = readStore();
  return store.reminders.filter(
    (r) =>
      r.status === "pending" &&
      new Date(r.remind_at).getTime() <= now.getTime()
  );
}

export async function getNotes(sourceId?: string): Promise<NoteRecord[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      let q = supabase.from("notes").select("*").order("created_at", { ascending: false });
      if (sourceId) {
        q = q.eq("source_id", sourceId);
      }
      const { data } = await q;
      if (data) return data as NoteRecord[];
    } catch (err) {
      console.warn("[Supabase getNotes fallback to local store]", err);
    }
  }

  const store = readStore();
  const filtered = sourceId
    ? store.notes.filter((n) => n.source_id === sourceId)
    : store.notes;
  return filtered.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function createNote(input: {
  source_id: string;
  content?: string | null;
  file_url?: string | null;
  file_type?: string | null;
}): Promise<NoteRecord> {
  await upsertSource(
    input.source_id,
    input.source_id.startsWith("C") ? "group" : "user"
  );

  const supabase = getSupabase();
  if (supabase) {
    try {
      const payload = {
        source_id: input.source_id,
        content: input.content || null,
        file_url: input.file_url || null,
        file_type: input.file_type || "text",
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("notes").insert(payload).select().single();
      if (!error && data) {
        return data as NoteRecord;
      }
      if (error) console.error("[Supabase createNote error]", error);
    } catch (err) {
      console.warn("[Supabase createNote fallback to local store]", err);
    }
  }

  const store = readStore();
  const note: NoteRecord = {
    id: crypto.randomUUID(),
    source_id: input.source_id,
    content: input.content || null,
    file_url: input.file_url || null,
    file_type: input.file_type || "text",
    created_at: new Date().toISOString(),
  };
  store.notes.unshift(note);
  writeStore(store);
  return note;
}

export async function deleteNote(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (!error) return true;
      console.error("[Supabase deleteNote error]", error);
    } catch (err) {
      console.warn("[Supabase deleteNote fallback to local store]", err);
    }
  }

  const store = readStore();
  const len = store.notes.length;
  store.notes = store.notes.filter((n) => n.id !== id);
  if (store.notes.length !== len) {
    writeStore(store);
    return true;
  }
  return false;
}

export function getNextRepeatDate(currentRemindAt: string, repeatType: RepeatType): string {
  const d = new Date(currentRemindAt);
  if (repeatType === "daily") {
    d.setDate(d.getDate() + 1);
  } else if (repeatType === "weekly") {
    d.setDate(d.getDate() + 7);
  } else if (repeatType === "monthly") {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}
