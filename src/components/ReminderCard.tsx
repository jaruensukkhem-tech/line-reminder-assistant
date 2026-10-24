"use client";

import React from "react";
import { ReminderRecord } from "@/types";
import {
  formatThaiDateFull,
  formatThaiTime,
  REPEAT_LABELS_TH,
} from "@/lib/line-flex";
import {
  Check,
  Clock,
  Edit3,
  Repeat,
  Trash2,
  Users,
  User,
} from "lucide-react";

interface ReminderCardProps {
  reminder: ReminderRecord;
  onToggleComplete: (reminder: ReminderRecord) => void;
  onEdit: (reminder: ReminderRecord) => void;
  onDelete: (id: string) => void;
}

export default function ReminderCard({
  reminder,
  onToggleComplete,
  onEdit,
  onDelete,
}: ReminderCardProps) {
  const isCompleted = reminder.status === "completed";
  const isCancelled = reminder.status === "cancelled";
  const isSent = reminder.status === "sent";
  const isGroup = reminder.source_id.startsWith("C");
  const isOverdue =
    reminder.status === "pending" &&
    new Date(reminder.remind_at).getTime() < Date.now();

  return (
    <div
      className={`bg-white rounded-[18px] border transition-all p-4 sm:p-5 shadow-soft ${
        isCompleted
          ? "border-[#D5E6D6] bg-white/85"
          : isOverdue
          ? "border-[#E27D50]/50"
          : "border-[#EAEAEA] hover:border-[#4E8752]/40"
      }`}
    >
      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Checkbox เมื่อเสร็จงาน */}
        <button
          type="button"
          onClick={() => onToggleComplete(reminder)}
          aria-label={isCompleted ? "ยกเลิกเครื่องหมายเสร็จงาน" : "ทำเครื่องหมายว่าเสร็จงาน"}
          className={`mt-1 w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all ${
            isCompleted
              ? "bg-[#4E8752] border-[#4E8752] text-white shadow-sm"
              : "bg-[#F9F9F6] border-[#8D99AE]/50 hover:border-[#4E8752] text-transparent"
          }`}
        >
          <Check className="w-4 h-4 stroke-[3]" />
        </button>

        {/* เนื้อหาหลักของงานและเวลานัดหมาย */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {/* เวลาตัวใหญ่ชัดเจน 24px-30px Bold สี Charcoal Black (#2B2D42) */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`text-2xl sm:text-[28px] font-bold tracking-tight leading-none ${
                  isCompleted || isCancelled
                    ? "line-through text-[#8D99AE]"
                    : "text-[#2B2D42]"
                }`}
              >
                {formatThaiTime(reminder.remind_at)}
              </span>

              {/* แท็บรูปแบบการเตือนซ้ำ */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  reminder.repeat_type !== "once"
                    ? "bg-[#EEF5EE] text-[#4E8752] border border-[#D5E6D6]"
                    : "bg-[#F9F9F6] text-[#8D99AE] border border-[#EAEAEA]"
                }`}
              >
                <Repeat className="w-3 h-3" />
                {REPEAT_LABELS_TH[reminder.repeat_type]}
              </span>

              {/* สถานะเสริม */}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF1EB] text-[#E27D50]">
                  <Clock className="w-3 h-3" />
                  เลยเวลาแจ้งเตือน
                </span>
              )}
              {isSent && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EEF5EE] text-[#4E8752]">
                  ส่งแจ้งเตือนเข้า LINE แล้ว
                </span>
              )}
            </div>

            {/* ปุ่มแก้ไขเวลาและลบรายการ */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEdit(reminder)}
                className="px-3 py-1.5 rounded-xl bg-[#FDF1EB] hover:bg-[#E27D50] text-[#E27D50] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition"
                title="แก้ไขเวลานัดหมาย"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>แก้ไขเวลา</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(reminder.id)}
                className="p-1.5 rounded-xl text-[#8D99AE] hover:text-red-600 hover:bg-red-50 transition"
                title="ลบรายการ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ข้อความแจ้งเตือน 16px-18px Regular/Medium สี Deep Gray (#4A4E69) */}
          <p
            className={`mt-2 text-[17px] sm:text-[18px] font-medium leading-relaxed break-words ${
              isCompleted || isCancelled
                ? "line-through text-[#8D99AE]"
                : "text-[#4A4E69]"
            }`}
          >
            {reminder.title}
          </p>

          {/* Subtext / วันที่ และที่มา (ส่วนตัว หรือ กลุ่ม) สี Muted Gray (#8D99AE) */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8D99AE]">
            <span>{formatThaiDateFull(reminder.remind_at)}</span>
            <span className="inline-flex items-center gap-1 font-medium text-[#4E8752]">
              {isGroup ? (
                <>
                  <Users className="w-3.5 h-3.5" />
                  แจ้งเตือนในกลุ่ม LINE
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5" />
                  เตือนส่วนตัว (1-on-1)
                </>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
