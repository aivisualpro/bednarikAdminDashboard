"use client";

import { useState, useEffect, useRef } from "react";

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onApply: () => void;
  loading?: boolean;
}

/**
 * Convert YYYY-MM-DD (internal) → MM/DD/YYYY (display)
 */
function toDisplay(isoDate: string): string {
  if (!isoDate) return "";
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;
  return `${match[2]}/${match[3]}/${match[1]}`;
}

/**
 * Convert MM/DD/YYYY (display) → YYYY-MM-DD (internal)
 */
function toInternal(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[1]}-${match[2]}`;
}

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400"
    >
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
  value: string; // YYYY-MM-DD internal format
  onChange: (isoVal: string) => void;
}) {
  const [display, setDisplay] = useState(toDisplay(value));
  const hiddenDateRef = useRef<HTMLInputElement>(null);

  // Sync when parent value changes
  useEffect(() => {
    setDisplay(toDisplay(value));
  }, [value]);

  const handleChange = (raw: string) => {
    // Auto-insert slashes as user types digits
    const digits = raw.replace(/\D/g, "");
    let formatted = "";
    for (let i = 0; i < digits.length && i < 8; i++) {
      if (i === 2 || i === 4) formatted += "/";
      formatted += digits[i];
    }
    setDisplay(formatted);

    // If complete MM/DD/YYYY, push to parent
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(formatted)) {
      const iso = toInternal(formatted);
      if (iso) onChange(iso);
    }
  };

  const handleBlur = () => {
    // On blur, try to parse and reformat
    const iso = toInternal(display);
    if (iso) {
      onChange(iso);
      setDisplay(toDisplay(iso));
    }
  };

  const handleCalendarClick = () => {
    if (hiddenDateRef.current) {
      hiddenDateRef.current.showPicker();
    }
  };

  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value; // YYYY-MM-DD
    if (isoVal) {
      onChange(isoVal);
      setDisplay(toDisplay(isoVal));
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        data-form-type="other"
        data-lpignore="true"
        placeholder="MM/DD/YYYY"
        maxLength={10}
        value={display}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        className="pl-3 pr-9 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-gray-400 transition-colors w-[140px] tabular-nums tracking-wide"
      />
      {/* Calendar icon button */}
      <button
        type="button"
        onClick={handleCalendarClick}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:text-gray-600 transition-colors cursor-pointer"
        tabIndex={-1}
        aria-label="Open calendar"
      >
        <CalendarIcon />
      </button>
      {/* Hidden native date picker */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={value}
        onChange={handleDatePick}
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
        <label
          htmlFor="rangeStart"
          className="text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          From
        </label>
        <DateInput
          id="rangeStart"
          value={dateFrom}
          onChange={onDateFromChange}
        />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label
          htmlFor="rangeEnd"
          className="text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          To
        </label>
        <DateInput
          id="rangeEnd"
          value={dateTo}
          onChange={onDateToChange}
        />
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
