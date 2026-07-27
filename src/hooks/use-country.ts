import { useEffect, useState } from "react";
import type { CountryCode } from "@/lib/pricing";

const STORAGE_KEY = "gb_country";

function normalize(code: string | undefined | null): CountryCode {
  const c = (code ?? "").toUpperCase();
  if (c === "ZA" || c === "ZW" || c === "ZM") return c;
  return "OTHER";
}

export function useCountry(): {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
  ready: boolean;
} {
  const [country, setCountryState] = useState<CountryCode>("ZA");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) {
      setCountryState(normalize(saved));
      setReady(true);
      return;
    }
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/", { cache: "force-cache" });
        if (!res.ok) throw new Error("geo");
        const data = (await res.json()) as { country_code?: string };
        if (cancelled) return;
        setCountryState(normalize(data?.country_code));
      } catch {
        // keep default
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCountry = (c: CountryCode) => {
    setCountryState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {}
  };

  return { country, setCountry, ready };
}
