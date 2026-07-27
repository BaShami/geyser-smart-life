import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  MessageCircle,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Menu,
  X,
  MessagesSquare,
  Clock,
  Gauge,
} from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import reactionVideo from "@/assets/reaction.mp4.asset.json";
import logoAsset from "@/assets/geyserbrain-logo.png";
import { LeadDrawer, DRAWER_STATE_KEY } from "@/components/LeadDrawer";
import { QualifyChat } from "@/components/QualifyChat";
import { useCountry } from "@/hooks/use-country";
import {
  COUNTRY_PRICING,
  DEVICES,
  AVAILABILITY_LINE,
  pricingFor,
  type CountryCode,
  type DeviceId,
} from "@/lib/pricing";
import { track, getSessionId, ensureUtmCapture } from "@/lib/session";

const WA_NUMBER = "27744224646";
const wa = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
const WA_HELLO = "Hi HomeChat — I'd like to talk about smart home control.";

const faqs = [
  {
    q: "What can HomeChat control right now?",
    a: "Smart lights, smart geyser control, and smart plugs & appliances are available now. Gates & security are fitted after a short custom assessment of what you already have.",
  },
  {
    q: "What exactly gets installed?",
    a: "A small smart controller that a certified electrician wires in (usually behind your switch, geyser isolator or plug). It connects to your Wi-Fi and talks to HomeChat. Nothing visible changes in your home — your walls and fittings stay the same.",
  },
  {
    q: "Where is HomeChat available?",
    a: AVAILABILITY_LINE + " Other countries: get in touch and we'll check availability.",
  },
  {
    q: "How do the payment options work?",
    a: "It's a one-time cost for hardware and professional installation — not a subscription. Pay it once, or split the same amount over 4 monthly payments. Nothing to cancel later.",
  },
  {
    q: "How long does installation take?",
    a: "Usually 1–2 hours per device. A certified electrician fits the controller, tests it and walks you through your first WhatsApp messages before leaving.",
  },
];

/* ---------- Reveal ---------- */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[350ms] ease-out motion-reduce:transition-none ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- Compact WhatsApp demo ---------- */
type Msg = { from: "me" | "them"; text: string };
const SCRIPT: Msg[] = [
  { from: "me", text: "Is the geyser on right now?" },
  { from: "them", text: "It's off at the moment." },
  { from: "me", text: "Switch it on — I need a shower." },
  { from: "them", text: "Done. It's heating now." },
  { from: "me", text: "Set it for every weekday at 6am too." },
  { from: "them", text: "Got it — weekday 6am schedule saved." },
];
const TIMES = ["09:41", "09:41", "09:42", "09:42", "09:43", "09:43"];
const REACTION_MSG_INDEX = 3;

type Step = { type: "delay"; ms: number } | { type: "typing"; on: boolean } | { type: "send"; index: number };
function buildSteps(): Step[] {
  const s: Step[] = [];
  SCRIPT.forEach((m, i) => {
    if (m.from === "them") {
      s.push({ type: "delay", ms: 400 });
      s.push({ type: "typing", on: true });
      s.push({ type: "delay", ms: 700 });
      s.push({ type: "typing", on: false });
    }
    s.push({ type: "delay", ms: 250 });
    s.push({ type: "send", index: i });
    s.push({ type: "delay", ms: 700 });
  });
  return s;
}
const STEPS = buildSteps();

function DoubleCheck({ read }: { read: boolean }) {
  return (
    <svg
      viewBox="0 0 16 15"
      className={`w-[13px] h-[9px] ${read ? "text-[#53BDEB]" : "text-neutral-400"}`}
      fill="currentColor"
      aria-hidden
    >
      <path d="M10.91 3.316l-.478-.372a.365.365 0 00-.51.063L4.566 9.879a.32.32 0 01-.484.033L1.891 7.769a.366.366 0 00-.515.006l-.423.433a.364.364 0 00.006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 00-.063-.51z" />
      <path d="M15.61 3.316l-.478-.372a.365.365 0 00-.51.063L9.32 9.879a.32.32 0 01-.484.033l-.358-.325a.365.365 0 00-.484.032l-.372.472a.364.364 0 00.032.516l1.19 1.081c.144.14.362.125.484-.033l6.272-8.048a.365.365 0 00-.064-.51z" />
    </svg>
  );
}

function CompactDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visibleIdx, setVisibleIdx] = useState<number[]>([]);
  const [typing, setTyping] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [muted, setMuted] = useState(true);

  const stepIRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(0);
  const startedAtRef = useRef(0);
  const soundArmedRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const runStep = useCallback(() => {
    while (stepIRef.current < STEPS.length) {
      const step = STEPS[stepIRef.current++];
      if (step.type === "typing") {
        setTyping(step.on);
        continue;
      }
      if (step.type === "send") {
        setVisibleIdx((v) => (v.includes(step.index) ? v : [...v, step.index]));
        if (step.index === REACTION_MSG_INDEX) {
          const v = videoRef.current;
          if (v) {
            v.muted = !soundArmedRef.current;
            setMuted(!soundArmedRef.current);
            v.play().catch(() => {
              v.muted = true;
              setMuted(true);
              v.play().catch(() => {});
            });
          }
        }
        continue;
      }
      startedAtRef.current = Date.now();
      remainingRef.current = step.ms;
      timerRef.current = setTimeout(runStep, step.ms);
      return;
    }
    setPlaying(false);
    setFinished(true);
    setTyping(false);
  }, []);

  const start = useCallback(() => {
    clearTimer();
    stepIRef.current = 0;
    setVisibleIdx([]);
    setTyping(false);
    setFinished(false);
    setPlaying(true);
    runStep();
  }, [runStep]);

  const pause = () => {
    clearTimer();
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    videoRef.current?.pause();
    setPlaying(false);
  };

  const resume = () => {
    setPlaying(true);
    const v = videoRef.current;
    if (v && v.currentTime > 0 && !v.ended) v.play().catch(() => {});
    if (remainingRef.current > 0) {
      startedAtRef.current = Date.now();
      timerRef.current = setTimeout(runStep, remainingRef.current);
    } else runStep();
  };

  const toggle = () => {
    if (finished) {
      const v = videoRef.current;
      if (v) {
        try {
          v.currentTime = 0.01;
        } catch {}
        v.pause();
      }
      start();
      return;
    }
    if (playing) pause();
    else if (visibleIdx.length === 0) {
      soundArmedRef.current = true;
      start();
    } else resume();
  };

  useEffect(() => () => clearTimer(), []);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next) soundArmedRef.current = true;
    if (!next && v.currentTime > 0 && !v.ended) v.play().catch(() => {});
  };

  const lastThemVisible = Math.max(-1, ...visibleIdx.filter((i) => SCRIPT[i].from === "them"));

  return (
    <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
      <div className="relative rounded-3xl overflow-hidden shadow-soft bg-black aspect-[4/5] md:aspect-[4/5]">
        <video
          ref={videoRef}
          src={reactionVideo.url}
          preload="metadata"
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/55 backdrop-blur text-white flex items-center justify-center"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      <div>
        <div className="rounded-3xl overflow-hidden border border-border/40 shadow-soft max-w-sm mx-auto" style={{ backgroundColor: "#ECE5DD" }}>
          <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: "#075E54", color: "white" }}>
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-semibold">G</div>
            <div>
              <div className="text-sm font-semibold leading-tight">HomeChat</div>
              <div className="text-[11px] text-white/80 h-[14px]">{typing ? "typing…" : "online"}</div>
            </div>
          </div>
          <div
            className="px-3 py-4 space-y-1.5 min-h-[300px]"
            style={{
              backgroundImage: "radial-gradient(oklch(0 0 0 / 0.04) 1px, transparent 1px)",
              backgroundSize: "14px 14px",
            }}
          >
            {visibleIdx.map((idx) => {
              const m = SCRIPT[idx];
              const isMe = m.from === "me";
              const read = isMe && idx < lastThemVisible;
              return (
                <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"} animate-[fadeRise_.4s_ease-out_both]`}>
                  <div
                    className="relative max-w-[80%] px-3 pt-1.5 pb-1 text-[13.5px] leading-snug shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] rounded-2xl"
                    style={{ backgroundColor: isMe ? "#DCF8C6" : "#FFFFFF", color: "#111b21" }}
                  >
                    <span className="pr-12">{m.text}</span>
                    <span className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-neutral-500 leading-none">
                      <span>{TIMES[idx]}</span>
                      {isMe && <DoubleCheck read={read} />}
                    </span>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3 py-2 flex gap-1 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]" style={{ backgroundColor: "#FFFFFF" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-[dot_1.2s_ease-in-out_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-[dot_1.2s_ease-in-out_.15s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-[dot_1.2s_ease-in-out_.3s_infinite]" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={toggle}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-xs font-medium shadow-soft"
          >
            {finished ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" /> Replay
              </>
            ) : playing ? (
              <>
                <Pause className="w-3.5 h-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> Play demo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Country selector ---------- */
function CountrySelector({
  country,
  setCountry,
}: {
  country: CountryCode;
  setCountry: (c: CountryCode) => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-2 py-1 text-xs">
      <span className="pl-2 text-muted-foreground">Country</span>
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value as CountryCode)}
        className="bg-transparent focus:outline-none pr-2 py-1"
      >
        {(Object.keys(COUNTRY_PRICING) as CountryCode[]).map((c) => (
          <option key={c} value={c}>
            {COUNTRY_PRICING[c].flag} {COUNTRY_PRICING[c].label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- Floating WhatsApp ---------- */
function FloatingWA({ country, device }: { country: CountryCode; device: DeviceId | null }) {
  return (
    <a
      href={wa(WA_HELLO)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        track({
          event_name: "whatsapp_clicked",
          funnel_step: "floating",
          selected_device: device,
          country,
        })
      }
      aria-label="Message us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-float text-white motion-safe:animate-[breathe_3s_ease-in-out_infinite]"
      style={{ backgroundColor: "#25D366" }}
    >
      <MessageCircle className="w-6 h-6" />
    </a>
  );
}

/* ---------- Page ---------- */
export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({
    links: [{ rel: "preload", as: "image", href: heroImg, fetchpriority: "high" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
});

function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDevice, setDrawerDevice] = useState<DeviceId | null>(null);
  const { country, setCountry, ready } = useCountry();
  const price = pricingFor(country);

  // First-touch capture + page_view + restore drawer if a session was in progress
  useEffect(() => {
    ensureUtmCapture();
    getSessionId();
    track({ event_name: "page_view", funnel_step: "hero", country });
    try {
      const raw = localStorage.getItem(DRAWER_STATE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as { device: DeviceId | null; step?: string };
        if (s?.device && s.step && s.step !== "done") {
          setDrawerDevice(s.device);
          setDrawerOpen(true);
          track({
            event_name: "drawer_restored_on_load",
            funnel_step: s.step,
            selected_device: s.device,
            country,
          });
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (ready) track({ event_name: "device_picker_viewed", funnel_step: "device", country });
  }, [ready, country]);

  const openDrawer = (device: DeviceId) => {
    setDrawerDevice(device);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <style>{`
        @keyframes fadeRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dot { 0%, 60%, 100% { opacity: .3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }
        @keyframes breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
      `}</style>

      {/* Nav */}
      <header className="fixed top-3 md:top-4 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-5xl">
        <div className="rounded-full bg-white/80 backdrop-blur-xl border border-white/80 shadow-soft pl-3 pr-3 md:pl-5 md:pr-5 py-2 md:py-3 flex items-center justify-between gap-3">
          <a href="#" className="flex items-center gap-2 font-medium min-w-0 text-neutral-900">
            <img src={logoAsset} alt="HomeChat" className="h-7 md:h-8 w-auto shrink-0" />
            <span className="hidden sm:inline truncate">HomeChat</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-sm text-neutral-700">
            <a href="#devices" className="hover:text-neutral-950">Devices</a>
            <a href="#pricing" className="hover:text-neutral-950">Pricing</a>
            <a href="#how" className="hover:text-neutral-950">How it works</a>
            <a href="#faq" className="hover:text-neutral-950">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            <CountrySelector country={country} setCountry={setCountry} />
            <a
              href={wa(WA_HELLO)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track({ event_name: "whatsapp_clicked", funnel_step: "nav", country })}
              className="hidden sm:inline-flex items-center rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-medium"
            >
              Talk to us
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/80 bg-white/80 text-neutral-900"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden mt-3 flex flex-col items-end gap-2">
            {[
              { href: "#devices", label: "Devices" },
              { href: "#pricing", label: "Pricing" },
              { href: "#how", label: "How it works" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-right text-neutral-900 bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_4px_16px_rgba(0,0,0,0.12)] [text-shadow:0_1px_2px_rgba(255,255,255,0.6)]"
              >
                {l.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* 1. Hero */}
      <section className="relative h-[70svh] min-h-[480px] w-full overflow-hidden">
        <img
          src={heroImg}
          alt="A calm, softly lit home"
          width={1920}
          height={1080}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
        <div className="relative z-10 h-full max-w-6xl mx-auto px-6 flex items-end md:items-center pt-20 md:pt-0 pb-10 md:pb-0">
          <div className="max-w-2xl text-white space-y-4 md:space-y-5">
            <div className="inline-flex items-center rounded-full bg-white/15 backdrop-blur border border-white/30 px-3 py-1 text-[11px] tracking-wide uppercase">
              A conversation, not a control panel
            </div>
            <h1 className="text-[2rem] leading-[1.08] sm:text-5xl md:text-6xl tracking-tight">
              Talk to your home
              <br />
              <span className="italic text-white/85">on WhatsApp.</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-xl leading-relaxed">
              Lights, geyser, plugs and more — start with one device today. An electrician installs it. You control everything by simple chat.
            </p>
            <p className="text-xs sm:text-sm text-white/75 max-w-xl leading-relaxed">
              Turn things on and off, set schedules, and see usage — all from the WhatsApp you already use every day. No new app to learn.
            </p>
            <p className="text-[11px] sm:text-xs text-white/60 max-w-xl">{AVAILABILITY_LINE}</p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href="#devices"
                onClick={() => track({ event_name: "cta_clicked", funnel_step: "hero", country, metadata: { cta: "choose_a_device" } })}
                className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-3 text-sm font-medium shadow-soft"
              >
                Choose a device
              </a>
              <a
                href={wa(WA_HELLO)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track({ event_name: "whatsapp_clicked", funnel_step: "hero", country })}
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-white"
                style={{ backgroundColor: "#25D366" }}
              >
                Talk to us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Device picker */}
      <section id="devices" className="py-12 md:py-20 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <Reveal className="max-w-2xl mb-6 md:mb-10">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-3">Step one</div>
            <h2 className="text-2xl md:text-4xl leading-tight">What would you like to control?</h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Tap a device — we'll send you the exact price and availability in your area.
            </p>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
            {DEVICES.map((d) => {
              const tone =
                d.status === "Available now"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-amber-50 text-amber-800 border-amber-200";
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => openDrawer(d.id as DeviceId)}
                  className="group text-left rounded-2xl border border-border/60 bg-card p-4 md:p-5 shadow-soft hover:-translate-y-0.5 hover:shadow-float transition-all"
                >
                  <div className="text-2xl md:text-3xl mb-2">{d.icon}</div>
                  <div className="text-sm md:text-base font-medium">{d.label}</div>
                  <div className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tone}`}>
                    {d.status}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Merged benefits row */}
          <div className="mt-8 grid grid-cols-3 gap-3 md:gap-6 text-center">
            {[
              { Icon: MessagesSquare, label: "Control naturally" },
              { Icon: Clock, label: "Set schedules" },
              { Icon: Gauge, label: "See usage" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Pricing (merged with "Choose your first smart device") */}
      <section id="pricing" className="py-12 md:py-20 px-6 bg-secondary/40">
        <div className="max-w-4xl mx-auto">
          <Reveal className="max-w-2xl mb-6 md:mb-10">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-3">Pricing</div>
            <h2 className="text-2xl md:text-4xl leading-tight">One clear price per device.</h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Hardware and professional installation, together in one price. Pay it once, or split it over four months.
            </p>
            <div className="mt-3 inline-flex items-center rounded-full border border-border/60 bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
              One-time cost · not a subscription
            </div>
          </Reveal>

          <div className="rounded-3xl border border-border/60 bg-card p-5 md:p-8 shadow-soft space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  {price.flag} {price.label}
                </div>
                <div className="text-sm text-muted-foreground">Per device installed</div>
              </div>
              <CountrySelector country={country} setCountry={setCountry} />
            </div>

            {price.quoteOnly ? (
              <div className="rounded-2xl border border-border/60 p-6 text-center">
                <div className="text-2xl md:text-3xl font-medium">Get a local quote</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  We'll match you with a partner installer where possible.
                </p>
                <a
                  href={wa(WA_HELLO)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track({ event_name: "whatsapp_clicked", funnel_step: "pricing_quote", country })}
                  className="mt-4 inline-flex items-center rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium"
                >
                  Request a quote
                </a>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/60 p-5">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Pay once</div>
                  <div className="mt-2 text-3xl md:text-4xl font-medium">{price.upfront}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Hardware + installation</div>
                </div>
                <div className="rounded-2xl border border-border/60 p-5 bg-primary text-primary-foreground">
                  <div className="text-xs uppercase tracking-widest opacity-80">Pay over 4 months</div>
                  <div className="mt-2 text-3xl md:text-4xl font-medium">
                    {price.instalment}
                    <span className="text-sm font-normal opacity-80">/mo</span>
                  </div>
                  <div className="mt-1 text-xs opacity-80">
                    {price.instalments} monthly payments · hardware + installation only
                  </div>
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3">
              {DEVICES.filter((d) => d.status === "Available now").map((d) => (
                <button
                  key={d.id}
                  onClick={() => openDrawer(d.id as DeviceId)}
                  className="rounded-2xl border border-border/60 bg-background p-4 text-left hover:-translate-y-0.5 hover:shadow-float transition-all"
                >
                  <div className="text-xl">{d.icon}</div>
                  <div className="mt-2 text-sm font-medium">Start with {d.label}</div>
                  <div className="mt-2 text-xs text-muted-foreground">Get my price →</div>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-muted-foreground">
              {AVAILABILITY_LINE} Gates & security are fitted after a custom assessment of your existing equipment.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Compact demo */}
      <section id="demo" className="py-12 md:py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <Reveal className="max-w-2xl">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-3">See it work</div>
            <h2 className="text-2xl md:text-4xl leading-tight">A conversation, not a control panel.</h2>
            <p className="mt-3 text-sm md:text-base text-muted-foreground">
              Watch a real WhatsApp conversation controlling a geyser and lights — press play to see exactly what your chat will look like.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
              <li>· Say what you want in plain words.</li>
              <li>· Get instant confirmation back.</li>
              <li>· Set schedules by chatting, not tapping menus.</li>
              <li>· Especially useful for your geyser — see what it actually costs and stop wasting electricity.</li>
            </ul>
          </Reveal>
          <CompactDemo />
        </div>
      </section>

      {/* 5. Three-step install */}
      <section id="how" className="py-12 md:py-20 px-6 bg-secondary/40">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-8 md:mb-12">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-3">How it works</div>
            <h2 className="text-2xl md:text-4xl">From order to first message.</h2>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              { n: "01", title: "You choose what to control", body: "Pick lights, geyser, plugs or gates. Start with one — add more when you're ready." },
              { n: "02", title: "A certified electrician installs it", body: "Usually 1–2 hours. Neat, safe wiring behind your existing switch, geyser or plug." },
              { n: "03", title: "You chat with HomeChat on WhatsApp", body: "Turn things on and off, set schedules, and check usage — right from your normal chats." },
            ].map((s) => (
              <div key={s.n} className="text-center md:text-left">
                <div className="w-12 h-12 mx-auto md:mx-0 rounded-full bg-background border border-border flex items-center justify-center text-xs tracking-widest text-muted-foreground mb-3">
                  {s.n}
                </div>
                <h3 className="text-lg md:text-xl leading-snug">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="py-12 md:py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-8">
            <div className="text-xs text-muted-foreground uppercase tracking-[0.25em] mb-3">FAQ</div>
            <h2 className="text-2xl md:text-4xl">Common questions.</h2>
          </Reveal>
          <div className="space-y-3">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className={`rounded-2xl border border-border/60 bg-card ${open ? "shadow-soft" : ""}`}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="w-full flex items-center justify-between text-left px-5 py-4"
                    aria-expanded={open}
                  >
                    <span className="text-sm md:text-base font-medium pr-4">{f.q}</span>
                    <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Small AI Q&A affordance */}
          <div className="mt-8">
            <div className="text-xs text-muted-foreground mb-2">Still have a question?</div>
            <QualifyChat device={null} country={country} />
          </div>
        </div>
      </section>

      {/* 7. Compact final CTA */}
      <section className="py-12 md:py-16 px-6 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-2xl md:text-4xl leading-tight">Ready to start?</h2>
          <p className="text-sm md:text-base opacity-85">
            Pick a device and we'll send your price and installation details.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#devices"
              className="inline-flex items-center justify-center rounded-full bg-white text-black px-6 py-3 text-sm font-medium"
            >
              Get my price
            </a>
            <a
              href={wa(WA_HELLO)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track({ event_name: "whatsapp_clicked", funnel_step: "final", country })}
              className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-white"
              style={{ backgroundColor: "#25D366" }}
            >
              Talk to us
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 px-6 border-t border-border/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src={logoAsset} alt="HomeChat" className="h-6 w-auto" />
            <span className="text-foreground font-medium">HomeChat</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-foreground">Privacy</a>
            <a href="/terms" className="hover:text-foreground">Terms</a>
          </div>
          <p>© {new Date().getFullYear()} HomeChat</p>
        </div>
      </footer>

      <FloatingWA country={country} device={drawerDevice} />
      <LeadDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        device={drawerDevice}
        country={country}
      />
    </div>
  );
}
