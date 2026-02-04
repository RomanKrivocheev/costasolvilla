import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;
const rateLimit = new Map<string, number[]>();

const getClientIp = (req: Request) => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return req.headers.get('x-real-ip') || 'unknown';
};

type BookingCostLine = {
  count: number;
  cost: number;
  total: number;
  start: string;
  end: string;
};

type BookingDiscountLine = {
  days: number;
  percent: number;
  amount: number;
  start: string;
  end: string;
};

type BookingPayload = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  guests?: {
    adults?: number;
    kids?: number;
    babies?: number;
  };
  summary: {
    costLines: BookingCostLine[];
    discountLines: BookingDiscountLine[];
    totals: {
      subtotal: number;
      totalDiscount: number;
      cleaningCost: number;
      totalAfterDiscount: number;
    };
  };
  dateRange?: {
    start?: string;
    end?: string;
  };
};

export const POST = async (req: Request) => {
  try {
    const ip = getClientIp(req);
    const now = Date.now();
    const attempts = rateLimit.get(ip) || [];
    const recent = attempts.filter((ts) => now - ts < WINDOW_MS);

    if (recent.length >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 },
      );
    }

    recent.push(now);
    rateLimit.set(ip, recent);

    const body = (await req.json()) as BookingPayload;
    if (
      !body?.name?.trim() ||
      !body?.email?.trim() ||
      !body?.phone?.trim() ||
      !body?.summary?.costLines?.length
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const ownerEmail = process.env.OWNER_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;
    if (!ownerEmail || !resendKey) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    const resend = new Resend(resendKey);

    const messageBlock = body.message?.trim()
      ? `<p><strong>Сообщение:</strong> ${body.message.trim()}</p>`
      : '<p><strong>Сообщение:</strong> (нет)</p>';

    const formatRuDate = (value: string) => {
      const [y, m, d] = value.split('-');
      if (!y || !m || !d) return value;
      return `${d}.${m}.${y.slice(2)}`;
    };

    const costRows = body.summary.costLines
      .map(
        (line) => `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;">
              ${line.count} дней
            </td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">
              ${formatRuDate(line.start)} – ${formatRuDate(line.end)}
            </td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">
              €${line.cost} за день • €${line.total}
            </td>
          </tr>
        `,
      )
      .join('');

    const discountRows = body.summary.discountLines
      .map(
        (line) => `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;">
              ${line.days} дней ${line.percent}% скидка
            </td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">
              ${formatRuDate(line.start)} – ${formatRuDate(line.end)}
            </td>
            <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">
              -€${line.amount}
            </td>
          </tr>
        `,
      )
      .join('');

    const totals = `
      <tr>
        <td style="padding:6px 8px;"><strong>Промежуточный итог</strong></td>
        <td></td>
        <td style="padding:6px 8px;text-align:right;"><strong>€${body.summary.totals.subtotal}</strong></td>
      </tr>
      <tr>
        <td style="padding:6px 8px;"><strong>Суммарная скидка</strong></td>
        <td></td>
        <td style="padding:6px 8px;text-align:right;"><strong>-€${body.summary.totals.totalDiscount}</strong></td>
      </tr>
      <tr>
        <td style="padding:6px 8px;"><strong>Уборка</strong></td>
        <td></td>
        <td style="padding:6px 8px;text-align:right;"><strong>€${body.summary.totals.cleaningCost}</strong></td>
      </tr>
      <tr>
        <td style="padding:6px 8px;"><strong>Итого</strong></td>
        <td></td>
        <td style="padding:6px 8px;text-align:right;"><strong>€${body.summary.totals.totalAfterDiscount}</strong></td>
      </tr>
    `;

    const guests = body.guests ?? {};
    const startDate = body.dateRange?.start ?? '';
    const endDate = body.dateRange?.end ?? '';

    const params = new URLSearchParams();
    if (startDate) params.set('start', startDate);
    if (endDate) params.set('end', endDate);
    if (body.name?.trim()) params.set('name', body.name.trim());
    if (body.email?.trim()) params.set('email', body.email.trim());
    if (body.phone?.trim()) params.set('phone', body.phone.trim());
    if (typeof guests.adults === 'number') {
      params.set('adults', String(guests.adults));
    }
    if (typeof guests.kids === 'number') {
      params.set('kids', String(guests.kids));
    }
    if (typeof guests.babies === 'number') {
      params.set('babies', String(guests.babies));
    }
    if (body.summary?.totals?.totalAfterDiscount != null) {
      params.set(
        'total',
        String(body.summary.totals.totalAfterDiscount),
      );
    }
    if (body.summary?.totals?.cleaningCost != null) {
      params.set('cleaning', String(body.summary.totals.cleaningCost));
    }

    const html = `
      <div style="font-family: Arial, sans-serif; color: #111;">
        <h2>Новый запрос на бронирование</h2>
        <p><strong>Имя:</strong> ${body.name.trim()}</p>
        <p><strong>Email:</strong> ${body.email.trim()}</p>
        <p><strong>Телефон:</strong> ${body.phone?.trim()}</p>
        <p><strong>Взрослые (18+):</strong> ${guests.adults ?? 0}</p>
        <p><strong>Дети (3–18):</strong> ${guests.kids ?? 0}</p>
        <p><strong>Младенцы (до 3):</strong> ${guests.babies ?? 0}</p>
        ${messageBlock}
        <h3>Детали бронирования</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr>
              <th style="text-align:left;padding:6px 8px;border-bottom:2px solid #eee;">Описание</th>
              <th style="text-align:center;padding:6px 8px;border-bottom:2px solid #eee;">Даты</th>
              <th style="text-align:right;padding:6px 8px;border-bottom:2px solid #eee;">Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${costRows}
            ${discountRows}
          </tbody>
          <tfoot>
            ${totals}
          </tfoot>
        </table>
        <div style="margin-top:16px;">
          <a
            href="https://costasolvilla.com/admin/calendar?${params.toString()}"
            style="display:inline-block;padding:10px 16px;background:#0b3d2e;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;"
          >
            Открыть календарь
          </a>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: 'Costa Sol Villa <onboarding@resend.dev>',
      to: ownerEmail,
      subject: 'Новый запрос на бронирование',
      html,
      replyTo: body.email.trim(),
    });

    if (error) {
      console.error('Resend error', error);
      return NextResponse.json({ error: 'Email failed' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('POST /api/book failed', {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
};
