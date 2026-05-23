"use client";

import { useState, useEffect, useRef } from "react";

interface DateRangePickerProps {
  dateFrom: string; // YYYY-MM-DD
  dateTo: string;   // YYYY-MM-DD
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onApply: () => void;
  loading?: boolean;
}

/** YYYY-MM-DD → MM/DD/YYYY */
function toDisplay(iso: string): string {
  if (!iso) return "";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  return `${m[2]}/${m[3]}/${m[1]}`;
}

/** MM/DD/YYYY → YYYY-MM-DD */
function toIso(display: string): string {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  return `${m[3]}-${m[1]}-${m[2]}`;
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function DateInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
}) {
  const [display, setDisplay] = useState(toDisplay(value));
  const hiddenRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  const handleChange = (raw: string) => {
    // Strip non-digits
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = "";
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += "/";
      formatted += digits[i];
    }
    setDisplay(formatted);

    // When complete, validate and push
    if (formatted.length === 10) {
      const iso = toIso(formatted);
      if (iso) {
        const d = new Date(iso);
        if (!isNaN(d.getTime())) {
          onChange(iso);
        }
      }
    }
  };

  const handleBlur = () => {
    // Reset to last valid value if incomplete
    if (display.length < 10) {
      setDisplay(toDisplay(value));
    }
  };

  const handleCalendar = () => {
    hiddenRef.current?.showPicker();
  };

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) {
      onChange(v);
      setDisplay(toDisplay(v));
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="MM/DD/YYYY"
        maxLength={10}
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="pl-3 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-gray-400 transition-colors w-[130px] tabular-nums tracking-wide"
      />
      <button
        type="button"
        onClick={handleCalendar}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:text-gray-600 transition-colors cursor-pointer"
        tabIndex={-1}
        aria-label="Open calendar"
      >
        <CalendarIcon />
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={handlePick}
        className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

export default function DateRangePicker({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  loading,
}: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label htmlFor="rangeStart" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          From
        </label>
        <DateInput id="rangeStart" value={dateFrom} onChange={onDateFromChange} />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label htmlFor="rangeEnd" className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          To
        </label>
        <DateInput id="rangeEnd" value={dateTo} onChange={onDateToChange} />
      </div>
      <button
        onClick={onApply}
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Loading…" : "Apply"}
      </button>
    </div>
  );
}
