-- ============================================================================
-- LINE Reminder Bot & Personal Assistant (Abdul AI Style)
-- Database Schema (PostgreSQL / Supabase)
-- ============================================================================

-- ตารางเก็บผู้ใช้และกลุ่ม
CREATE TABLE IF NOT EXISTS sources (
  id VARCHAR(64) PRIMARY KEY, -- เก็บ userId หรือ groupId
  type VARCHAR(10) NOT NULL,   -- 'user' หรือ 'group'
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตารางเก็บการแจ้งเตือน
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id VARCHAR(64) REFERENCES sources(id) ON DELETE CASCADE,
  created_by_user_id VARCHAR(64),
  title TEXT NOT NULL,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  repeat_type VARCHAR(20) DEFAULT 'once', -- 'once', 'daily', 'weekly', 'monthly'
  status VARCHAR(20) DEFAULT 'pending',   -- 'pending', 'sent', 'cancelled', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ตารางเก็บโน้ตและไฟล์
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id VARCHAR(64) REFERENCES sources(id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  file_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes สำหรับค้นหารายการที่ถึงเวลาแจ้งเตือนและดึงข้อมูลหน้า LIFF ได้รวดเร็ว
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(status, remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_source ON reminders(source_id, remind_at);
CREATE INDEX IF NOT EXISTS idx_notes_source ON notes(source_id, created_at DESC);
