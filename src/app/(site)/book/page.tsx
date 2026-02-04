'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/providers/language-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type CalendarResponse = {
  year: string;
  defaultCost: number;
  cleaningCost: number;
  securityDeposit: number;
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

const BookPage = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(new Date());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [hoverRange, setHoverRange] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [adults, setAdults] = useState('');
  const [kids, setKids] = useState('');
  const [babies, setBabies] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const yearKey = useMemo(() => formatYearKey(monthDate), [monthDate]);
  const { data, mutate } = useSWR<CalendarResponse>(
    `/api/admin/calendar?year=${yearKey}`,
    fetcher,
  );

  const prices = data?.prices ?? {};
  const availability = data?.availability ?? {};
  const defaultCost = data?.defaultCost ?? 100;
  const cleaningCost = data?.cleaningCost ?? 0;
  const discountValues = data?.discounts ?? {};

  const cells = useMemo(() => buildCalendar(monthDate), [monthDate]);

  const setMonthWithYearCheck = (nextDate: Date) => {
    if (nextDate.getFullYear() !== monthDate.getFullYear()) {
      setSelected(new Set());
      setRangeStart(null);
      setHoverRange(null);
    }
    setMonthDate(nextDate);
  };

  const selectRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return new Set<string>();
    }
    const [from, to] =
      startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
    const next = new Set<string>();
    const cursor = new Date(from);
    while (cursor <= to) {
      next.add(formatDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return next;
  };

  const toggleDate = (dateKey: string) => {
    if (selected.size === 1 && selected.has(dateKey)) {
      setSelected(new Set());
      setRangeStart(null);
      return;
    }
    if (availability[dateKey] === false) {
      toast({ description: t.bookingUnavailableToast });
      return;
    }
    if (!rangeStart) {
      setRangeStart(dateKey);
      setSelected(new Set([dateKey]));
      return;
    }

    const nextSelected = selectRange(rangeStart, dateKey);
    const hasUnavailable = Array.from(nextSelected).some(
      (key) => availability[key] === false,
    );
    if (hasUnavailable) {
      toast({ description: t.bookingUnavailableToast });
      return;
    }
    setSelected(nextSelected);
    setRangeStart(null);
  };

  const formatRangeDate = (value: string) => {
    const [y, m, d] = value.split('-');
    if (!y || !m || !d) return value;
    return `${d}-${m}-${y.slice(2)}`;
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
      const percent = Number.isFinite(discountMap[days])
        ? discountMap[days]
        : 0;
      if (percent <= 0) return;
      const slice = dateCosts.slice(index, index + days);
      if (!slice.length) return;
      const chunkTotal = slice.reduce((sum, item) => sum + item.cost, 0);
      const amount = Math.round(((chunkTotal * percent) / 100) * 100) / 100;
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

    const finalTotal = discountedTotal + cleaningCost;

    return {
      costLines,
      total,
      discountedTotal,
      finalTotal,
      discountLines,
    };
  }, [selected, prices, defaultCost, discountValues, cleaningCost]);

  const nextDiscountInfo = useMemo(() => {
    const count = selected.size;
    if (count === 0) return null;

    let needed = 0;
    let targetCount = 0;
    const remainder = count % 7;

    if (count < 4) {
      targetCount = 4;
      needed = 4 - count;
    } else if (count < 7) {
      targetCount = count + 1;
      needed = 1;
    } else {
      if (remainder === 0) {
        targetCount = 4;
        needed = 4;
      } else if (remainder < 4) {
        targetCount = 4;
        needed = 4 - remainder;
      } else {
        targetCount = remainder + 1;
        needed = 1;
      }
    }

    if (!needed || !targetCount) return null;
    const percent = Number(discountValues[String(targetCount)] ?? 0);
    if (!Number.isFinite(percent) || percent <= 0) return null;

    const dayCosts = Array.from(selected)
      .sort()
      .map((dateKey) => prices[dateKey] ?? defaultCost);
    const avgCost =
      dayCosts.length > 0
        ? dayCosts.reduce((sum, v) => sum + v, 0) / dayCosts.length
        : defaultCost;

    const calculateTotalDiscount = (days: number) => {
      let discountTotal = 0;
      let idx = 0;
      let remainingDays = days;
      const costFor = (i: number) =>
        i < dayCosts.length ? dayCosts[i] : avgCost;

      const applyChunk = (chunk: number, percentValue: number) => {
        if (percentValue <= 0) return;
        let chunkTotal = 0;
        for (let i = 0; i < chunk; i += 1) {
          chunkTotal += costFor(idx + i);
        }
        discountTotal += chunkTotal * (percentValue / 100);
        idx += chunk;
        remainingDays -= chunk;
      };

      while (remainingDays >= 7) {
        applyChunk(7, Number(discountValues['7'] ?? 0));
      }
      if (remainingDays >= 4) {
        applyChunk(
          remainingDays,
          Number(discountValues[String(remainingDays)] ?? 0),
        );
      }

      return Math.round(discountTotal * 100) / 100;
    };

    const currentDiscount = calculateTotalDiscount(count);
    const nextDiscount = calculateTotalDiscount(count + needed);

    return {
      needed,
      percent,
      totalDiscount: Math.round(nextDiscount * 100) / 100,
      extra: count >= 7,
    };
  }, [selected, prices, defaultCost, discountValues]);

  const dayLabels = [
    t.calendarMon,
    t.calendarTue,
    t.calendarWed,
    t.calendarThu,
    t.calendarFri,
    t.calendarSat,
    t.calendarSun,
  ];

  const monthLabel = useMemo(() => {
    const monthName =
      t.calendarMonths?.[monthDate.getMonth()] ??
      monthDate.toLocaleString(undefined, { month: 'long' });
    return `${monthName} ${monthDate.getFullYear()}`;
  }, [monthDate, t]);

  const canBook = selected.size >= 3;
  const isEmailValid = /^\S+@\S+\.\S+$/.test(email);
  const canSubmit =
    isEmailValid &&
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    Number(adults || 0) >= 1;
  const [sending, setSending] = useState(false);

  const isInHoverRange = (dateKey: string) => {
    if (!hoverRange) return false;
    return dateKey >= hoverRange.start && dateKey <= hoverRange.end;
  };

  const selectedRange = useMemo(() => {
    if (!selected.size) return null;
    const dates = Array.from(selected).sort();
    return { start: dates[0], end: dates[dates.length - 1] };
  }, [selected]);

  const submitBooking = async () => {
    if (!canSubmit) {
      toast({ description: t.bookingFillRequiredToast });
      return;
    }
    setSending(true);
    try {
      await mutate();

      const totalDiscount = selectedCosts.discountLines.reduce(
        (sum, line) => sum + line.amount,
        0,
      );
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          guests: {
            adults: adults ? Number(adults) : 0,
            kids: kids ? Number(kids) : 0,
            babies: babies ? Number(babies) : 0,
          },
          summary: {
            costLines: selectedCosts.costLines,
            discountLines: selectedCosts.discountLines,
            totals: {
              subtotal: selectedCosts.total,
              totalDiscount,
              cleaningCost,
              totalAfterDiscount: selectedCosts.finalTotal,
            },
          },
          dateRange: selectedRange,
        }),
      });

      if (!res.ok) {
        toast({
          description: `${t.bookingSendError} ${t.bookingSendErrorCta}`,
        });
        setSending(false);
        return;
      }
      setDialogOpen(false);
      setSuccessOpen(true);
    } catch {
      toast({
        description: `${t.bookingSendError} ${t.bookingSendErrorCta}`,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full px-2 sm:px-3 space-y-6">
      <div className="text-2xl font-semibold">{t.bookingTitle}</div>

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
                  setMonthWithYearCheck(
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
                  setMonthWithYearCheck(
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
                      className="grid grid-cols-[1fr_auto_1fr] items-center text-sm gap-2"
                      onMouseEnter={() =>
                        setHoverRange({ start: line.start, end: line.end })
                      }
                      onMouseLeave={() => setHoverRange(null)}
                    >
                      <span className="cursor-default text-left">
                        {line.count}{' '}
                        {line.count > 1
                          ? t.calendarDayPlural
                          : t.calendarDaySingular}
                      </span>
                      <span className="text-foreground/60 cursor-default text-center justify-self-center">
                        {formatRangeDate(line.start)} –{' '}
                        {formatRangeDate(line.end)}
                      </span>
                      <span className="cursor-default text-right">
                        €{line.cost} {t.calendarEach} • €{line.total}
                      </span>
                    </div>
                  ))}
                </div>

                {nextDiscountInfo ? (
                  <div className="mt-3 text-sm font-semibold text-primary space-y-1">
                    {selected.size > 7 && selectedCosts.discountLines.length ? (
                      <div>
                        {t.bookingCurrentDiscountLabel} -€
                        {selectedCosts.discountLines.reduce(
                          (sum, line) => sum + line.amount,
                          0,
                        )}
                      </div>
                    ) : null}
                    <div>
                      {t.bookingNextDiscountPrefix} {nextDiscountInfo.needed}{' '}
                      {nextDiscountInfo.needed > 1
                        ? t.calendarDayPlural
                        : t.calendarDaySingular}{' '}
                      {t.bookingNextDiscountToHave}{' '}
                      {nextDiscountInfo.extra ? t.bookingNextDiscountExtra : ''}
                      {nextDiscountInfo.extra ? ' ' : ''}
                      {nextDiscountInfo.percent}% {t.bookingNextDiscountLabel}{' '}
                      {t.bookingNextDiscountTotalPrefix} -€
                      {nextDiscountInfo.totalDiscount}
                    </div>
                  </div>
                ) : null}

                <div className="mt-auto pt-4 space-y-2">
                  <div className="flex justify-between font-semibold">
                    <span>{t.calendarSubtotalLabel}</span>
                    <span>€{selectedCosts.total}</span>
                  </div>
                  {selectedCosts.discountLines.length ? (
                    <div className="space-y-1 text-sm">
                      {selectedCosts.discountLines.map((line, idx) => (
                        <div
                          key={`${line.days}-${idx}`}
                          className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
                          onMouseEnter={() =>
                            setHoverRange({ start: line.start, end: line.end })
                          }
                          onMouseLeave={() => setHoverRange(null)}
                        >
                          <span className="cursor-default text-left">
                            {line.days}{' '}
                            {line.days > 1
                              ? t.calendarDayPlural
                              : t.calendarDaySingular}{' '}
                            {line.percent}% {t.calendarDiscountLabel}
                          </span>
                          <span className="text-foreground/60 cursor-default text-center justify-self-center">
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
                      <div className="flex justify-between font-semibold mb-1">
                        <span>{t.calendarTotalDiscountLabel}</span>
                        <span>
                          -€
                          {selectedCosts.discountLines.reduce(
                            (sum, line) => sum + line.amount,
                            0,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>{t.calendarCleaningCostLabel}</span>
                        <span>€{cleaningCost}</span>
                      </div>
                      <div className="flex justify-between font-semibold mb-2 text-xl">
                        <span>{t.calendarTotalLabel}</span>
                        <span>€{selectedCosts.finalTotal}</span>
                      </div>
                      <hr className="border-foreground/20 my-2" />
                    </>
                  ) : null}
                </div>
              </>
            )}

            <div className="mt-4">
              <div className="relative inline-block w-full">
                {!canBook ? (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xs text-foreground/70">
                    {t.bookingMinTooltip}
                  </div>
                ) : null}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full cursor-pointer"
                      disabled={!canBook}
                    >
                      {t.bookingProceedCta}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[94vw] sm:max-w-[1300px]">
                    <DialogHeader>
                      <DialogTitle className="text-center text-xl">
                        {t.bookingDialogTitle}
                      </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
                      <div className="space-y-3">
                        <div className="text-base font-semibold text-center">
                          {t.bookingPersonalInfoTitle}
                        </div>
                        <Input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t.bookingNamePlaceholder}
                        />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.bookingEmailPlaceholder}
                        />
                        <Input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t.bookingPhonePlaceholder}
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={adults}
                            onChange={(e) => setAdults(e.target.value)}
                            placeholder={t.bookingAdultsPlaceholder}
                          />
                          <Input
                            type="number"
                            min="0"
                            value={kids}
                            onChange={(e) => setKids(e.target.value)}
                            placeholder={t.bookingKidsPlaceholder}
                          />
                          <Input
                            type="number"
                            min="0"
                            value={babies}
                            onChange={(e) => setBabies(e.target.value)}
                            placeholder={t.bookingBabiesPlaceholder}
                          />
                        </div>
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t.bookingMessagePlaceholder}
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-base font-semibold text-center">
                          {t.bookingOverviewTitle}
                        </div>
                        {selectedCosts.costLines.map((line, idx) => (
                          <div
                            key={`summary-${line.cost}-${idx}`}
                            className="grid grid-cols-[1fr_auto_1fr] items-center text-sm gap-2"
                          >
                            <span className="text-left">
                              {line.count}{' '}
                              {line.count > 1
                                ? t.calendarDayPlural
                                : t.calendarDaySingular}
                            </span>
                            <span className="text-center text-foreground/60">
                              {formatRangeDate(line.start)} –{' '}
                              {formatRangeDate(line.end)}
                            </span>
                            <span className="text-right">
                              €{line.cost} {t.calendarEach} • €{line.total}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between font-semibold">
                          <span>{t.calendarSubtotalLabel}</span>
                          <span>€{selectedCosts.total}</span>
                        </div>
                        {selectedCosts.discountLines.length ? (
                          <>
                            <div className="space-y-1 text-sm">
                              {selectedCosts.discountLines.map((line, idx) => (
                                <div
                                  key={`summary-discount-${idx}`}
                                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
                                >
                                  <span className="text-left">
                                    {line.days}{' '}
                                    {line.days > 1
                                      ? t.calendarDayPlural
                                      : t.calendarDaySingular}{' '}
                                    {line.percent}% {t.calendarDiscountLabel}
                                  </span>
                                  <span className="text-center text-foreground/60">
                                    {formatRangeDate(line.start)} –{' '}
                                    {formatRangeDate(line.end)}
                                  </span>
                                  <span className="text-right">
                                    -€{line.amount}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between font-semibold mb-1">
                              <span>{t.calendarTotalDiscountLabel}</span>
                              <span>
                                -€
                                {selectedCosts.discountLines.reduce(
                                  (sum, line) => sum + line.amount,
                                  0,
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between font-semibold mb-1">
                              <span>{t.calendarCleaningCostLabel}</span>
                              <span>€{cleaningCost}</span>
                            </div>
                            <div className="flex justify-between font-semibold text-xl">
                              <span>{t.calendarTotalLabel}</span>
                              <span>€{selectedCosts.finalTotal}</span>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <Button
                        className="cursor-pointer px-8"
                        disabled={sending}
                        onClick={submitBooking}
                      >
                        {t.bookingCta}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog
                  open={successOpen}
                  onOpenChange={(open) => {
                    setSuccessOpen(open);
                    if (!open) {
                      router.push('/home');
                    }
                  }}
                >
                  <DialogContent className="w-[92vw] max-w-lg text-center">
                    <DialogHeader>
                      <DialogTitle className="text-xl">
                        {t.bookingSuccessTitle}
                      </DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-foreground/80">
                      {t.bookingSuccessMessage}
                    </p>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t.bookingDiscountsTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-foreground/70">
            {t.bookingDiscountsIntro}
          </p>
          <div>
            <div className="text-sm font-semibold">
              {t.bookingDiscountsInfoTitle}
            </div>
            <p className="text-sm text-foreground/70 mt-1">
              {t.bookingDiscountsInfoText}{' '}
              <span className="font-semibold">{t.footerPhone}</span>
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.bookingDiscountsDays}</TableHead>
                <TableHead>{t.bookingDiscountsPercent}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {['4', '5', '6', '7'].map((dayKey) => (
                <TableRow key={dayKey}>
                  <TableCell>
                    {dayKey} {t.calendarDayPlural}
                  </TableCell>
                  <TableCell>{discountValues[dayKey] ?? 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookPage;
