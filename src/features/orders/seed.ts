import type { PlanId } from "../installments/plans";
import type { Order, OrderStatus } from "./types";

/** Small deterministic PRNG so the demo data (and tests) are stable. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const firstNames = [
  "Abdullah",
  "Sara",
  "Faisal",
  "Noura",
  "Omar",
  "Reem",
  "Khalid",
  "Lama",
  "Yousef",
  "Hessa",
];
const lastNames = [
  "Al-Harbi",
  "Al-Qahtani",
  "Al-Otaibi",
  "Al-Shehri",
  "Al-Ghamdi",
  "Al-Dosari",
  "Al-Mutairi",
];
const planIds: PlanId[] = ["pay-in-4", "pay-in-4", "pay-in-4", "6-months", "6-months", "12-months"];

export function seedOrders(count = 80, now: Date = new Date(), seed = 42): Order[] {
  const random = mulberry32(seed);
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)];

  return Array.from({ length: count }, (_, index) => {
    const planId = pick(planIds);
    const amount =
      planId === "pay-in-4"
        ? Math.round((150 + random() * 2_800) * 100)
        : Math.round((1_500 + random() * 9_000) * 100);
    const roll = random();
    const status: OrderStatus = roll < 0.82 ? "approved" : roll < 0.94 ? "declined" : "refunded";
    const daysAgo = Math.floor(random() * 14);
    const createdAt = new Date(now.getTime() - daysAgo * 86_400_000 - random() * 36_000_000);

    return {
      id: `QS-${String(100_000 + index * 37).padStart(6, "0")}`,
      createdAt: createdAt.toISOString(),
      customerName: `${pick(firstNames)} ${pick(lastNames)}`,
      planId,
      amount,
      status,
      ...(status === "declined" ? { declineReason: "Debt-burden ratio above limit" } : {}),
    };
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
