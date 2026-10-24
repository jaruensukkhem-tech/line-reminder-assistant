"use client";

import React, { useEffect, useState } from "react";
import { ReminderRecord, RepeatType } from "@/types";
import { Calendar, Clock, Repeat, Sparkles, X } from "lucide-react";

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReminder?: ReminderRecord | null;
  activeSourceId: string;
  onSave: (data: {
    id?: string;
    title: string;
    remind_at: string;
    repeat_type: RepeatType;
    source_id: string;
  }) => Promise<void>;
}

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${mins}`;
}

export default function ReminderFormModal({
  isOpen,
  onClose,
  initialReminder,
  activeSourceId,
  onSave,
}: ReminderFormModalProps) {
  const [title, setTitle] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("09:00");
  const [repeatType, setRepeatType] = useState<RepeatType>("once");
  const [sourceId, setSourceId] = useState(activeSourceId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialReminder) {
      setTitle(initialReminder.title);
      setDateStr(toDateInputValue(initialReminder.remind_at));
      setTimeStr(toTimeInputValue(initialReminder.remind_at));
      setRepeatType(initialReminder.repeat_type);
      setSourceId(initialReminder.source_id);
    } else {
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1, 0, 0, 0);
      setTitle("");
      setDateStr(toDateInputValue(defaultDate.toISOString()));
      setTimeStr(toTimeInputValue(defaultDate.toISOString()));
      setRepeatType("once");
      setSourceId(activeSourceId === "ALL" ? "U_DEMO_USER_01" : activeSourceId);
    }
  }, [initialReminder, activeSourceId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateStr || !timeStr) return;

    setSaving(true);
    try {
      const combined = new Date(`${dateStr}T${timeStr}:00`);
      await onSave({
        id: initialReminder?.id,
        title: title.trim(),
        remind_at: combined.toISOString(),
        repeat_type: repeatType,
        source_id: sourceId,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const quickTimePresets = [
    { label: "09:00 เช้า", time: "09:00" },
    { label: "12:00 เที่ยง", time: "12:00" },
    { label: "14:00 บ่ายสอง", time: "14:00" },
    { label: "17:45 เย็น", time: "17:45" },
    { label: "20:00 ค่ำ", time: "20:00" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#2B2D42]/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#F9F9F6] w-full max-w-lg rounded-t-[24px] sm:rounded-[22px] border border-[#EAEAEA] shadow-soft-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-[#EAEAEA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EEF5EE] text-[#4E8752] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#2B2D42]">
                {initialReminder ? "แก้ไขเวลานัดหมาย" : "ตั้งเตือนความจำใหม่"}
              </h3>
              <p className="text-xs text-[#8D99AE]">
                กำหนดวัน เวลา และรูปแบบการแจ้งเตือนผ่าน LINE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#8D99AE] hover:bg-[#F9F9F6] hover:text-[#2B2D42] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ชื่อเรื่องที่ต้องการให้เตือน */}
          <div>
            <label className="block text-sm font-semibold text-[#2B2D42] mb-1.5">
              กิจกรรมหรือเรื่องที่ต้องทำ
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น ประชุมทีมการตลาด, ไปวิ่ง, ทานยาหลังอาหาร..."
              className="w-full px-4 py-3 rounded-[14px] bg-white border border-[#EAEAEA] text-[#2B2D42] text-base focus:outline-none focus:border-[#4E8752] transition"
            />
          </div>

          {/* เลือกวันและเวลา */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#2B2D42] mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#4E8752]" />
                วันที่แจ้งเตือน
              </label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full px-4 py-3 rounded-[14px] bg-white border border-[#EAEAEA] text-[#2B2D42] font-medium focus:outline-none focus:border-[#4E8752]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2B2D42] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#E27D50]" />
                เวลา (24 ชั่วโมง)
              </label>
              <input
                type="time"
                required
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full px-4 py-3 rounded-[14px] bg-white border border-[#EAEAEA] text-[#2B2D42] text-xl font-bold focus:outline-none focus:border-[#4E8752]"
              />
            </div>
          </div>

          {/* ปุ่มลัดเลือกเวลา */}
          <div>
            <span className="text-xs font-medium text-[#8D99AE] block mb-2">
              เลือกเวลาด่วน:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickTimePresets.map((preset) => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => setTimeStr(preset.time)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    timeStr === preset.time
                      ? "bg-[#4E8752] text-white border-[#4E8752]"
                      : "bg-white text-[#4A4E69] border-[#EAEAEA] hover:border-[#4E8752]/50"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* รูปแบบการเตือนซ้ำ */}
          <div>
            <label className="block text-sm font-semibold text-[#2B2D42] mb-2 flex items-center gap-1.5">
              <Repeat className="w-4 h-4 text-[#4E8752]" />
              รูปแบบการเตือนซ้ำ
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { value: "once", label: "ครั้งเดียว" },
                  { value: "daily", label: "ทุกวัน" },
                  { value: "weekly", label: "ทุกสัปดาห์" },
                  { value: "monthly", label: "ทุกเดือน" },
                ] as { value: RepeatType; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRepeatType(opt.value)}
                  className={`py-2.5 px-3 rounded-[14px] text-xs font-semibold border transition ${
                    repeatType === opt.value
                      ? "bg-[#EEF5EE] text-[#4E8752] border-[#4E8752]"
                      : "bg-white text-[#4A4E69] border-[#EAEAEA] hover:border-[#4E8752]/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* ช่องทางส่งแจ้งเตือน (ส่วนตัว vs กลุ่ม) */}
          {!initialReminder && (
            <div>
              <label className="block text-sm font-semibold text-[#2B2D42] mb-2">
                ส่งแจ้งเตือนไปยัง
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSourceId("U_DEMO_USER_01")}
                  className={`p-3 rounded-[14px] border text-left transition ${
                    !sourceId.startsWith("C")
                      ? "bg-[#EEF5EE] border-[#4E8752] text-[#2B2D42]"
                      : "bg-white border-[#EAEAEA] text-[#4A4E69]"
                  }`}
                >
                  <p className="text-xs font-bold text-[#4E8752]">แชทส่วนตัว (1-on-1)</p>
                  <p className="text-[11px] text-[#8D99AE] mt-0.5">เตือนเฉพาะคุณคนเดียว</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceId("C_DEMO_GROUP_01")}
                  className={`p-3 rounded-[14px] border text-left transition ${
                    sourceId.startsWith("C")
                      ? "bg-[#EEF5EE] border-[#4E8752] text-[#2B2D42]"
                      : "bg-white border-[#EAEAEA] text-[#4A4E69]"
                  }`}
                >
                  <p className="text-xs font-bold text-[#4E8752]">กลุ่ม LINE (Group)</p>
                  <p className="text-[11px] text-[#8D99AE] mt-0.5">แจ้งเตือนทุกคนในกลุ่ม</p>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-[14px] bg-white border border-[#EAEAEA] text-[#4A4E69] font-semibold text-sm hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 px-4 rounded-[14px] bg-[#E27D50] hover:bg-[#d36d40] text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
            >
              {saving
                ? "กำลังบันทึก..."
                : initialReminder
                ? "บันทึกเวลาใหม่"
                : "บันทึกการแจ้งเตือน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
