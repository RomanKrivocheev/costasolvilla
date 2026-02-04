import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { kv } from '@vercel/kv';
import { hasAdminSession } from '@/lib/admin-auth';

const DEFAULT_COST_KEY = 'calendar:defaultCost';
const DISCOUNTS_KEY = 'calendar:discounts';

const buildDateKey = (date: string) => `calendar:date:${date}`;

const getYearDates = (year: string) => {
  const yearNum = Number(year);
  const dates: string[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const monthStr = String(month).padStart(2, '0');
    const days = new Date(yearNum, month, 0).getDate();
    for (let day = 1; day <= days; day += 1) {
      const dayStr = String(day).padStart(2, '0');
      dates.push(`${year}-${monthStr}-${dayStr}`);
    }
  }
  return dates;
};

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    if (!year) {
      return NextResponse.json({ error: 'Missing year' }, { status: 400 });
    }

    const dates = getYearDates(year);
    const keys = dates.map(buildDateKey);
    const values = (await kv.mget(keys)) as Array<
      number | { cost?: number; available?: boolean } | null
    >;
    const defaultCost = (await kv.get<number>(DEFAULT_COST_KEY)) ?? 100;
    const discounts =
      (await kv.get<Record<string, number>>(DISCOUNTS_KEY)) ?? {};

    const prices: Record<string, number> = {};
    const availability: Record<string, boolean> = {};
    values.forEach((value, index) => {
      if (typeof value === 'number') {
        prices[dates[index]] = value;
        availability[dates[index]] = true;
        return;
      }
      if (value && typeof value === 'object') {
        if (typeof value.cost === 'number') {
          prices[dates[index]] = value.cost;
        }
        if (typeof value.available === 'boolean') {
          availability[dates[index]] = value.available;
        }
      }
    });

    return NextResponse.json({
      year,
      defaultCost,
      prices,
      availability,
      discounts,
    });
  } catch (error) {
    console.error('GET /api/admin/calendar failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
};

export const POST = async (req: Request) => {
  try {
    const cookieStore = await cookies();
    if (!hasAdminSession(cookieStore)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as {
      dates?: string[];
      cost?: number;
      available?: boolean;
      defaultCost?: number;
      discounts?: Record<string, number>;
    };

    const tasks: Array<Promise<unknown>> = [];

    if (typeof body.defaultCost === 'number') {
      tasks.push(kv.set(DEFAULT_COST_KEY, body.defaultCost));
    }
    if (body.discounts && typeof body.discounts === 'object') {
      tasks.push(kv.set(DISCOUNTS_KEY, body.discounts));
    }

    if (Array.isArray(body.dates) && body.dates.length) {
      const hasCost = typeof body.cost === 'number';
      const hasAvailability = typeof body.available === 'boolean';

      if (hasCost || hasAvailability) {
        let existing: Array<number | { cost?: number; available?: boolean } | null> =
          [];
        if (!hasCost && hasAvailability) {
          const keys = body.dates.map(buildDateKey);
          existing = (await kv.mget(keys)) as Array<
            number | { cost?: number; available?: boolean } | null
          >;
        }

        body.dates.forEach((date, index) => {
          let cost: number | undefined = undefined;
          if (hasCost) {
            cost = body.cost as number;
          } else if (existing[index] != null) {
            const current = existing[index];
            if (typeof current === 'number') cost = current;
            if (current && typeof current === 'object' && typeof current.cost === 'number') {
              cost = current.cost;
            }
          }

          const payload: { cost?: number; available?: boolean } = {};
          if (typeof cost === 'number') payload.cost = cost;
          if (hasAvailability) payload.available = body.available as boolean;

          tasks.push(kv.set(buildDateKey(date), payload));
        });
      }
    }

    await Promise.all(tasks);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/admin/calendar failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
};
