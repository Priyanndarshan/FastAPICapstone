export const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("default", { month: "short" })
);

export const MONTH_NAMES_FULL = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("default", { month: "long" })
);

export const PAYMENT_MODES = ["UPI", "CASH"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const BRAND_COLOR = "#4863D4";
export const BRAND_COLOR_HOVER = "#3a50b8";
export const BRAND_COLOR_LIGHT = "#e8ecfc";
