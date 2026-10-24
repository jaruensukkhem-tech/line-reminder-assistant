"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NoteRecord, ReminderRecord, RepeatType } from "@/types";
import HorizontalDatePicker, {
  toLocalDateKey,
} from "@/components/HorizontalDatePicker";
import ReminderCard from "@/components/ReminderCard";
import ReminderFormModal from "@/components/ReminderFormModal";
import LineBotSimulator from "@/components/LineBotSimulator";
import {
  Bell,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  FolderOpen,
  Image as ImageIcon,
  Layers,
  Plus,
  Send,
  Settings,
  Sparkles,
  Trash2,
  User,
  Users,
} from "lucide-react";

type ActiveTab = "reminders" | "notes" | "files" | "settings";
type SourceFilter = "ALL" | "U_DEMO_USER_01" | "C_DEMO_GROUP_01";

export default function LiffDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("reminders");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [selectedDateKey, setSelectedDateKey] = useState<string | "ALL">("ALL");

  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // LINE LIFF Profile State
  const [liffProfile, setLiffProfile] = useState<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
    isInClient: boolean;
    liffReady: boolean;
  }>({
    userId: "U_DEMO_USER_01",
    displayName: "คุณจเร (LINE LIFF)",
    isInClient: false,
    liffReady: false,
  });

  // Quick Natural Language Input Bar on Reminders Tab
  const [quickAiText, setQuickAiText] = useState("");
  const [quickAiSubmitting, setQuickAiSubmitting] = useState(false);

  // Modal State for Create / Edit Reminder
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] =
    useState<ReminderRecord | null>(null);

  // Notes & Files creation states
  const [newNoteText, setNewNoteText] = useState("");
  const [newFileTitle, setNewFileTitle] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");
  const [newFileType, setNewFileType] = useState<"image" | "file">("file");
  const [fileCategoryFilter, setFileCategoryFilter] = useState<
    "all" | "image" | "file"
  >("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      const query =
        sourceFilter !== "ALL" ? `?sourceId=${encodeURIComponent(sourceFilter)}` : "";
      const [remRes, noteRes] = await Promise.all([
        fetch(`/api/reminders${query}`),
        fetch(`/api/notes${query}`),
      ]);
      const remJson = await remRes.json();
      const noteJson = await noteRes.json();

      if (remJson.reminders) setReminders(remJson.reminders);
      if (noteJson.notes) setNotes(noteJson.notes);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [sourceFilter]);

  // Initialize LINE LIFF SDK if NEXT_PUBLIC_LIFF_ID is provided
  useEffect(() => {
    async function initLineLiff() {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
      if (!liffId || liffId === "your_line_liff_id") return;

      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLiffProfile({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            isInClient: liff.isInClient(),
            liffReady: true,
          });
        }
      } catch (e) {
        console.warn("LIFF init fallback to preview mode:", e);
      }
    }
    initLineLiff();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Check URL query parameter `?edit=<reminderId>` (opened from LINE Flex Message "เปลี่ยนเวลา" button)
  useEffect(() => {
    if (typeof window === "undefined" || reminders.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (editId) {
      const target = reminders.find((r) => r.id === editId);
      if (target) {
        setEditingReminder(target);
        setIsModalOpen(true);
      }
    }
  }, [reminders]);

  // ============================================================================
  // Handlers for Reminders
  // ============================================================================
  const handleToggleComplete = async (reminder: ReminderRecord) => {
    const nextStatus =
      reminder.status === "completed" ? "pending" : "completed";
    // Optimistic update
    setReminders((prev) =>
      prev.map((r) => (r.id === reminder.id ? { ...r, status: nextStatus } : r))
    );
    await fetch(`/api/reminders/${reminder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    await fetchAllData();
  };

  const handleDeleteReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    await fetchAllData();
  };

  const handleCancelReminder = async (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/reminders/${id}`, {
      method: "DELETE",
    });
    await fetchAllData();
  };

  const handleCompleteReminderById = async (id: string) => {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    await fetchAllData();
  };

  const handleSaveReminderModal = async (data: {
    id?: string;
    title: string;
    remind_at: string;
    repeat_type: RepeatType;
    source_id: string;
  }) => {
    if (data.id) {
      await fetch(`/api/reminders/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          remind_at: data.remind_at,
          repeat_type: data.repeat_type,
        }),
      });
    } else {
      await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    await fetchAllData();
  };

  const handleQuickAiReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAiText.trim() || quickAiSubmitting) return;

    setQuickAiSubmitting(true);
    try {
      const targetSource =
        sourceFilter === "C_DEMO_GROUP_01"
          ? "C_DEMO_GROUP_01"
          : "U_DEMO_USER_01";
      await fetch("/api/simulate-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: quickAiText.trim(),
          source_id: targetSource,
          source_type: targetSource.startsWith("C") ? "group" : "user",
        }),
      });
      setQuickAiText("");
      await fetchAllData();
    } finally {
      setQuickAiSubmitting(false);
    }
  };

  // ============================================================================
  // Handlers for Notes & Files
  // ============================================================================
  const handleCreateTextNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const targetSource =
      sourceFilter === "C_DEMO_GROUP_01" ? "C_DEMO_GROUP_01" : "U_DEMO_USER_01";
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_id: targetSource,
        content: newNoteText.trim(),
        file_type: "text",
      }),
    });
    setNewNoteText("");
    await fetchAllData();
  };

  const handleCreateFileItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileTitle.trim() && !newFileUrl.trim()) return;
    const targetSource =
      sourceFilter === "C_DEMO_GROUP_01" ? "C_DEMO_GROUP_01" : "U_DEMO_USER_01";
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_id: targetSource,
        content: newFileTitle.trim() || "ไฟล์แนบจาก LINE",
        file_url:
          newFileUrl.trim() ||
          (newFileType === "image"
            ? "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80"
            : "https://example.com/document.pdf"),
        file_type: newFileType,
      }),
    });
    setNewFileTitle("");
    setNewFileUrl("");
    await fetchAllData();
  };

  const handleDeleteNote = async (id: string) => {
    await fetch(`/api/notes?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await fetchAllData();
  };

  // ============================================================================
  // Grouping Reminders into Today, Upcoming, Completed/Missed
  // ============================================================================
  const todayKey = toLocalDateKey(new Date());

  const dateFilteredReminders = useMemo(() => {
    const active = reminders.filter((r) => r.status !== "cancelled");
    if (selectedDateKey === "ALL") return active;
    return active.filter((r) => toLocalDateKey(r.remind_at) === selectedDateKey);
  }, [reminders, selectedDateKey]);

  const todayReminders = useMemo(
    () =>
      dateFilteredReminders.filter(
        (r) =>
          r.status === "pending" && toLocalDateKey(r.remind_at) === todayKey
      ),
    [dateFilteredReminders, todayKey]
  );

  const upcomingReminders = useMemo(
    () =>
      dateFilteredReminders.filter(
        (r) =>
          r.status === "pending" && toLocalDateKey(r.remind_at) > todayKey
      ),
    [dateFilteredReminders, todayKey]
  );

  const completedOrPastReminders = useMemo(
    () =>
      dateFilteredReminders.filter(
        (r) =>
          r.status === "completed" ||
          r.status === "sent" ||
          (r.status === "pending" && toLocalDateKey(r.remind_at) < todayKey)
      ),
    [dateFilteredReminders, todayKey]
  );

  const textNotesOnly = useMemo(
    () => notes.filter((n) => !n.file_url || n.file_type === "text"),
    [notes]
  );

  const fileNotesOnly = useMemo(() => {
    const withFiles = notes.filter(
      (n) => n.file_type === "image" || n.file_type === "file" || Boolean(n.file_url)
    );
    if (fileCategoryFilter === "all") return withFiles;
    return withFiles.filter((n) => n.file_type === fileCategoryFilter);
  }, [notes, fileCategoryFilter]);

  return (
    <div className="min-h-screen bg-[#F9F9F6] text-[#2B2D42] pb-28">
      {/* Top Bar / LINE LIFF Header */}
      <header className="sticky top-0 z-30 bg-[#F9F9F6]/90 backdrop-blur-md border-b border-[#EAEAEA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          {/* Brand & User Profile */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#4E8752] text-white flex items-center justify-center shadow-soft shrink-0">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#2B2D42] truncate">
                  ชะโด AI
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#EEF5EE] text-[#4E8752] border border-[#D5E6D6]">
                  LINE LIFF
                </span>
              </div>
              <p className="text-xs text-[#8D99AE] truncate">
                สวัสดี {liffProfile.displayName} • ผู้ช่วยเตือนความจำส่วนตัว & กลุ่ม
              </p>
            </div>
          </div>

          {/* Primary CTA Button (Soft Warm Orange #E27D50) */}
          <button
            type="button"
            onClick={() => {
              setEditingReminder(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-[16px] bg-[#E27D50] hover:bg-[#d36d40] text-white font-semibold text-sm inline-flex items-center gap-1.5 shadow-soft transition shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>ตั้งเตือนใหม่</span>
          </button>
        </div>

        {/* Context Filter Bar (ทั้งหมด / แชทส่วนตัว 1-on-1 / กลุ่ม LINE) */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-[16px] border border-[#EAEAEA]">
            <button
              type="button"
              onClick={() => setSourceFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                sourceFilter === "ALL"
                  ? "bg-[#4E8752] text-white"
                  : "text-[#4A4E69] hover:bg-[#F9F9F6]"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("U_DEMO_USER_01")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                sourceFilter === "U_DEMO_USER_01"
                  ? "bg-[#4E8752] text-white"
                  : "text-[#4A4E69] hover:bg-[#F9F9F6]"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              ส่วนตัว (1-on-1)
            </button>
            <button
              type="button"
              onClick={() => setSourceFilter("C_DEMO_GROUP_01")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                sourceFilter === "C_DEMO_GROUP_01"
                  ? "bg-[#4E8752] text-white"
                  : "text-[#4A4E69] hover:bg-[#F9F9F6]"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              กลุ่ม LINE
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className="text-xs font-semibold text-[#4E8752] hover:underline inline-flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E27D50]" />
            ทดลองพิมพ์สั่งบอทในห้องแชทจำลอง →
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* ====================================================================
            TAB 1: แจ้งเตือน (Reminders & Calendar Timeline)
           ==================================================================== */}
        {activeTab === "reminders" && (
          <>
            {/* Quick AI Natural Language Input Box */}
            <form
              onSubmit={handleQuickAiReminder}
              className="bg-white rounded-[20px] p-3.5 sm:p-4 border border-[#EAEAEA] shadow-soft flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <div className="flex items-center gap-2.5 flex-1">
                <div className="w-9 h-9 rounded-xl bg-[#EEF5EE] text-[#4E8752] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={quickAiText}
                  onChange={(e) => setQuickAiText(e.target.value)}
                  placeholder='พิมพ์สั่ง AI ด่วน เช่น "เตือนพรุ่งนี้บ่ายสอง ประชุมทีม" หรือ "เตือน 17.45 ไปวิ่งทุกวัน"'
                  className="w-full text-sm sm:text-base text-[#2B2D42] placeholder:text-[#8D99AE] focus:outline-none bg-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={quickAiSubmitting || !quickAiText.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#4E8752] hover:bg-[#417345] text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 transition shrink-0 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{quickAiSubmitting ? "กำลังสกัดเวลา..." : "ให้ AI ตั้งเตือน"}</span>
              </button>
            </form>

            {/* Horizontal Date Picker */}
            <section aria-label="แถบเลือกวันที่แนวนอน">
              <HorizontalDatePicker
                selectedDateKey={selectedDateKey}
                onSelectDate={setSelectedDateKey}
                reminders={reminders}
              />
            </section>

            {loading ? (
              <div className="bg-white rounded-[20px] p-10 text-center border border-[#EAEAEA] text-[#8D99AE]">
                กำลังโหลดตารางการแจ้งเตือน...
              </div>
            ) : (
              <div className="space-y-7">
                {/* 1. หมวดหมู่: วันนี้ (Today) */}
                {(selectedDateKey === "ALL" || selectedDateKey === todayKey) && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[#2B2D42] flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E27D50]" />
                        นัดหมายวันนี้ (Today)
                      </h2>
                      <span className="text-xs font-semibold text-[#8D99AE]">
                        {todayReminders.length} รายการ
                      </span>
                    </div>

                    {todayReminders.length === 0 ? (
                      <div className="bg-white rounded-[18px] p-6 border border-[#EAEAEA] text-center text-sm text-[#8D99AE]">
                        ไม่มีรายการแจ้งเตือนค้างสำหรับวันนี้ สบายใจได้เลย!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {todayReminders.map((rem) => (
                          <ReminderCard
                            key={rem.id}
                            reminder={rem}
                            onToggleComplete={handleToggleComplete}
                            onEdit={(r) => {
                              setEditingReminder(r);
                              setIsModalOpen(true);
                            }}
                            onDelete={handleDeleteReminder}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* 2. หมวดหมู่: กำลังจะมาถึง (Upcoming) */}
                {(selectedDateKey === "ALL" || selectedDateKey > todayKey) && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-[#2B2D42] flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#4E8752]" />
                        กำลังจะมาถึง (Upcoming)
                      </h2>
                      <span className="text-xs font-semibold text-[#8D99AE]">
                        {upcomingReminders.length} รายการ
                      </span>
                    </div>

                    {upcomingReminders.length === 0 ? (
                      <div className="bg-white rounded-[18px] p-6 border border-[#EAEAEA] text-center text-sm text-[#8D99AE]">
                        ยังไม่มีนัดหมายล่วงหน้าในวันที่เลือก
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingReminders.map((rem) => (
                          <ReminderCard
                            key={rem.id}
                            reminder={rem}
                            onToggleComplete={handleToggleComplete}
                            onEdit={(r) => {
                              setEditingReminder(r);
                              setIsModalOpen(true);
                            }}
                            onDelete={handleDeleteReminder}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* 3. หมวดหมู่: เสร็จสิ้น / ผ่านมาแล้ว (Completed / Sent) */}
                {completedOrPastReminders.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-bold text-[#4A4E69] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#4E8752]" />
                        เสร็จสิ้นแล้ว / แจ้งเตือนแล้ว ({completedOrPastReminders.length})
                      </h2>
                    </div>
                    <div className="space-y-3 opacity-85">
                      {completedOrPastReminders.map((rem) => (
                        <ReminderCard
                          key={rem.id}
                          reminder={rem}
                          onToggleComplete={handleToggleComplete}
                          onEdit={(r) => {
                            setEditingReminder(r);
                            setIsModalOpen(true);
                          }}
                          onDelete={handleDeleteReminder}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {/* ====================================================================
            TAB 2: โน้ต/บันทึก (Notes Management)
           ==================================================================== */}
        {activeTab === "notes" && (
          <div className="space-y-6">
            {/* ฟอร์มเพิ่มโน้ตด่วน */}
            <form
              onSubmit={handleCreateTextNote}
              className="bg-white rounded-[20px] p-5 border border-[#EAEAEA] shadow-soft space-y-3"
            >
              <h2 className="text-lg font-bold text-[#2B2D42] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#4E8752]" />
                จดโน้ตและบันทึกช่วยจำ
              </h2>
              <textarea
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="พิมพ์ข้อความโน้ต รหัสผ่าน สรุปประชุม หรือสิ่งที่ต้องการให้บอทช่วยจำ..."
                className="w-full p-3.5 rounded-[14px] bg-[#F9F9F6] border border-[#EAEAEA] text-[#2B2D42] text-base focus:outline-none focus:border-[#4E8752]"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8D99AE]">
                  สามารถพิมพ์ในแชท LINE ว่า &quot;จดโน้ต ...&quot; เพื่อบันทึกเข้าหน้านี้ได้เช่นกัน
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#4E8752] hover:bg-[#417345] text-white font-semibold text-sm transition"
                >
                  บันทึกโน้ต
                </button>
              </div>
            </form>

            {/* รายการโน้ตทั้งหมด */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {textNotesOnly.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-[18px] p-5 border border-[#EAEAEA] shadow-soft flex flex-col justify-between gap-4"
                >
                  <p className="text-[#4A4E69] text-[16px] leading-relaxed whitespace-pre-line">
                    {note.content}
                  </p>
                  <div className="pt-3 border-t border-[#EAEAEA] flex items-center justify-between text-xs text-[#8D99AE]">
                    <span>
                      {new Date(note.created_at).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (note.content) {
                            navigator.clipboard.writeText(note.content);
                            setCopiedId(note.id);
                            setTimeout(() => setCopiedId(null), 1500);
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#F9F9F6] hover:bg-[#EEF5EE] text-[#4A4E69] hover:text-[#4E8752] font-medium inline-flex items-center gap-1 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedId === note.id ? "คัดลอกแล้ว" : "คัดลอก"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1.5 rounded-lg text-[#8D99AE] hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 3: ไฟล์/รูป (Files & Images Repository)
           ==================================================================== */}
        {activeTab === "files" && (
          <div className="space-y-6">
            {/* ฟอร์มแนบไฟล์หรือลิงก์รูปภาพ */}
            <form
              onSubmit={handleCreateFileItem}
              className="bg-white rounded-[20px] p-5 border border-[#EAEAEA] shadow-soft space-y-4"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-bold text-[#2B2D42] flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-[#4E8752]" />
                  คลังไฟล์เอกสารและรูปภาพในแชท
                </h2>
                <div className="flex items-center gap-1.5 bg-[#F9F9F6] p-1 rounded-xl border border-[#EAEAEA]">
                  {(
                    [
                      { id: "all", label: "ทั้งหมด" },
                      { id: "image", label: "รูปภาพ" },
                      { id: "file", label: "เอกสาร/ลิงก์" },
                    ] as const
                  ).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFileCategoryFilter(t.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        fileCategoryFilter === t.id
                          ? "bg-[#4E8752] text-white"
                          : "text-[#4A4E69]"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={newFileTitle}
                  onChange={(e) => setNewFileTitle(e.target.value)}
                  placeholder="ชื่อไฟล์หรือคำอธิบายรูปภาพ..."
                  className="px-3.5 py-2.5 rounded-xl bg-[#F9F9F6] border border-[#EAEAEA] text-sm text-[#2B2D42] focus:outline-none focus:border-[#4E8752]"
                />
                <input
                  type="url"
                  value={newFileUrl}
                  onChange={(e) => setNewFileUrl(e.target.value)}
                  placeholder="URL ไฟล์ หรือ URL รูปภาพ (เว้นว่างเพื่อใช้ภาพตัวอย่าง)"
                  className="px-3.5 py-2.5 rounded-xl bg-[#F9F9F6] border border-[#EAEAEA] text-sm text-[#2B2D42] focus:outline-none focus:border-[#4E8752]"
                />
                <div className="flex gap-2">
                  <select
                    value={newFileType}
                    onChange={(e) =>
                      setNewFileType(e.target.value as "image" | "file")
                    }
                    className="px-3 py-2.5 rounded-xl bg-[#F9F9F6] border border-[#EAEAEA] text-sm text-[#2B2D42] focus:outline-none"
                  >
                    <option value="file">เอกสาร / ลิงก์</option>
                    <option value="image">รูปภาพ</option>
                  </select>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#E27D50] hover:bg-[#d36d40] text-white font-semibold text-xs sm:text-sm transition"
                  >
                    + เพิ่มไฟล์
                  </button>
                </div>
              </div>
            </form>

            {/* แสดงรายการไฟล์และรูปภาพ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fileNotesOnly.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-[18px] border border-[#EAEAEA] shadow-soft overflow-hidden flex flex-col justify-between"
                >
                  {item.file_type === "image" && item.file_url && (
                    <div className="h-44 w-full bg-[#F9F9F6] overflow-hidden border-b border-[#EAEAEA]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.file_url}
                        alt={item.content || "Saved image"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#EEF5EE] text-[#4E8752] flex items-center justify-center shrink-0">
                        {item.file_type === "image" ? (
                          <ImageIcon className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#2B2D42] text-sm truncate">
                          {item.content || "ไฟล์แนบ"}
                        </p>
                        {item.file_url && (
                          <a
                            href={item.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#4E8752] hover:underline inline-flex items-center gap-1 mt-1"
                          >
                            <span>เปิดดูไฟล์</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(item.id)}
                      className="p-1.5 rounded-lg text-[#8D99AE] hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ====================================================================
            TAB 4: ตั้งค่า & ทดสอบบอท (Settings & LINE Chat Simulator)
           ==================================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Interactive LINE Bot & Group Simulator */}
            <LineBotSimulator
              onDataChanged={fetchAllData}
              onOpenEditModal={(rem) => {
                setEditingReminder(rem);
                setIsModalOpen(true);
              }}
              onCancelReminder={handleCancelReminder}
              onCompleteReminder={handleCompleteReminderById}
            />

            {/* ข้อมูลการเชื่อมต่อระบบ LINE Official Account & LIFF */}
            <div className="bg-white rounded-[20px] p-5 sm:p-6 border border-[#EAEAEA] shadow-soft space-y-4">
              <h3 className="text-lg font-bold text-[#2B2D42] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#4E8752]" />
                การตั้งค่าเชื่อมต่อ LINE Official Account & LIFF
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-[16px] bg-[#F9F9F6] border border-[#EAEAEA]">
                  <p className="text-xs font-semibold text-[#8D99AE]">
                    LINE Messaging API Webhook URL
                  </p>
                  <code className="block mt-1 text-xs font-bold text-[#4E8752] break-all">
                    POST /api/webhook/line
                  </code>
                  <p className="text-xs text-[#4A4E69] mt-1.5">
                    รองรับทั้งแชท 1-on-1 และ LINE Group (`source.groupId`) พร้อมระบบกรองคำสั่ง &quot;เตือน&quot;, &quot;ตั้งเตือน&quot; หรือ Mention ชื่อบอท
                  </p>
                </div>

                <div className="p-4 rounded-[16px] bg-[#F9F9F6] border border-[#EAEAEA]">
                  <p className="text-xs font-semibold text-[#8D99AE]">
                    Push Notification Scheduler (Cron Endpoint)
                  </p>
                  <code className="block mt-1 text-xs font-bold text-[#E27D50] break-all">
                    POST /api/cron/notify
                  </code>
                  <p className="text-xs text-[#4A4E69] mt-1.5">
                    ตรวจสอบรายการที่ถึงกำหนดเวลา (`remind_at &lt;= NOW()`) แล้วส่ง Push Flex Message ไปยัง `userId` หรือ `groupId`
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ====================================================================
          Bottom Navigation Bar (4 หมวดหมู่หลักตามสเปก LINE LIFF)
         ==================================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAEAEA] shadow-soft">
        <div className="max-w-lg mx-auto px-3 py-2 grid grid-cols-4 gap-1">
          {(
            [
              {
                id: "reminders",
                label: "แจ้งเตือน",
                icon: Bell,
                badge: reminders.filter((r) => r.status === "pending").length,
              },
              {
                id: "notes",
                label: "โน้ต/บันทึก",
                icon: BookOpen,
                badge: textNotesOnly.length,
              },
              {
                id: "files",
                label: "ไฟล์/รูป",
                icon: FolderOpen,
                badge: fileNotesOnly.length,
              },
              {
                id: "settings",
                label: "ตั้งค่า/บอท",
                icon: Settings,
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-2 rounded-2xl flex flex-col items-center justify-center relative transition ${
                  isActive
                    ? "bg-[#EEF5EE] text-[#4E8752] font-bold"
                    : "text-[#8D99AE] hover:text-[#4A4E69]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{tab.label}</span>
                {"badge" in tab && tab.badge ? (
                  <span
                    className={`absolute top-1.5 right-4 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? "bg-[#4E8752] text-white"
                        : "bg-[#F9F9F6] text-[#8D99AE] border border-[#EAEAEA]"
                    }`}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modal แก้ไขเวลา / สร้างรายการแจ้งเตือนใหม่ */}
      <ReminderFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReminder(null);
        }}
        initialReminder={editingReminder}
        activeSourceId={sourceFilter}
        onSave={handleSaveReminderModal}
      />
    </div>
  );
}
