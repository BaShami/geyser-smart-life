// Client-side session + UTM helpers. Safe in browser only.

const SESSION_KEY = "gb_session_id";
const FIRST_UTM_KEY = "gb_first_utm";
const LATEST_UTM_KEY = "gb_latest_utm";
const FIRST_UTM_EXPIRY_KEY = "gb_first_utm_exp";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type Utm = {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  term?: string | null;
  content?: string | null;
  referrer?: string | null;
  landing_path?: string | null;
  captured_at?: string;
};

function safeUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as { randomUUID: () => string }).randomUUID();
  }
  return `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = safeUuid();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function readUtmFromUrl(): Utm | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search);
  const source = p.get("utm_source");
  const medium = p.get("utm_medium");
  const campaign = p.get("utm_campaign");
  if (!source && !medium && !campaign) return null;
  return {
    source,
    medium,
    campaign,
    term: p.get("utm_term"),
    content: p.get("utm_content"),
    referrer: document.referrer || null,
    landing_path: window.location.pathname,
    captured_at: new Date().toISOString(),
  };
}

export function ensureUtmCapture(): { first: Utm | null; latest: Utm | null } {
  if (typeof window === "undefined") return { first: null, latest: null };
  const now = Date.now();
  const fresh = readUtmFromUrl();

  // Latest touch: always update if we saw a new one
  if (fresh) {
    localStorage.setItem(LATEST_UTM_KEY, JSON.stringify(fresh));
  }

  // First touch: only set if empty or expired (30d)
  const firstExp = Number(localStorage.getItem(FIRST_UTM_EXPIRY_KEY) || 0);
  const firstRaw = localStorage.getItem(FIRST_UTM_KEY);
  if (fresh && (!firstRaw || firstExp < now)) {
    localStorage.setItem(FIRST_UTM_KEY, JSON.stringify(fresh));
    localStorage.setItem(FIRST_UTM_EXPIRY_KEY, String(now + THIRTY_DAYS_MS));
  } else if (!firstRaw && !fresh && document.referrer) {
    // capture referrer even without UTMs
    const stub: Utm = {
      referrer: document.referrer,
      landing_path: window.location.pathname,
      captured_at: new Date().toISOString(),
    };
    localStorage.setItem(FIRST_UTM_KEY, JSON.stringify(stub));
    localStorage.setItem(LATEST_UTM_KEY, JSON.stringify(stub));
    localStorage.setItem(FIRST_UTM_EXPIRY_KEY, String(now + THIRTY_DAYS_MS));
  }

  const parse = (k: string): Utm | null => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? (JSON.parse(raw) as Utm) : null;
    } catch {
      return null;
    }
  };
  return { first: parse(FIRST_UTM_KEY), latest: parse(LATEST_UTM_KEY) };
}

export type TrackPayload = {
  event_name: string;
  funnel_step?: string;
  selected_device?: string | null;
  country?: string | null;
  metadata?: Record<string, unknown>;
  lead_id?: string | null;
};

export function track(payload: TrackPayload): void {
  if (typeof window === "undefined") return;
  const session_id = getSessionId();
  const { first, latest } = ensureUtmCapture();
  const body = JSON.stringify({
    ...payload,
    session_id,
    referrer: document.referrer || null,
    utm: latest ?? first ?? null,
  });
  try {
    const blob = new Blob([body], { type: "application/json" });
    if ("sendBeacon" in navigator) {
      navigator.sendBeacon("/api/track", blob);
      return;
    }
  } catch {}
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

export type LeadPatch = {
  device_interests?: string[];
  country?: string | null;
  city?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  owns_or_rents?: string | null;
  has_wifi?: boolean | null;
  current_step?: string | null;
  last_completed_step?: string | null;
  lead_status?: string | null;
  transcript?: unknown;
};

export async function saveLead(patch: LeadPatch): Promise<{ id: string | null; short: string | null }> {
  if (typeof window === "undefined") return { id: null, short: null };
  const session_id = getSessionId();
  const { first, latest } = ensureUtmCapture();
  try {
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id,
        patch,
        first_utm: first,
        latest_utm: latest,
        referrer: document.referrer || null,
      }),
    });
    if (!res.ok) return { id: null, short: null };
    const data = (await res.json()) as { id?: string };
    const id = data.id ?? null;
    const short = id ? id.slice(0, 8).toUpperCase() : null;
    return { id, short };
  } catch {
    return { id: null, short: null };
  }
}
