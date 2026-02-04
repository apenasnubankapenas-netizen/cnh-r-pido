import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  return days;
}

export default function SuggestiveCalendar({
  monthDate,
  onPrev,
  onNext,
  selectedDate,
  onSelectDate,
  isFullyBooked,
}) {
  const days = getDaysInMonth(monthDate);
  const todayStr = new Date().toISOString().split('T')[0];

  const monthLabel = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const week = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="rounded-xl border border-[#374151] bg-[#111827] p-3">
      <div className="flex items-center justify-between mb-3">
        <button
          className="p-2 rounded hover:bg-[#1f2937]"
          onClick={onPrev}
          aria-label="Mês anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-xl font-bold uppercase text-[#f0c41b]">{monthLabel}</div>
        <button
          className="p-2 rounded hover:bg-[#1f2937]"
          onClick={onNext}
          aria-label="Próximo mês"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-[11px] text-[#9ca3af] mb-1">
        {week.map((d, i) => (
          <div key={i} className="text-center py-1 w-10 mx-auto">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, idx) => {
          if (!d) {
            return <div key={idx} className="h-10 w-10 mx-auto" />;
          }
          const dateStr = d.toISOString().split('T')[0];
          const isPast = dateStr < todayStr;
          const full = isFullyBooked ? isFullyBooked(dateStr) : false;
          const isSelected = selectedDate === dateStr;

          const base = 'h-10 w-10 mx-auto rounded-lg flex items-center justify-center text-sm transition border';
          const state = isPast
            ? 'opacity-40 cursor-not-allowed border-transparent text-white'
            : full
              ? 'bg-red-600/20 text-red-400 border-red-500/40'
              : 'bg-[#0b1220] hover:bg-[#0f172a] border-[#1f2a44] text-white';
          const selectedCls = isSelected ? ' ring-2 ring-[#f0c41b]' : '';

          return (
            <button
              key={idx}
              className={`${base} ${state} ${selectedCls}`}
              disabled={isPast}
              onClick={() => onSelectDate(dateStr)}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-3 text-xs text-[#9ca3af]">
        <div className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-600/60" /> Dia lotado</div>
        <div className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[#0b1220] border border-[#1f2a44]" /> Dia com vagas</div>
      </div>
    </div>
  );
}