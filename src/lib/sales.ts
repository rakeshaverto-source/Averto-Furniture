// Sales numbers for the admin dashboard. "Sales" means the value of orders placed (cancelled ones
// left out); "collected" is what has actually come in (online advance + balances marked received).
// Days are counted in Indian time.
import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Midnight (India) at the start of today, as a real instant
function startOfIndianToday(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS);
}

const isoDay = (instant: Date) => new Date(instant.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export interface DayPoint {
  day: string; // yyyy-mm-dd (India)
  sales: number;
  orders: number;
}

export interface Totals {
  sales: number;
  orders: number;
  collected: number;
}

async function totalsBetween(from: Date, to: Date): Promise<Totals> {
  const [row] = await prisma.$queryRaw<{ sales: bigint | null; orders: bigint; collected: bigint | null }[]>`
    SELECT
      SUM(total) AS sales,
      COUNT(*) AS orders,
      SUM(
        (CASE WHEN status = 'deposit_paid' THEN deposit ELSE 0 END)
        + (CASE WHEN "balancePaid" THEN total - (CASE WHEN status = 'deposit_paid' THEN deposit ELSE 0 END) ELSE 0 END)
      ) AS collected
    FROM orders
    WHERE fulfillment <> 'cancelled' AND "createdAt" >= ${from} AND "createdAt" < ${to}`;
  return { sales: Number(row?.sales ?? 0), orders: Number(row?.orders ?? 0), collected: Number(row?.collected ?? 0) };
}

// The last `days` whole days in India, ending tonight at midnight
function periodBounds(days: number) {
  const end = new Date(startOfIndianToday().getTime() + DAY_MS);
  const start = new Date(end.getTime() - days * DAY_MS);
  return { start, end, previousStart: new Date(start.getTime() - days * DAY_MS) };
}

// One point per day, including days without orders; optionally only orders that used a coupon
async function dailySales(start: Date, days: number, couponCode?: string): Promise<DayPoint[]> {
  const end = new Date(start.getTime() + days * DAY_MS);
  const rows = await prisma.$queryRaw<{ day: string; sales: bigint; orders: bigint }[]>`
    SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') AS day,
           SUM(total) AS sales, COUNT(*) AS orders
    FROM orders
    WHERE fulfillment <> 'cancelled' AND "createdAt" >= ${start} AND "createdAt" < ${end}
      ${couponCode ? Prisma.sql`AND "couponCode" = ${couponCode}` : Prisma.empty}
    GROUP BY 1`;
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: days }, (_, i) => {
    const day = isoDay(new Date(start.getTime() + i * DAY_MS));
    const row = byDay.get(day);
    return { day, sales: Number(row?.sales ?? 0), orders: Number(row?.orders ?? 0) };
  });
}

export async function getDashboard(days: RangeDays) {
  const { start, end, previousStart } = periodBounds(days);

  const [current, previous, daily, categoryRows, productRows] = await Promise.all([
    totalsBetween(start, end),
    totalsBetween(previousStart, start),
    dailySales(start, days),
    prisma.$queryRaw<{ name: string | null; sales: bigint }[]>`
      SELECT c.name, SUM(i.qty * i."unitPrice") AS sales
      FROM order_items i
      JOIN orders o ON o.id = i."orderId"
      LEFT JOIN products p ON p.id = i."productId"
      LEFT JOIN categories c ON c.id = p."categoryId"
      WHERE o.fulfillment <> 'cancelled' AND o."createdAt" >= ${start} AND o."createdAt" < ${end}
      GROUP BY c.name
      ORDER BY sales DESC`,
    prisma.$queryRaw<{ name: string; productId: string | null; qty: bigint; sales: bigint }[]>`
      SELECT i.name, i."productId", SUM(i.qty) AS qty, SUM(i.qty * i."unitPrice") AS sales
      FROM order_items i
      JOIN orders o ON o.id = i."orderId"
      WHERE o.fulfillment <> 'cancelled' AND o."createdAt" >= ${start} AND o."createdAt" < ${end}
      GROUP BY i.name, i."productId"
      ORDER BY sales DESC
      LIMIT 5`,
  ]);

  return {
    days,
    current,
    previous,
    daily,
    categories: categoryRows.map((r) => ({ name: r.name ?? "Removed products", sales: Number(r.sales) })),
    topProducts: productRows.map((r) => ({
      name: r.name,
      productId: r.productId,
      qty: Number(r.qty),
      sales: Number(r.sales),
    })),
  };
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export interface CouponPerformance {
  code: string;
  orders: number;
  customers: number; // different customer emails
  sales: number; // what those orders came to after the discount
  discount: number; // what the coupon gave away
}

// Every coupon used in the period, best first
export async function getCouponSales(days: RangeDays): Promise<CouponPerformance[]> {
  const { start, end } = periodBounds(days);
  const rows = await prisma.$queryRaw<
    { code: string; orders: bigint; customers: bigint; sales: bigint; discount: bigint }[]
  >`
    SELECT "couponCode" AS code, COUNT(*) AS orders, COUNT(DISTINCT lower("customerEmail")) AS customers,
           SUM(total) AS sales, SUM(discount) AS discount
    FROM orders
    WHERE "couponCode" IS NOT NULL AND fulfillment <> 'cancelled'
      AND "createdAt" >= ${start} AND "createdAt" < ${end}
    GROUP BY "couponCode"
    ORDER BY sales DESC`;
  return rows.map((r) => ({
    code: r.code,
    orders: Number(r.orders),
    customers: Number(r.customers),
    sales: Number(r.sales),
    discount: Number(r.discount),
  }));
}

// One coupon over the period and the one before it, day by day, with its latest orders
export async function getCouponDetail(code: string, days: RangeDays) {
  const { start, end, previousStart } = periodBounds(days);
  const totals = async (from: Date, to: Date) => {
    const [row] = await prisma.$queryRaw<
      { orders: bigint; customers: bigint; sales: bigint | null; discount: bigint | null }[]
    >`
      SELECT COUNT(*) AS orders, COUNT(DISTINCT lower("customerEmail")) AS customers,
             SUM(total) AS sales, SUM(discount) AS discount
      FROM orders
      WHERE "couponCode" = ${code} AND fulfillment <> 'cancelled'
        AND "createdAt" >= ${from} AND "createdAt" < ${to}`;
    return {
      orders: Number(row?.orders ?? 0),
      customers: Number(row?.customers ?? 0),
      sales: Number(row?.sales ?? 0),
      discount: Number(row?.discount ?? 0),
    };
  };

  const [current, previous, daily, recent, allTime] = await Promise.all([
    totals(start, end),
    totals(previousStart, start),
    dailySales(start, days, code),
    prisma.order.findMany({
      where: { couponCode: code },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        ref: true,
        customerName: true,
        customerEmail: true,
        total: true,
        discount: true,
        fulfillment: true,
        createdAt: true,
      },
    }),
    totals(new Date(0), end),
  ]);
  return { days, current, previous, daily, recent, allTime };
}
