"use client";

import { useState, useEffect } from "react";

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

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      placeholder="MM/DD/YYYY"
      maxLength={10}
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-gray-400 transition-colors w-[130px] tabular-nums tracking-wide"
    />
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
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <label
          htmlFor="dateFrom"
          className="text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          From
        </label>
        <DateInput
          id="dateFrom"
          value={dateFrom}
          onChange={onDateFromChange}
        />
      </div>
      <div className="flex items-center gap-2">
        <label
          htmlFor="dateTo"
          className="text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          To
        </label>
        <DateInput
          id="dateTo"
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
