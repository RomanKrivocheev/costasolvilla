'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/providers/language-provider';
import { dictionaries, type Lang } from '@/i18n/dictionaries';
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
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Font,
} from '@react-pdf/renderer';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

const LANGS: Lang[] = ['es', 'en', 'ru'];

const pdfStyles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: 'DejaVuSans',
    color: '#111111',
    lineHeight: 1.4,
  },
  content: {
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 6,
    textAlign: 'center',
  },
  infoLine: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 14,
  },
  heading: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 6,
  },
  listItem: {
    marginLeft: 10,
    marginBottom: 2,
  },
  divider: {
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  hr: {
    marginVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
});
Font.register({
  family: 'DejaVuSans',
  fonts: [
    { src: '/fonts/DejaVuSans.ttf', fontWeight: 400 },
    { src: '/fonts/DejaVuSans-Bold.ttf', fontWeight: 700 },
  ],
});

const pdfLocale: Record<Lang, string> = {
  es: 'es-ES',
  en: 'en-US',
  ru: 'ru-RU',
};

const formatPdfDate = (value: string, lang: Lang) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(pdfLocale[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};

type PdfTotals = {
  accommodation: number;
  cleaning: number;
  total: number;
  deposit: number;
  partialPayment: number;
  remainingBalance: number;
  paymentDate?: string;
  balanceDueDate?: string;
};

type PdfData = {
  startDate: string;
  endDate: string;
  nights: number;
  guests: number;
  mainGuest: string;
  totals: PdfTotals;
};

const ReservationPdf = ({
  languages,
  data,
}: {
  languages: Lang[];
  data: PdfData;
}) => {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.content}>
          <Text style={pdfStyles.title}>Costa Sol Villa</Text>
          <Text style={pdfStyles.infoLine}>{dictionaries.en.pdfAddress}</Text>
          <Text style={pdfStyles.infoLine}>{dictionaries.en.footerPhone}</Text>
          <Text style={pdfStyles.infoLine}>{dictionaries.en.footerEmail}</Text>
          <View style={pdfStyles.hr} />

          {languages.map((lang, index) => {
            const t = dictionaries[lang];
            return (
              <View key={lang} wrap={false}>
                <View style={pdfStyles.section}>
                  <Text style={pdfStyles.paragraph}>
                    {t.pdfReservationIntro} {t.pdfFromLabel}{' '}
                    {formatPdfDate(data.startDate, lang)} ({t.pdfCheckInLabel}){' '}
                    {t.pdfToLabel} {formatPdfDate(data.endDate, lang)} (
                    {t.pdfCheckOutLabel}), {t.pdfTotalNightsLabel}{' '}
                    {data.nights} {t.pdfNightsLabel}.
                  </Text>
                  <Text style={pdfStyles.paragraph}>
                    {t.pdfGuestsLabel} {data.guests} {t.pdfPersonsLabel}.
                  </Text>
                  <Text style={pdfStyles.paragraph}>
                    {t.pdfMainGuestLabel} {data.mainGuest}.
                  </Text>
                </View>

                <View style={pdfStyles.section}>
                  <Text style={pdfStyles.heading}>
                    {t.pdfPriceBreakdownLabel}
                  </Text>
                  <Text style={pdfStyles.listItem}>
                    • {t.pdfAccommodationPrice}: €{data.totals.accommodation}
                  </Text>
                  <Text style={pdfStyles.listItem}>
                    • {t.pdfCleaningFee}: €{data.totals.cleaning}
                  </Text>
                  <Text style={pdfStyles.listItem}>
                    • {t.pdfTotalAmount}: €{data.totals.total}
                  </Text>
                </View>

                <View style={pdfStyles.section}>
                  <Text style={pdfStyles.paragraph}>
                    {t.pdfSecurityDepositLine.replace(
                      '{deposit}',
                      `€${data.totals.deposit}`,
                    )}
                  </Text>
                  <Text style={pdfStyles.paragraph}>
                    {t.pdfPartialPaymentLine.replace(
                      '{amount}',
                      `€${data.totals.partialPayment}`,
                    )}{' '}
                    {data.totals.paymentDate
                      ? `(${t.pdfPaymentDateLabel} ${formatPdfDate(
                          data.totals.paymentDate,
                          lang,
                        )})`
                      : `(${t.pdfNotProvided})`}
                  </Text>
                  <Text style={pdfStyles.paragraph}>
                    {t.pdfRemainingBalanceLine.replace(
                      '{amount}',
                      `€${data.totals.remainingBalance}`,
                    )}{' '}
                    {data.totals.balanceDueDate
                      ? `${t.pdfBalanceDueLabel} ${formatPdfDate(
                          data.totals.balanceDueDate,
                          lang,
                        )}.`
                      : `${t.pdfBalanceDueLabel} ${t.pdfNotProvided}.`}
                  </Text>
                </View>

                {index < languages.length - 1 ? (
                  <View style={pdfStyles.hr} />
                ) : null}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
};

const AdminCalendarPage = () => {
  const { t, lang, setLang } = useLanguage();
  const searchParams = useSearchParams();
  const urlAppliedRef = useRef(false);
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
  const [cleaningCostInput, setCleaningCostInput] = useState('0');
  const [securityDepositInput, setSecurityDepositInput] = useState('0');
  const [saving, setSaving] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfFullName, setPdfFullName] = useState('');
  const [pdfEmail, setPdfEmail] = useState('');
  const [pdfPhone, setPdfPhone] = useState('');
  const [pdfAdults, setPdfAdults] = useState('1');
  const [pdfKids, setPdfKids] = useState('0');
  const [pdfBabies, setPdfBabies] = useState('0');
  const [pdfPartialPayment, setPdfPartialPayment] = useState('');
  const [pdfPartialPaymentDate, setPdfPartialPaymentDate] = useState('');
  const [pdfBalanceDueDate, setPdfBalanceDueDate] = useState('');
  const [pdfLanguages, setPdfLanguages] = useState<Set<Lang>>(new Set());

  const yearKey = useMemo(() => formatYearKey(monthDate), [monthDate]);
  const { data, mutate } = useSWR<CalendarResponse>(
    `/api/admin/calendar?year=${yearKey}`,
    fetcher,
  );

  const prices = data?.prices ?? {};
  const availability = data?.availability ?? {};
  const defaultCost = data?.defaultCost ?? 100;
  const cleaningCost = data?.cleaningCost ?? 0;
  const securityDeposit = data?.securityDeposit ?? 0;
  const discountValues = data?.discounts ?? {};

  const cells = useMemo(() => buildCalendar(monthDate), [monthDate]);

  useEffect(() => {
    if (data?.defaultCost != null) {
      setDefaultCostInput(String(data.defaultCost));
    }
  }, [data?.defaultCost]);

  useEffect(() => {
    if (data?.cleaningCost != null) {
      setCleaningCostInput(String(data.cleaningCost));
    }
  }, [data?.cleaningCost]);

  useEffect(() => {
    if (data?.securityDeposit != null) {
      setSecurityDepositInput(String(data.securityDeposit));
    }
  }, [data?.securityDeposit]);

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
  }, [yearKey]);


  useEffect(() => {
    if (urlAppliedRef.current) return;
    if (!searchParams) return;

    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');
    const adults = searchParams.get('adults');
    const kids = searchParams.get('kids');
    const babies = searchParams.get('babies');

    if (!start || !end) return;
    urlAppliedRef.current = true;

    setSelected(selectRange(start, end));
    setRangeStart(null);
    setPdfFullName(name ?? '');
    setPdfEmail(email ?? '');
    setPdfPhone(phone ?? '');
    if (adults) setPdfAdults(adults);
    if (kids) setPdfKids(kids);
    if (babies) setPdfBabies(babies);

    setPdfOpen(true);
  }, [searchParams]);

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
      if (selected.size === 1 && selected.has(dateKey)) {
        setSelected(new Set());
        setRangeStart(null);
        return;
      }
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

    const finalTotal = discountedTotal + cleaningCost;

    return {
      costLines,
      total,
      discountedTotal,
      finalTotal,
      discountLines,
    };
  }, [selected, prices, defaultCost, discountValues, cleaningCost]);

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

  const saveBaseCosts = async () => {
    const defaultValue = Number(defaultCostInput);
    const cleaningValue = Number(cleaningCostInput);
    const depositValue = Number(securityDepositInput);
    if (
      !Number.isFinite(defaultValue) ||
      !Number.isFinite(cleaningValue) ||
      !Number.isFinite(depositValue)
    ) {
      return;
    }

    setSaving(true);
    try {
      await mutate();
      await fetch('/api/admin/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultCost: defaultValue,
          cleaningCost: cleaningValue,
          securityDeposit: depositValue,
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

  const pdfCanGenerate =
    selected.size > 0 &&
    pdfFullName.trim().length > 0 &&
    pdfEmail.trim().length > 0 &&
    pdfPhone.trim().length > 0 &&
    Number(pdfAdults || 0) >= 1 &&
    pdfLanguages.size > 0;

  const pdfLanguagesList = useMemo(
    () => Array.from(pdfLanguages),
    [pdfLanguages],
  );

  const pdfData = useMemo(() => {
    const nights = selected.size;
    const startDate = selectedRange?.start ?? '';
    const endDate = selectedRange?.end ?? '';
    const guests =
      Number(pdfAdults || 0) + Number(pdfKids || 0) + Number(pdfBabies || 0);
    const partialPayment = Number(pdfPartialPayment || 0);
    const total = selectedCosts.finalTotal;
    const remainingBalance = Math.max(total - partialPayment, 0);

    return {
      startDate,
      endDate,
      nights,
      guests,
      mainGuest: pdfFullName.trim(),
      totals: {
        accommodation: selectedCosts.total,
        cleaning: cleaningCost,
        total,
        deposit: securityDeposit,
        partialPayment,
        remainingBalance,
        paymentDate: pdfPartialPaymentDate || undefined,
        balanceDueDate: pdfBalanceDueDate || undefined,
      },
    } satisfies PdfData;
  }, [
    selected,
    selectedRange,
    pdfAdults,
    pdfKids,
    pdfBabies,
    pdfPartialPayment,
    pdfFullName,
    selectedCosts,
    cleaningCost,
    securityDeposit,
    pdfPartialPaymentDate,
    pdfBalanceDueDate,
  ]);

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
                      <span>{t.calendarSubtotalLabel}</span>
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

              <Dialog open={pdfOpen} onOpenChange={setPdfOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="cursor-pointer w-full mt-4"
                    variant="secondary"
                    disabled={!selected.size}
                  >
                    {t.calendarPdfButton}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[94vw] sm:max-w-[1200px] max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t.calendarPdfTitle}</DialogTitle>
                  </DialogHeader>

                  <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
                    <div className="space-y-3">
                      <div className="text-base font-semibold">
                        {t.calendarPdfGuestTitle}
                      </div>
                      <Input
                        type="text"
                        value={pdfFullName}
                        onChange={(e) => setPdfFullName(e.target.value)}
                        placeholder={t.bookingNamePlaceholder}
                      />
                      <Input
                        type="email"
                        value={pdfEmail}
                        onChange={(e) => setPdfEmail(e.target.value)}
                        placeholder={t.bookingEmailPlaceholder}
                      />
                      <Input
                        type="tel"
                        value={pdfPhone}
                        onChange={(e) => setPdfPhone(e.target.value)}
                        placeholder={t.bookingPhonePlaceholder}
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={pdfAdults}
                          onChange={(e) => setPdfAdults(e.target.value)}
                          placeholder={t.bookingAdultsPlaceholder}
                        />
                        <Input
                          type="number"
                          min="0"
                          value={pdfKids}
                          onChange={(e) => setPdfKids(e.target.value)}
                          placeholder={t.bookingKidsPlaceholder}
                        />
                        <Input
                          type="number"
                          min="0"
                          value={pdfBabies}
                          onChange={(e) => setPdfBabies(e.target.value)}
                          placeholder={t.bookingBabiesPlaceholder}
                        />
                      </div>

                      <div className="text-base font-semibold pt-2">
                        {t.calendarPdfPaymentTitle}
                      </div>
                      <Input
                        type="number"
                        value={pdfPartialPayment}
                        onChange={(e) => setPdfPartialPayment(e.target.value)}
                        placeholder={t.calendarPdfPartialPayment}
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <span className="text-sm text-foreground/70">
                          {t.calendarPdfPaymentDate}
                        </span>
                        <Input
                          type="date"
                          value={pdfPartialPaymentDate}
                          onChange={(e) =>
                            setPdfPartialPaymentDate(e.target.value)
                          }
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <span className="text-sm text-foreground/70">
                          {t.calendarPdfBalanceDate}
                        </span>
                        <Input
                          type="date"
                          value={pdfBalanceDueDate}
                          onChange={(e) => setPdfBalanceDueDate(e.target.value)}
                        />
                      </div>

                      <div className="text-base font-semibold pt-2">
                        {t.calendarPdfLanguagesTitle}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {LANGS.map((lng) => (
                          <label
                            key={lng}
                            className="flex items-center gap-2 text-sm cursor-pointer"
                          >
                            <Checkbox
                              checked={pdfLanguages.has(lng)}
                              onCheckedChange={(value) => {
                                setPdfLanguages((prev) => {
                                  const next = new Set(prev);
                                  if (value === true) next.add(lng);
                                  else next.delete(lng);
                                  return next;
                                });
                              }}
                            />
                            <span>{lng.toUpperCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-base font-semibold">
                        {t.bookingOverviewTitle}
                      </div>
                      {selectedCosts.costLines.map((line, idx) => (
                        <div
                          key={`pdf-preview-${line.cost}-${idx}`}
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
                                key={`pdf-preview-discount-${idx}`}
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
                          <div className="flex justify-between font-semibold">
                            <span>{t.calendarTotalDiscountLabel}</span>
                            <span>
                              -€
                              {selectedCosts.discountLines.reduce(
                                (sum, line) => sum + line.amount,
                                0,
                              )}
                            </span>
                          </div>
                        </>
                      ) : null}
                      <div className="flex justify-between font-semibold">
                        <span>{t.calendarCleaningCostLabel}</span>
                        <span>€{cleaningCost}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-xl">
                        <span>{t.calendarTotalLabel}</span>
                        <span>€{selectedCosts.finalTotal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="ghost" className="cursor-pointer">
                        {t.dialogClose}
                      </Button>
                    </DialogClose>
                    <div className="pointer-events-auto">
                      {pdfCanGenerate ? (
                        <PDFDownloadLink
                          document={
                            <ReservationPdf
                              languages={pdfLanguagesList}
                              data={pdfData}
                            />
                          }
                          fileName="reservation.pdf"
                        >
                          {({ loading }) => (
                            <Button
                              className="cursor-pointer"
                              disabled={loading}
                            >
                              {loading
                                ? t.calendarPdfGenerating
                                : t.calendarPdfGenerate}
                            </Button>
                          )}
                        </PDFDownloadLink>
                      ) : (
                        <Button className="cursor-pointer" disabled>
                          {t.calendarPdfGenerate}
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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
            </div>
            <div className="text-sm text-foreground/70">
              {t.calendarCleaningCostLabel}: €{cleaningCost}
            </div>
            <Input
              type="number"
              value={cleaningCostInput}
              onChange={(e) => setCleaningCostInput(e.target.value)}
            />
            <div className="text-sm text-foreground/70">
              {t.calendarSecurityDepositLabel}: €{securityDeposit}
            </div>
            <Input
              type="number"
              value={securityDepositInput}
              onChange={(e) => setSecurityDepositInput(e.target.value)}
            />
            <Button
              onClick={saveBaseCosts}
              disabled={saving}
              className="cursor-pointer w-full"
            >
              {t.calendarSave}
            </Button>
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
