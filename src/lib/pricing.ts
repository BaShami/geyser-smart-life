export type CountryCode = "ZA" | "ZW" | "ZM" | "OTHER";

export type CountryPricing = {
  country: CountryCode;
  label: string;
  flag: string;
  operational: boolean;
  currency: string;
  upfront: string | null;
  instalment: string | null;
  instalments: number | null;
  quoteOnly?: boolean;
};

export const COUNTRY_PRICING: Record<CountryCode, CountryPricing> = {
  ZA: {
    country: "ZA",
    label: "South Africa",
    flag: "🇿🇦",
    operational: true,
    currency: "ZAR",
    upfront: "R1,999",
    instalment: "R500",
    instalments: 4,
  },
  ZW: {
    country: "ZW",
    label: "Zimbabwe",
    flag: "🇿🇼",
    operational: true,
    currency: "USD",
    upfront: "US$120",
    instalment: "US$30",
    instalments: 4,
  },
  ZM: {
    country: "ZM",
    label: "Zambia",
    flag: "🇿🇲",
    operational: true,
    currency: "ZMW",
    upfront: "K2,400",
    instalment: "K600",
    instalments: 4,
  },
  OTHER: {
    country: "OTHER",
    label: "Other",
    flag: "🌍",
    operational: false,
    currency: "",
    upfront: null,
    instalment: null,
    instalments: null,
    quoteOnly: true,
  },
};

export const AVAILABILITY_LINE =
  "Available in South Africa, Zimbabwe and Zambia. Installation is subject to installer coverage in your specific area.";

export function pricingFor(country: CountryCode): CountryPricing {
  return COUNTRY_PRICING[country] ?? COUNTRY_PRICING.OTHER;
}

export const DEVICES = [
  { id: "lights", icon: "💡", label: "Lights", status: "Available now" as const },
  { id: "geyser", icon: "🚿", label: "Geyser", status: "Available now" as const },
  { id: "plugs", icon: "🔌", label: "Plugs & appliances", status: "Available now" as const },
  { id: "gates", icon: "🚪", label: "Gates & security", status: "Custom assessment" as const },
];

export type DeviceId = (typeof DEVICES)[number]["id"];
