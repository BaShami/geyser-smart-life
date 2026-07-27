import { useEffect, useRef, useState } from "react";
import { X, ArrowRight, Check, MessageCircle } from "lucide-react";
import { saveLead, track, getSessionId } from "@/lib/session";
import { DEVICES, type DeviceId, type CountryCode, pricingFor, COUNTRY_PRICING } from "@/lib/pricing";

const WA_NUMBER = "27744224646";
const wa = (text: string) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

export const DRAWER_STATE_KEY = "gb_drawer_state_v1";

type Step = "contact" | "location" | "details" | "done";

type PersistedState = {
  open: boolean;
  device: DeviceId | null;
  step: Step;
  leadId: string | null;
  shortId: string | null;
  contactMode: "phone" | "email";
  phone: string;
  email: string;
  name: string;
  city: string;
  owns: string | null;
  hasWifi: boolean | null;
};

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAWER_STATE_KEY);
    return raw ? (JSON.parse(raw) as PersistedState) : null;
  } catch {
    return null;
  }
}

function savePersisted(state: PersistedState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAWER_STATE_KEY, JSON.stringify(state));
  } catch {}
}

function clearPersisted() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAWER_STATE_KEY);
  } catch {}
}

type Props = {
  open: boolean;
  onClose: () => void;
  device: DeviceId | null;
  country: CountryCode;
};

const OWNS_OPTIONS = [
  { id: "own", label: "Own" },
  { id: "rent", label: "Rent" },
];

