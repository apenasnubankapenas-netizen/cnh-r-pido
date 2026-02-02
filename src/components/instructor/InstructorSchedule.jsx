import React from "react";
import { Badge } from "@/components/ui/badge";

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const weekday = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function InstructorSchedule({ lessons = [] }) {
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    const iso = formatDateISO(d);
    const times = lessons
      .filter((l) => l.date === iso)
      .map((l) => l.time)
      .sort((a, b) => a.localeCompare(b));
    return { date: d, iso, times, busy: times.length > 0 };
  });

  return (
    <div className="overflow-x-auto py-2">
      <div className="flex gap-3 min-w-full">
        {days.map((day) => (
          <div
            key={day.iso}
            className="min-w-[180px] rounded-lg border border-[#374151] bg-[#111827] p-3 hover:border-[#3b82f6] transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-xs text-[#9ca3af]">{weekday[day.date.getDay()]}</div>
                <div className="font-bold">{String(day.date.getDate()).padStart(2, '0')}/{String(day.date.getMonth()+1).padStart(2, '0')}</div>
              </div>
              <Badge className={day.busy ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                {day.busy ? "Aulas" : "Livre"}
              </Badge>
            </div>
            {day.busy ? (
              <div className="flex flex-wrap gap-1">
                {day.times.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-300 border border-red-500/30"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-green-300">Dia todo disponível</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}