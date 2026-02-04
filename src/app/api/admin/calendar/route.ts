import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { kv } from '@vercel/kv';
import { hasAdminSession } from '@/lib/admin-auth';

const DEFAULT_COST_KEY = 'calendar:defaultCost';

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

    return NextResponse.json({ year, defaultCost, prices, availability });
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
    };

    const tasks: Array<Promise<unknown>> = [];

    if (typeof body.defaultCost === 'number') {
      tasks.push(kv.set(DEFAULT_COST_KEY, body.defaultCost));
    }

    if (Array.isArray(body.dates) && typeof body.cost === 'number') {
      for (const date of body.dates) {
        tasks.push(
          kv.set(buildDateKey(date), {
            cost: body.cost,
            available:
              typeof body.available === 'boolean' ? body.available : true,
          }),
        );
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
