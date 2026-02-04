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
  discounts: Record<string, number>;
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
  const [availableDirty, setAvailableDirty] = useState(false);
  const [hoverRange, setHoverRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [discounts, setDiscounts] = useState<Record<string, string>>({
    '4': '',
    '5': '',
    '6': '',
    '7': '',
  });
  const [inputCost, setInputCost] = useState('');
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
  const discountValues = data?.discounts ?? {};

  const cells = useMemo(() => buildCalendar(monthDate), [monthDate]);

  useEffect(() => {
    if (data?.defaultCost != null) {
      setDefaultCostInput(String(data.defaultCost));
    }
  }, [data?.defaultCost]);

  useEffect(() => {
    const next = {
      '4': discountValues['4'] != null ? String(discountValues['4']) : '',
      '5': discountValues['5'] != null ? String(discountValues['5']) : '',
      '6': discountValues['6'] != null ? String(discountValues['6']) : '',
      '7': discountValues['7'] != null ? String(discountValues['7']) : '',
    };

    const same =
      discounts['4'] === next['4'] &&
      discounts['5'] === next['5'] &&
      discounts['6'] === next['6'] &&
      discounts['7'] === next['7'];

    if (!same) {
      setDiscounts(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discountValues]);

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
    let total = 0;
    const dateCosts = Array.from(selected)
      .sort()
      .map((dateKey) => {
        const cost = prices[dateKey] ?? defaultCost;
        return { dateKey, cost };
      });

    dateCosts.forEach(({ cost }) => {
      total += cost;
    });

    const costLines: Array<{
      count: number;
      cost: number;
      total: number;
      start: string;
      end: string;
    }> = [];

    for (let i = 0; i < dateCosts.length; i += 1) {
      const current = dateCosts[i];
      let j = i;
      while (
        j + 1 < dateCosts.length &&
        dateCosts[j + 1].cost === current.cost
      ) {
        j += 1;
      }
      const count = j - i + 1;
      const lineTotal = current.cost * count;
      costLines.push({
        count,
        cost: current.cost,
        total: lineTotal,
        start: dateCosts[i].dateKey,
        end: dateCosts[j].dateKey,
      });
      i = j;
    }

    const discountMap: Record<number, number> = {
      4: Number(discountValues['4'] ?? 0),
      5: Number(discountValues['5'] ?? 0),
      6: Number(discountValues['6'] ?? 0),
      7: Number(discountValues['7'] ?? 0),
    };

    let discountedTotal = total;
    const discountLines: Array<{
      days: number;
      percent: number;
      amount: number;
      start: string;
      end: string;
    }> = [];
    let index = 0;

    const applyDiscountChunk = (days: number) => {
      const percent = Number.isFinite(discountMap[days]) ? discountMap[days] : 0;
      if (percent <= 0) return;
      const slice = dateCosts.slice(index, index + days);
      if (!slice.length) return;
      const chunkTotal = slice.reduce((sum, item) => sum + item.cost, 0);
      const amount = Math.round((chunkTotal * percent) / 100 * 100) / 100;
      discountedTotal -= amount;
      discountLines.push({
        days,
        percent,
        amount,
        start: slice[0].dateKey,
        end: slice[slice.length - 1].dateKey,
      });
    };

    let remaining = dateCosts.length;
    while (remaining >= 7) {
      applyDiscountChunk(7);
      index += 7;
      remaining -= 7;
    }
    if (remaining >= 4) {
      applyDiscountChunk(remaining);
      index += remaining;
      remaining = 0;
    }

    return {
      costLines,
      total,
      discountedTotal,
      discountLines,
    };
  }, [selected, prices, defaultCost, discountValues]);

  const selectedRange = useMemo(() => {
    if (!selected.size) return null;
    const dates = Array.from(selected).sort();
    return { start: dates[0], end: dates[dates.length - 1] };
  }, [selected]);

  const formatRangeDate = (value: string) => {
    const [y, m, d] = value.split('-');
    if (!y || !m || !d) return value;
    return `${d}-${m}-${y.slice(2)}`;
  };

  const isInHoverRange = (dateKey: string) => {
    if (!hoverRange) return false;
    return dateKey >= hoverRange.start && dateKey <= hoverRange.end;
  };

  useEffect(() => {
    if (!selected.size) {
      setInputCost('');
    }
  }, [selected]);

  useEffect(() => {
    if (!selected.size) {
      setAvailable(true);
      setAvailableDirty(false);
      return;
    }
    const hasUnavailable = Array.from(selected).some(
      (dateKey) => availability[dateKey] === false,
    );
    setAvailable(!hasUnavailable);
    setAvailableDirty(false);
  }, [selected, availability]);

  const applyCostToSelected = async () => {
    if (!selected.size) return;
    const costValue = inputCost.trim() === '' ? null : Number(inputCost);
    const costProvided = costValue !== null && Number.isFinite(costValue);
    if (!costProvided && !availableDirty) return;

    setSaving(true);
    try {
      await mutate();
      await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dates: Array.from(selected),
          ...(costProvided ? { cost: costValue } : {}),
          ...(availableDirty ? { available } : {}),
        }),
      });
      setSelected(new Set());
      setInputCost('');
      setRangeStart(null);
      setAvailableDirty(false);
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

  const saveDiscounts = async () => {
    const payload: Record<string, number> = {};
    ['4', '5', '6', '7'].forEach((key) => {
      const raw = discounts[key];
      const value = Number(raw);
      if (Number.isFinite(value)) {
        payload[key] = value;
      }
    });

    setSaving(true);
    try {
      await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discounts: payload,
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
    <div className="w-full px-2 sm:px-3 py-8 space-y-6">
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

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-stretch">
        <Card className="h-full">
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
                const inHover = isInHoverRange(key);
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
                    } ${inHover ? 'ring-2 ring-primary/50 shadow-[0_0_12px_rgba(99,102,241,0.35)]' : ''} cursor-pointer`}
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

        <div className="space-y-4 h-full">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{t.calendarSelectedTitle}</CardTitle>
              <div className="text-sm text-foreground/70">
                {selected.size} {t.calendarDaysLabel}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              {selected.size === 0 ? (
                <div className="text-sm text-foreground/70">
                  {t.calendarNoneSelected}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    {selectedCosts.costLines.map((line, idx) => (
                      <div
                        key={`${line.cost}-${line.count}-${idx}`}
                        className="grid grid-cols-[auto_1fr_auto] items-center text-sm gap-2"
                        onMouseEnter={() =>
                          setHoverRange({ start: line.start, end: line.end })
                        }
                        onMouseLeave={() => setHoverRange(null)}
                      >
                        <span className="cursor-default">
                          {line.count}{' '}
                          {line.count > 1
                            ? t.calendarDayPlural
                            : t.calendarDaySingular}
                        </span>
                        <span className="text-foreground/60 cursor-default text-center">
                          {formatRangeDate(line.start)} –{' '}
                          {formatRangeDate(line.end)}
                        </span>
                        <span className="cursor-default text-right">
                          €{line.cost} {t.calendarEach} • €{line.total}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 space-y-2">
                    <div className="flex justify-between font-semibold">
                      <span>{t.calendarTotal}</span>
                      <span>€{selectedCosts.total}</span>
                    </div>
                    {selectedCosts.discountLines.length ? (
                      <div className="space-y-1 text-sm">
                        {selectedCosts.discountLines.map((line, idx) => (
                          <div
                            key={`${line.days}-${idx}`}
                            className="grid grid-cols-[auto_1fr_auto] items-center gap-2"
                            onMouseEnter={() =>
                              setHoverRange({ start: line.start, end: line.end })
                            }
                            onMouseLeave={() => setHoverRange(null)}
                          >
                            <span className="cursor-default">
                              {line.days}{' '}
                              {line.days > 1
                                ? t.calendarDayPlural
                                : t.calendarDaySingular}{' '}
                              {line.percent}% {t.calendarDiscountLabel}
                            </span>
                            <span className="text-foreground/60 cursor-default text-center">
                              {formatRangeDate(line.start)} –{' '}
                              {formatRangeDate(line.end)}
                            </span>
                            <span className="cursor-default text-right">
                              -€{line.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {selectedCosts.discountLines.length ? (
                      <>
                        <div className="flex justify-between font-semibold mb-2">
                          <span>{t.calendarTotalAfterDiscount}</span>
                          <span>€{selectedCosts.discountedTotal}</span>
                        </div>
                        <hr className="border-foreground/20 my-2" />
                      </>
                    ) : null}
                  </div>
                </>
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
                      onCheckedChange={(value) => {
                        setAvailable(value === true);
                        setAvailableDirty(true);
                      }}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.calendarDiscountTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['4', '5', '6', '7'].map((dayKey) => (
              <div key={dayKey} className="flex items-center gap-2">
                <div className="w-16 text-sm text-foreground/70">
                  {dayKey} {t.calendarDayPlural}
                </div>
                <Input
                  type="number"
                  value={discounts[dayKey] ?? ''}
                  onChange={(e) =>
                    setDiscounts((prev) => ({
                      ...prev,
                      [dayKey]: e.target.value,
                    }))
                  }
                />
                <span className="text-sm text-foreground/70">%</span>
              </div>
            ))}
            <Button
              onClick={saveDiscounts}
              disabled={saving}
              className="cursor-pointer w-full"
            >
              {t.calendarSave}
            </Button>
          </CardContent>
        </Card>

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
