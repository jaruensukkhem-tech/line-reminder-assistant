"use client";

import React from "react";
import { ReminderRecord } from "@/types";
import { CalendarDays } from "lucide-react";

interface HorizontalDatePickerProps {
  selectedDateKey: string | "ALL"; // YYYY-MM-DD or "ALL"
  onSelectDate: (dateKey: string | "ALL") => void;
  reminders: ReminderRecord[];
}

export function toLocalDateKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const THAI_SHORT_DAYS = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
const THAI_SHORT_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export default function HorizontalDatePicker({
  selectedDateKey,
  onSelectDate,
  reminders,
}: HorizontalDatePickerProps) {
  const today = new Date();
  const todayKey = toLocalDateKey(today);

  // Generate 10 days: yesterday (-1) through +8 days ahead
  const days = Array.from({ length: 10 }, (_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() + (idx - 1));
    const key = toLocalDateKey(d);
    const activeCount = reminders.filter(
      (r) => r.status !== "cancelled" && toLocalDateKey(r.remind_at) === key
    ).length;

    return {
      date: d,
      key,
      dayName: THAI_SHORT_DAYS[d.getDay()],
      dayNumber: d.getDate(),
      monthName: THAI_SHORT_MONTHS[d.getMonth()],
      isToday: key === todayKey,
      activeCount,
    };
  });

  const totalActive = reminders.filter((r) => r.status !== "cancelled").length;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar">
        {/* ปุ่มดูทั้งหมด */}
        <button
          type="button"
          onClick={() => onSelectDate("ALL")}
          className={`shrink-0 px-4 py-3 rounded-[18px] border transition-all flex flex-col items-center justify-center min-w-[78px] ${
            selectedDateKey === "ALL"
              ? "bg-[#4E8752] text-white border-[#4E8752] shadow-soft"
              : "bg-white text-[#4A4E69] border-[#EAEAEA] hover:border-[#4E8752]/40"
          }`}
        >
          <CalendarDays className="w-4 h-4 mb-1 opacity-90" />
          <span className="text-xs font-semibold">ทุกวัน</span>
          <span
            className={`text-[11px] mt-0.5 font-medium ${
              selectedDateKey === "ALL" ? "text-[#E3F0E4]" : "text-[#8D99AE]"
            }`}
          >
            {totalActive} รายการ
          </span>
        </button>

        {/* แถบวันที่แนวนอน */}
        {days.map((item) => {
          const isSelected = selectedDateKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelectDate(item.key)}
              className={`shrink-0 px-3.5 py-2.5 rounded-[18px] border transition-all flex flex-col items-center justify-center min-w-[68px] relative ${
                isSelected
                  ? "bg-[#4E8752] text-white border-[#4E8752] shadow-soft"
                  : item.isToday
                  ? "bg-[#EEF5EE] text-[#2B2D42] border-[#D5E6D6]"
                  : "bg-white text-[#4A4E69] border-[#EAEAEA] hover:border-[#4E8752]/40"
              }`}
            >
              <span
                className={`text-[11px] font-medium ${
                  isSelected
                    ? "text-[#E3F0E4]"
                    : item.isToday
                    ? "text-[#4E8752] font-semibold"
                    : "text-[#8D99AE]"
                }`}
              >
                {item.isToday ? "วันนี้" : item.dayName}
              </span>
              <span
                className={`text-xl font-bold leading-tight my-0.5 ${
                  isSelected ? "text-white" : "text-[#2B2D42]"
                }`}
              >
                {item.dayNumber}
              </span>
              <span
                className={`text-[10px] ${
                  isSelected ? "text-[#E3F0E4]" : "text-[#8D99AE]"
                }`}
              >
                {item.monthName}
              </span>

              {/* จุดแสดงจำนวนงานในวันนั้น */}
              {item.activeCount > 0 && (
                <span
                  className={`mt-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected
                      ? "bg-white text-[#4E8752]"
                      : "bg-[#E27D50]/15 text-[#E27D50]"
                  }`}
                >
                  {item.activeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
