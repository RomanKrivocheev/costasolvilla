'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type CalendarResponse = {
  year: string;
  defaultCost: number;
  prices: Record<string, number>;
  availability: Record<string, boolean>;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const formatYearKey = (date: Date) => String(date.getFullYear());

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const buildCalendar = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const mondayIndex = (first.getDay() + 6) % 7;
  const cells: Array<Date | null> = [];

  for (let i = 0; i < mondayIndex; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
};

const AdminCalendarPage = () => {
  const { t, lang, setLang } = useLanguage();
  const [monthDate, setMonthDate] = useState(new Date());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [available, setAvailable] = useState(true);
  const [inputCost, setInputCost] = useState('100');
  const [defaultCostInput, setDefaultCostInput] = useState('100');
  const [saving, setSaving] = useState(false);

  const yearKey = useMemo(() => formatYearKey(monthDate), [monthDate]);
  const { data, mutate } = useSWR<CalendarResponse>(
    `/api/admin/calendar?year=${yearKey}`,
    fetcher,
  );

  const prices = data?.prices ?? {};
  const availability = data?.availability ?? {};
  const defaultCost = data?.defaultCost ?? 100;

  const cells = useMemo(() => buildCalendar(monthDate), [monthDate]);

  useEffect(() => {
    if (data?.defaultCost != null) {
      setDefaultCostInput(String(data.defaultCost));
    }
  }, [data?.defaultCost]);

  useEffect(() => {
    setSelected(new Set());
    setRangeStart(null);
  }, [yearKey, monthDate]);

  const selectRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return new Set<string>();
    }
    const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const next = new Set<string>();
    const cursor = new Date(from);
    while (cursor <= to) {
      next.add(formatDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return next;
  };

  const toggleDate = (dateKey: string) => {
    if (!rangeStart) {
      setRangeStart(dateKey);
      setSelected(new Set([dateKey]));
      return;
    }

    const nextSelected = selectRange(rangeStart, dateKey);
    setSelected(nextSelected);
    setRangeStart(null);
  };

  const selectedCosts = useMemo(() => {
    const groups = new Map<number, number>();
    let total = 0;
    selected.forEach((dateKey) => {
      const cost = prices[dateKey] ?? defaultCost;
      total += cost;
      groups.set(cost, (groups.get(cost) ?? 0) + 1);
    });
    const ordered = Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
    return { groups: ordered, total };
  }, [selected, prices, defaultCost]);

  useEffect(() => {
    if (!selected.size) {
      setInputCost('');
      return;
    }
    setInputCost(String(selectedCosts.total));
  }, [selected, selectedCosts.total]);

  useEffect(() => {
    if (!selected.size) {
      setAvailable(true);
      return;
    }
    const hasUnavailable = Array.from(selected).some(
      (dateKey) => availability[dateKey] === false,
    );
    setAvailable(!hasUnavailable);
  }, [selected, availability]);

  const applyCostToSelected = async () => {
    if (!selected.size) return;
    const value = Number(inputCost);
    if (!Number.isFinite(value)) return;

    setSaving(true);
    try {
      await mutate();
      await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: Array.from(selected),
          cost: value,
          available,
        }),
      });
      setSelected(new Set());
      setRangeStart(null);
      await mutate();
    } finally {
      setSaving(false);
    }
  };

  const saveDefaultCost = async () => {
    const value = Number(defaultCostInput);
    if (!Number.isFinite(value)) return;

    setSaving(true);
    try {
      await mutate();
      await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultCost: value,
        }),
      });
      await mutate();
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = useMemo(() => {
    const monthName =
      t.calendarMonths?.[monthDate.getMonth()] ??
      monthDate.toLocaleString(undefined, { month: 'long' });
    return `${monthName} ${monthDate.getFullYear()}`;
  }, [monthDate, t]);

  const dayLabels = [
    t.calendarMon,
    t.calendarTue,
    t.calendarWed,
    t.calendarThu,
    t.calendarFri,
    t.calendarSat,
    t.calendarSun,
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-2xl font-semibold">{t.calendarTitle}</div>
        <div className="hidden lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="cursor-pointer">
                {t.labelLanguage}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setLang('es')}
                className={`cursor-pointer ${
                  lang === 'es' ? 'bg-foreground/10' : ''
                }`}
              >
                Español
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLang('en')}
                className={`cursor-pointer ${
                  lang === 'en' ? 'bg-foreground/10' : ''
                }`}
              >
                English
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLang('ru')}
                className={`cursor-pointer ${
                  lang === 'ru' ? 'bg-foreground/10' : ''
                }`}
              >
                Русский
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.calendarAvailabilityTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() =>
                  setMonthDate(
                    new Date(
                      monthDate.getFullYear(),
                      monthDate.getMonth() - 1,
                      1,
                    ),
                  )
                }
                aria-label={t.calendarPrev}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[180px] text-center font-medium">
                {monthLabel}
              </div>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() =>
                  setMonthDate(
                    new Date(
                      monthDate.getFullYear(),
                      monthDate.getMonth() + 1,
                      1,
                    ),
                  )
                }
                aria-label={t.calendarNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-xs text-foreground/60 mb-2">
              {dayLabels.map((label) => (
                <div key={label} className="text-center">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {cells.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-16" />;
                }
                const key = formatDateKey(date);
                const selectedDay = selected.has(key);
                const cost = prices[key];
                const isAvailable = availability[key] !== false;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDate(key)}
                    className={`h-16 rounded-md border text-sm transition-colors ${
                      selectedDay
                        ? 'border-primary bg-primary/10'
                        : isAvailable
                          ? 'border-foreground/10 hover:border-primary/40 hover:bg-foreground/5'
                          : 'border-foreground/10 bg-foreground/5 text-foreground/40'
                    } cursor-pointer`}
                  >
                    <div className="font-medium">{date.getDate()}</div>
                    <div className="text-[11px] text-foreground/70">
                      €{cost ?? defaultCost}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.calendarDefaultTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-foreground/70">
                {t.calendarCurrentLabel} €{defaultCost}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={defaultCostInput}
                  onChange={(e) => setDefaultCostInput(e.target.value)}
                />
                <Button
                  onClick={saveDefaultCost}
                  disabled={saving}
                  className="cursor-pointer"
                >
                  {t.calendarSave}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.calendarSelectedTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected.size === 0 ? (
                <div className="text-sm text-foreground/70">
                  {t.calendarNoneSelected}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCosts.groups.map(([cost, count]) => (
                    <div
                      key={`${cost}-${count}`}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {count}{' '}
                        {count > 1
                          ? t.calendarDayPlural
                          : t.calendarDaySingular}{' '}
                        €{cost * count} (€{cost} {t.calendarEach})
                      </span>
                      <span>€{cost * count}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold">
                    <span>{t.calendarTotal}</span>
                    <span>€{selectedCosts.total}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="number"
                  value={inputCost}
                  onChange={(e) => setInputCost(e.target.value)}
                  placeholder={t.calendarCostPlaceholder}
                  disabled={!selected.size}
                />
                <div className="flex flex-col items-center justify-center px-2">
                  <span className="text-xs text-foreground/70">
                    {t.calendarAvailableLabel}
                  </span>
                  <div className="mt-1">
                    <Checkbox
                      checked={available}
                      onCheckedChange={(value) =>
                        setAvailable(value === true)
                      }
                      className="cursor-pointer"
                      disabled={!selected.size}
                    />
                  </div>
                </div>
                <Button
                  onClick={applyCostToSelected}
                  disabled={saving || !selected.size}
                  className="cursor-pointer"
                >
                  {t.calendarApply}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-center lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="cursor-pointer">
              {t.labelLanguage}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setLang('es')}
              className={`cursor-pointer ${
                lang === 'es' ? 'bg-foreground/10' : ''
              }`}
            >
              Español
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLang('en')}
              className={`cursor-pointer ${
                lang === 'en' ? 'bg-foreground/10' : ''
              }`}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setLang('ru')}
              className={`cursor-pointer ${
                lang === 'ru' ? 'bg-foreground/10' : ''
              }`}
            >
              Русский
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default AdminCalendarPage;
