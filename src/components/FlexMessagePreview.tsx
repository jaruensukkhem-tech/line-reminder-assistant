"use client";

import React from "react";
import { ReminderRecord } from "@/types";
import {
  formatThaiDateFull,
  formatThaiTime,
  REPEAT_LABELS_TH,
} from "@/lib/line-flex";
import { Clock, Calendar, Edit3, XCircle, CheckCircle2 } from "lucide-react";

interface FlexMessagePreviewProps {
  reminder: ReminderRecord;
  variant?: "confirmation" | "push_alert";
  onEditTime?: (reminder: ReminderRecord) => void;
  onCancel?: (reminderId: string) => void;
  onComplete?: (reminderId: string) => void;
}

export default function FlexMessagePreview({
  reminder,
  variant = "confirmation",
  onEditTime,
  onCancel,
  onComplete,
}: FlexMessagePreviewProps) {
  const timeText = formatThaiTime(reminder.remind_at);
  const dateText = formatThaiDateFull(reminder.remind_at);
  const repeatLabel = REPEAT_LABELS_TH[reminder.repeat_type] || "เตือนครั้งเดียว";
  const isCancelled = reminder.status === "cancelled";
  const isCompleted = reminder.status === "completed";

  return (
    <div className="w-full max-w-[320px] rounded-[18px] overflow-hidden border border-[#EAEAEA] shadow-soft bg-[#F9F9F6] transition-all">
      {/* Flex Header */}
      <div
        className={`px-4 py-3.5 flex items-center gap-3 ${
          variant === "push_alert" ? "bg-[#E27D50]" : "bg-[#4E8752]"
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">
            {variant === "push_alert"
              ? "🔔 ถึงเวลานัดหมายแล้ว!"
              : "บันทึกการแจ้งเตือนแล้ว"}
          </p>
          <p className="text-[#E3F0E4] text-xs truncate mt-0.5">
            {reminder.source_id.startsWith("C")
              ? "แจ้งเตือนสมาชิกทุกคนในกลุ่ม"
              : "ผู้ช่วยเตือนความจำส่วนตัว (LINE Flex)"}
          </p>
        </div>
      </div>

      {/* Flex Body */}
      <div className="p-4 space-y-3 bg-[#F9F9F6]">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <span
            className={`text-[28px] font-bold tracking-tight leading-none ${
              isCancelled
                ? "line-through text-[#8D99AE]"
                : "text-[#2B2D42]"
            }`}
          >
            {timeText}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#EEF5EE] text-[#4E8752] border border-[#D5E6D6]">
            {repeatLabel}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#8D99AE]">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{dateText}</span>
        </div>

        <div className="border-t border-[#EAEAEA] pt-3">
          <div className="bg-white rounded-[14px] p-3.5 border border-[#EAEAEA]">
            <span className="text-[11px] font-medium text-[#8D99AE] block">
              เรื่องที่ต้องทำ
            </span>
            <p
              className={`text-[17px] font-semibold mt-0.5 leading-snug ${
                isCancelled
                  ? "line-through text-[#8D99AE]"
                  : "text-[#4A4E69]"
              }`}
            >
              {reminder.title}
            </p>
          </div>
        </div>

        {/* Status badge if already cancelled or completed */}
        {(isCancelled || isCompleted) && (
          <div
            className={`text-xs font-medium px-3 py-1.5 rounded-lg text-center ${
              isCompleted
                ? "bg-[#EEF5EE] text-[#4E8752]"
                : "bg-gray-100 text-[#8D99AE]"
            }`}
          >
            {isCompleted ? "✓ ทำรายการนี้เสร็จแล้ว" : "✕ ยกเลิกรายการเตือนนี้แล้ว"}
          </div>
        )}
      </div>

      {/* Flex Footer Actions */}
      {!isCancelled && !isCompleted && (
        <div className="px-4 pb-4 pt-0 bg-[#F9F9F6] flex gap-2">
          {variant === "confirmation" ? (
            <>
              <button
                type="button"
                onClick={() => onEditTime?.(reminder)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#E27D50] hover:bg-[#d36d40] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                เปลี่ยนเวลา (LIFF)
              </button>
              <button
                type="button"
                onClick={() => onCancel?.(reminder.id)}
                className="py-2.5 px-3.5 rounded-xl bg-[#EAEAEA] hover:bg-gray-300 text-[#4A4E69] font-semibold text-xs flex items-center justify-center gap-1 transition"
              >
                <XCircle className="w-3.5 h-3.5" />
                ยกเลิก
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onComplete?.(reminder.id)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#4E8752] hover:bg-[#417345] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              ทำเสร็จแล้ว ✓
            </button>
          )}
        </div>
      )}
    </div>
  );
}