export function LeadDrawer({ open, onClose, device, country }: Props) {
  const [step, setStep] = useState<Step>("contact");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [shortId, setShortId] = useState<string | null>(null);

  // form state
  const [contactMode, setContactMode] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [owns, setOwns] = useState<string | null>(null);
  const [hasWifi, setHasWifi] = useState<boolean | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openedForDeviceRef = useRef<string | null>(null);
  const inputStartedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // On open: hydrate from persisted state (same device) OR initialize new lead
  useEffect(() => {
    if (!open || !device) return;
    if (openedForDeviceRef.current === device) return;
    openedForDeviceRef.current = device;
    setError(null);
    inputStartedRef.current = false;

    const persisted = loadPersisted();
    if (persisted && persisted.device === device && persisted.leadId) {
      // Restore
      setStep(persisted.step);
      setLeadId(persisted.leadId);
      setShortId(persisted.shortId);
      setContactMode(persisted.contactMode);
      setPhone(persisted.phone);
      setEmail(persisted.email);
      setName(persisted.name);
      setCity(persisted.city);
      setOwns(persisted.owns);
      setHasWifi(persisted.hasWifi);
      track({
        event_name: "drawer_resumed",
        funnel_step: persisted.step,
        selected_device: device,
        country,
        lead_id: persisted.leadId,
      });
      setTimeout(() => inputRef.current?.focus(), 200);
      return;
    }

    // Fresh open
    setStep("contact");
    setLeadId(null);
    setShortId(null);
    setPhone("");
    setEmail("");
    setName("");
    setCity("");
    setOwns(null);
    setHasWifi(null);
    track({
      event_name: "device_selected",
      funnel_step: "device",
      selected_device: device,
      country,
      metadata: { session_id: getSessionId() },
    });
    (async () => {
      const { id, short } = await saveLead({
        device_interests: [device],
        country,
        current_step: "contact",
        last_completed_step: "device",
        lead_status: "device_selected",
      });
      setLeadId(id);
      setShortId(short);
      track({
        event_name: "contact_step_viewed",
        funnel_step: "contact",
        selected_device: device,
        country,
        lead_id: id,
      });
    })();
    setTimeout(() => inputRef.current?.focus(), 200);
  }, [open, device, country]);

  useEffect(() => {
    if (!open) openedForDeviceRef.current = null;
  }, [open]);

  // Persist state to localStorage on every change
  useEffect(() => {
    if (!open || !device) return;
    savePersisted({
      open,
      device,
      step,
      leadId,
      shortId,
      contactMode,
      phone,
      email,
      name,
      city,
      owns,
      hasWifi,
    });
  }, [open, device, step, leadId, shortId, contactMode, phone, email, name, city, owns, hasWifi]);

  const isValidPhone = phone.replace(/\D/g, "").length >= 9;
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const contactValid = contactMode === "phone" ? isValidPhone : isValidEmail;

  function trackInputStartedOnce() {
    if (inputStartedRef.current) return;
    inputStartedRef.current = true;
    track({
      event_name: "contact_input_started",
      funnel_step: "contact",
      selected_device: device,
      country,
      lead_id: leadId,
      metadata: { method: contactMode },
    });
  }

  async function submitContact() {
    if (!contactValid || saving) return;
    setSaving(true);
    setError(null);
    const patch =
      contactMode === "phone"
        ? { phone: phone.trim(), current_step: "location", last_completed_step: "contact", lead_status: "contact_captured" }
        : { email: email.trim(), current_step: "location", last_completed_step: "contact", lead_status: "contact_captured" };
    const { id, short } = await saveLead(patch);
    if (id) {
      setLeadId(id);
      setShortId(short);
    }
    setSaving(false);
    track({
      event_name: "contact_captured",
      funnel_step: "contact",
      selected_device: device,
      country,
      lead_id: id,
      metadata: { method: contactMode },
    });
    setStep("location");
    track({
      event_name: "location_step_viewed",
      funnel_step: "location",
      selected_device: device,
      country,
      lead_id: id,
    });
  }

  async function submitLocation() {
    if (saving) return;
    setSaving(true);
    await saveLead({
      city: city.trim() || null,
      name: name.trim() || null,
      current_step: "details",
      last_completed_step: "location",
      lead_status: "location_captured",
    });
    setSaving(false);
    track({
      event_name: "location_captured",
      funnel_step: "location",
      selected_device: device,
      country,
      lead_id: leadId,
    });
    setStep("details");
    track({
      event_name: "details_step_viewed",
      funnel_step: "details",
      selected_device: device,
      country,
      lead_id: leadId,
    });
  }

  async function skipLocation() {
    if (saving) return;
    setSaving(true);
    await saveLead({
      current_step: "details",
      last_completed_step: "location",
      lead_status: "location_skipped",
    });
    setSaving(false);
    track({
      event_name: "location_skipped",
      funnel_step: "location",
      selected_device: device,
      country,
      lead_id: leadId,
    });
    setStep("details");
    track({
      event_name: "details_step_viewed",
      funnel_step: "details",
      selected_device: device,
      country,
      lead_id: leadId,
    });
  }

  async function submitDetails() {
    if (saving) return;
    setSaving(true);
    await saveLead({
      owns_or_rents: owns,
      has_wifi: hasWifi,
      current_step: "done",
      last_completed_step: "details",
      lead_status: "details_captured",
    });
    setSaving(false);
    track({
      event_name: "details_captured",
      funnel_step: "details",
      selected_device: device,
      country,
      lead_id: leadId,
    });
    setStep("done");
  }

  const price = pricingFor(country);
  const deviceLabel = DEVICES.find((d) => d.id === device)?.label ?? "smart control";
  const waMessage = `Hi, I'm ${name || "a visitor"} from ${city || COUNTRY_PRICING[country].label}. I'd like ${deviceLabel} with HomeChat. Ref: ${shortId ?? "web"}`;

  function openWhatsApp() {
    track({
      event_name: "whatsapp_clicked",
      funnel_step: "handoff",
      selected_device: device,
      country,
      lead_id: leadId,
    });
    saveLead({ lead_status: "whatsapp_clicked" });
    clearPersisted();
  }

  function handleClose() {
    track({
      event_name: "flow_closed",
      funnel_step: step,
      selected_device: device,
      country,
      lead_id: leadId,
    });
    if (step === "done") clearPersisted();
    else if (device) {
      // Mark closed but keep progress so refresh can restore intent explicitly
      savePersisted({
        open: false,
        device,
        step,
        leadId,
        shortId,
        contactMode,
        phone,
        email,
        name,
        city,
        owns,
        hasWifi,
      });
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />
      <div className="relative w-full sm:max-w-md bg-card text-foreground rounded-t-3xl sm:rounded-3xl shadow-float overflow-hidden max-h-[92svh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {price.label} · {deviceLabel}
            </div>
            <div className="text-sm font-medium truncate">
              {step === "contact" && "Where should we send your price?"}
              {step === "location" && "A little about you"}
              {step === "details" && "Two quick questions"}
              {step === "done" && "You're all set"}
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-9 h-9 rounded-full hover:bg-secondary flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {step === "contact" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pick one — we'll send your price and installation details.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setContactMode("phone")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm border ${
                    contactMode === "phone"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground"
                  }`}
                >
                  WhatsApp number
                </button>
                <button
                  onClick={() => setContactMode("email")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm border ${
                    contactMode === "email"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-foreground"
                  }`}
                >
                  Email
                </button>
              </div>
              {contactMode === "phone" ? (
                <input
                  ref={inputRef}
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="e.g. +27 72 000 0000"
                  value={phone}
                  onChange={(e) => {
                    trackInputStartedOnce();
                    setPhone(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-border px-4 py-3 text-base bg-background"
                />
              ) : (
                <input
                  ref={inputRef}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    trackInputStartedOnce();
                    setEmail(e.target.value);
                  }}
                  className="w-full rounded-2xl border border-border px-4 py-3 text-base bg-background"
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                We only use this to contact you about your HomeChat setup.
              </p>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                onClick={submitContact}
                disabled={!contactValid || saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "location" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Your name (optional)</label>
                <input
                  type="text"
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border px-4 py-3 text-base bg-background"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">City or suburb</label>
                <input
                  type="text"
                  autoComplete="address-level2"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border px-4 py-3 text-base bg-background"
                  placeholder="e.g. Sandton"
                />
              </div>
              <button
                onClick={submitLocation}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={skipLocation}
                disabled={saving}
                className="w-full text-xs text-muted-foreground underline disabled:opacity-50"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === "details" && (
            <div className="space-y-5">
              <div>
                <div className="text-xs text-muted-foreground mb-2">Do you own or rent?</div>
                <div className="flex gap-2">
                  {OWNS_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setOwns(o.id)}
                      className={`flex-1 rounded-full px-4 py-2 text-sm border ${
                        owns === o.id ? "bg-primary text-primary-foreground border-primary" : "border-border"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-2">Wi-Fi at home?</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHasWifi(true)}
                    className={`flex-1 rounded-full px-4 py-2 text-sm border ${
                      hasWifi === true ? "bg-primary text-primary-foreground border-primary" : "border-border"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setHasWifi(false)}
                    className={`flex-1 rounded-full px-4 py-2 text-sm border ${
                      hasWifi === false ? "bg-primary text-primary-foreground border-primary" : "border-border"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
              <button
                onClick={submitDetails}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium disabled:opacity-50"
              >
                See my price <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-border/60 p-4 bg-secondary/40">
                <div className="text-xs text-muted-foreground">Your price for {deviceLabel}</div>
                {price.quoteOnly ? (
                  <div className="mt-1 text-2xl font-medium">Get a local quote</div>
                ) : (
                  <>
                    <div className="mt-1 text-2xl font-medium">{price.upfront} installed</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      or {price.instalment} × {price.instalments} months (hardware & installation plan)
                    </div>
                  </>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3.5 h-3.5" /> Ref: {shortId ?? "—"}
                </div>
              </div>
              <a
                href={wa(waMessage)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={openWhatsApp}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white"
                style={{ backgroundColor: "#25D366" }}
              >
                <MessageCircle className="w-4 h-4" /> Continue on WhatsApp
              </a>
              <p className="text-[11px] text-muted-foreground text-center">
                Installation subject to installer coverage in your specific area.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
