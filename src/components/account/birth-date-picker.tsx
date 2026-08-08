"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { brazilianDateToIso, formatDateInput, isoToBrazilianDate } from "@/lib/masks";

type Month = { year: number; month: number };

type BirthDatePickerProps = {
  defaultValue: string;
  describedBy?: string;
  invalid?: boolean;
  inputClassName: string;
  today: string;
};

const weekDays = ["D", "S", "T", "Q", "Q", "S", "S"];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });
const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2024, month, 1))));

function isoParts(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month: month - 1, day };
}

function monthKey(month: Month) {
  return month.year * 12 + month.month;
}

function shiftMonth(current: Month, amount: number): Month {
  const date = new Date(Date.UTC(current.year, current.month + amount, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 16 16">
      <path d={direction === "previous" ? "m10 3-5 5 5 5" : "m6 3 5 5-5 5"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

export function BirthDatePicker({ defaultValue, describedBy, invalid, inputClassName, today }: BirthDatePickerProps) {
  const todayParts = isoParts(today);
  const initialParts = defaultValue ? isoParts(defaultValue) : todayParts;
  const minimumDate = `${todayParts.year - 120}-${String(todayParts.month + 1).padStart(2, "0")}-${String(todayParts.day).padStart(2, "0")}`;
  const minimumParts = isoParts(minimumDate);
  const [displayValue, setDisplayValue] = useState(isoToBrazilianDate(defaultValue));
  const [submittedValue, setSubmittedValue] = useState(defaultValue);
  const [visibleMonth, setVisibleMonth] = useState<Month>({ year: initialParts.year, month: initialParts.month });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const days = useMemo(() => {
    const firstWeekDay = new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(visibleMonth.year, visibleMonth.month + 1, 0)).getUTCDate();
    return [...Array<null>(firstWeekDay).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  }, [visibleMonth]);

  const currentMonthKey = monthKey(visibleMonth);
  const minimumMonthKey = monthKey({ year: minimumParts.year, month: minimumParts.month });
  const maximumMonthKey = monthKey({ year: todayParts.year, month: todayParts.month });
  const years = useMemo(() => Array.from({ length: 121 }, (_, index) => todayParts.year - index), [todayParts.year]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectDate(isoDate: string) {
    setDisplayValue(isoToBrazilianDate(isoDate));
    setSubmittedValue(isoDate);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function handleTextChange(value: string) {
    const maskedValue = formatDateInput(value);
    const isoDate = brazilianDateToIso(maskedValue);
    setDisplayValue(maskedValue);
    setSubmittedValue(isoDate ?? maskedValue);
    if (isoDate && isoDate >= minimumDate && isoDate <= today) {
      const selectedParts = isoParts(isoDate);
      setVisibleMonth({ year: selectedParts.year, month: selectedParts.month });
    }
  }

  function selectYear(year: number) {
    const minimumMonth = year === minimumParts.year ? minimumParts.month : 0;
    const maximumMonth = year === todayParts.year ? todayParts.month : 11;
    setVisibleMonth((current) => ({ year, month: Math.min(Math.max(current.month, minimumMonth), maximumMonth) }));
  }

  function selectMonth(month: number) {
    setVisibleMonth((current) => ({ ...current, month }));
  }

  const monthLabel = monthFormatter.format(new Date(Date.UTC(visibleMonth.year, visibleMonth.month, 1)));

  return (
    <div className="relative" ref={containerRef}>
      <input name="birthDate" readOnly type="hidden" value={submittedValue} />
      <input
        aria-describedby={describedBy}
        aria-invalid={invalid}
        autoComplete="bday"
        className={`${inputClassName} pr-14`}
        id="profile-birth-date"
        inputMode="numeric"
        maxLength={10}
        onChange={(event) => handleTextChange(event.currentTarget.value)}
        placeholder="DD/MM/AAAA"
        type="text"
        value={displayValue}
      />
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Abrir calendário da data de nascimento"
        className="focus-ring absolute right-2 bottom-2 grid size-10 place-items-center rounded-full text-black/55 hover:bg-domary-yellow hover:text-domary-black"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <CalendarIcon />
      </button>

      {open ? (
        <div aria-label="Escolher data de nascimento" className="absolute right-0 z-40 mt-2 w-full rounded-3xl border border-black/10 bg-white p-3 text-black shadow-2xl sm:w-[21rem]" role="dialog">
          <div className="flex items-center justify-between gap-2 rounded-2xl bg-domary-black px-2 py-2 text-white">
            <p aria-live="polite" className="sr-only capitalize">{monthLabel}</p>
            <div className="flex min-w-0 flex-1 gap-1.5">
              <select
                aria-label="Mês"
                className="focus-ring min-w-0 flex-1 appearance-none rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white capitalize"
                onChange={(event) => selectMonth(Number(event.currentTarget.value))}
                value={visibleMonth.month}
              >
                {monthNames.map((monthName, month) => {
                  const optionKey = visibleMonth.year * 12 + month;
                  return <option className="bg-domary-black text-white" disabled={optionKey < minimumMonthKey || optionKey > maximumMonthKey} key={monthName} value={month}>{monthName}</option>;
                })}
              </select>
              <select aria-label="Ano" className="focus-ring w-20 appearance-none rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-black text-white" onChange={(event) => selectYear(Number(event.currentTarget.value))} value={visibleMonth.year}>
                {years.map((year) => <option className="bg-domary-black text-white" key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div className="flex gap-1">
              <button aria-label="Mês anterior" className="focus-ring grid size-9 place-items-center rounded-full hover:bg-domary-yellow hover:text-domary-black disabled:cursor-not-allowed disabled:opacity-30" disabled={currentMonthKey <= minimumMonthKey} onClick={() => setVisibleMonth((current) => shiftMonth(current, -1))} type="button"><ChevronIcon direction="previous" /></button>
              <button aria-label="Próximo mês" className="focus-ring grid size-9 place-items-center rounded-full hover:bg-domary-yellow hover:text-domary-black disabled:cursor-not-allowed disabled:opacity-30" disabled={currentMonthKey >= maximumMonthKey} onClick={() => setVisibleMonth((current) => shiftMonth(current, 1))} type="button"><ChevronIcon direction="next" /></button>
            </div>
          </div>

          <div aria-hidden="true" className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-black text-black/40">
            {weekDays.map((weekDay, index) => <span key={`${weekDay}-${index}`}>{weekDay}</span>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) return <span aria-hidden="true" className="aspect-square" key={`empty-${index}`} />;
              const isoDate = `${visibleMonth.year}-${String(visibleMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const disabled = isoDate < minimumDate || isoDate > today;
              const selected = submittedValue === isoDate;
              const isToday = isoDate === today;
              return (
                <button
                  aria-current={isToday ? "date" : undefined}
                  aria-label={dateFormatter.format(new Date(`${isoDate}T00:00:00.000Z`))}
                  className={`focus-ring aspect-square rounded-full text-xs font-bold transition ${selected ? "bg-domary-yellow text-domary-black" : isToday ? "ring-1 ring-domary-yellow hover:bg-domary-yellow/20" : "hover:bg-domary-yellow/20"} disabled:cursor-not-allowed disabled:opacity-20`}
                  disabled={disabled}
                  key={isoDate}
                  onClick={() => selectDate(isoDate)}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-black/8 pt-3">
            <button className="focus-ring rounded-full px-3 py-2 text-xs font-black hover:bg-black/[0.04]" onClick={() => { setDisplayValue(""); setSubmittedValue(""); setOpen(false); }} type="button">Limpar</button>
            <button className="focus-ring rounded-full bg-domary-yellow px-4 py-2 text-xs font-black text-domary-black" onClick={() => selectDate(today)} type="button">Hoje</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
