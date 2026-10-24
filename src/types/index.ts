export type SourceType = "user" | "group";

export type RepeatType = "once" | "daily" | "weekly" | "monthly";

export type ReminderStatus = "pending" | "sent" | "cancelled" | "completed";

export interface SourceRecord {
  id: string; // userId or groupId
  type: SourceType;
  name: string | null;
  created_at: string;
}

export interface ReminderRecord {
  id: string;
  source_id: string;
  created_by_user_id: string | null;
  title: string;
  remind_at: string; // ISO string with timezone
  repeat_type: RepeatType;
  status: ReminderStatus;
  created_at: string;
}

export interface NoteRecord {
  id: string;
  source_id: string;
  content: string | null;
  file_url: string | null;
  file_type: string | null; // 'text' | 'image' | 'file' | 'link'
  created_at: string;
}

export interface ExtractedTaskResult {
  is_reminder_intent: boolean;
  is_note_intent?: boolean;
  task_title: string;
  remind_at: string; // ISO 8601 timestamp
  repeat_type: RepeatType;
  confidence: number;
  engine: "gemini" | "thai-nlp-rule";
  raw_time_phrase?: string;
}
