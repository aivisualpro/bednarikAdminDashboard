"use client";

interface DateRangePickerProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (val: string) => void;
  onDateToChange: (val: string) => void;
  onApply: () => void;
  loading?: boolean;
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
        <input
          id="rangeStart"
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => onDateFromChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-gray-400 transition-colors tabular-nums cursor-pointer"
        />
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <label
          htmlFor="rangeEnd"
          className="text-xs font-medium text-gray-500 uppercase tracking-wider"
        >
          To
        </label>
        <input
          id="rangeEnd"
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => onDateToChange(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 outline-none focus:border-gray-400 transition-colors tabular-nums cursor-pointer"
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
