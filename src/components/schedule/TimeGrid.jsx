import React from 'react';

export default function TimeGrid({ timeSlots = [], bookedTimes = new Set(), selectedTime, onSelect }) {
  return (
    <div className="rounded-xl border border-[#374151] bg-[#111827] p-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {timeSlots.map((t) => {
          const isBooked = bookedTimes.has(t);
          const isSelected = selectedTime === t;
          const base = 'px-3 py-2 rounded-md text-sm text-center border transition';
          const bookedCls = 'bg-red-600/20 text-red-400 border-red-500/40 cursor-not-allowed';
          const freeCls = 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30 cursor-pointer';
          const selectedCls = isSelected ? ' ring-2 ring-[#f0c41b]' : '';
          return (
            <button
              key={t}
              disabled={isBooked}
              className={`${base} ${isBooked ? bookedCls : freeCls} ${selectedCls}`}
              onClick={() => !isBooked && onSelect && onSelect(t)}
            >
              {t}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-[#9ca3af]">
        <div className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-600/60" /> Horário ocupado</div>
        <div className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-600/60" /> Horário livre</div>
      </div>
    </div>
  );
}