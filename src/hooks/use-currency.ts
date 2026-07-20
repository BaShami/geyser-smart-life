import { useEffect, useState } from "react";

// Static rate — labeled "≈" in UI to signal it's an estimate.
const ZAR_PER_USD = 18.3;

export type Currency = "ZAR" | "USD";

export type Pricing = {
  currency: Currency;
  install: string;
  monthly: string;
  approx: boolean;
};

const ZAR_INSTALL_AMOUNT = 1999;
const ZAR_MONTHLY_AMOUNT = 49;

function formatUSD(zar: number) {
  const usd = zar / ZAR_PER_USD;
  // round install to nearest $5, monthly to nearest $1
  if (usd >= 20) {
    const rounded = Math.round(usd / 5) * 5;
    return `$${rounded}`;
  }
  return `$${Math.max(1, Math.round(usd))}`;
}

const ZAR_PRICING: Pricing = {
  currency: "ZAR",
  install: "R1,999",
  monthly: "R49",
  approx: false,
};

const USD_PRICING: Pricing = {
  currency: "USD",
  install: `≈ ${formatUSD(ZAR_INSTALL_AMOUNT)}`,
  monthly: `≈ ${formatUSD(ZAR_MONTHLY_AMOUNT)}`,
  approx: true,
};

export function useCurrency(): Pricing {
  const [pricing, setPricing] = useState<Pricing>(ZAR_PRICING);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { cache: "force-cache" });
        if (!res.ok) return;
        const data = (await res.json()) as { country_code?: string };
        if (cancelled) return;
        if (data?.country_code && data.country_code.toUpperCase() !== "ZA") {
          setPricing(USD_PRICING);
        }
      } catch {
        // fall back to ZAR
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return pricing;
}
