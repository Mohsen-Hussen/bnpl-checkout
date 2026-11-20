export interface CartItem {
  sku: string;
  name: string;
  variant: string;
  /** Unit price in halalas. */
  price: number;
  quantity: number;
}

/** Demo cart for the fictional merchant shown on the checkout page. */
export const demoCart: CartItem[] = [
  {
    sku: "TRD-200",
    name: "Smart treadmill T200",
    variant: "Graphite",
    price: 3_499_00,
    quantity: 1,
  },
  {
    sku: "DMB-024",
    name: "Adjustable dumbbells",
    variant: "2 × 24 kg",
    price: 1_150_00,
    quantity: 1,
  },
  { sku: "MAT-006", name: "Training mat", variant: "6 mm", price: 129_00, quantity: 2 },
];

export const VAT_RATE = 0.15;

export interface CartTotals {
  subtotal: number;
  vat: number;
  total: number;
}

export function cartTotals(items: CartItem[]): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vat = Math.round(subtotal * VAT_RATE);
  return { subtotal, vat, total: subtotal + vat };
}
